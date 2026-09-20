#!/usr/bin/env python3
"""Fetch source-tagged fundamentals from Yahoo Finance and apply Horizon's base filter.

This script produces JSON; persistence belongs to the API worker in the next phase.
It deliberately returns missing metrics as null instead of inventing values.
"""
from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yfinance as yf

ALGORITHM_VERSION = "fundamental-v1"


def number(value: Any) -> float | None:
    """Convert Yahoo values to finite floats while preserving unknown values."""
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


def divide(numerator: float | None, denominator: float | None) -> float | None:
    return numerator / denominator if numerator is not None and denominator not in (None, 0) else None


def statement_values(frame: Any, row: str) -> list[float]:
    """Return annual values oldest-to-newest for a Yahoo statement line item."""
    if frame is None or frame.empty or row not in frame.index:
        return []
    values = [number(value) for value in frame.loc[row].iloc[::-1].tolist()]
    return [value for value in values if value is not None]


def cagr(values: list[float], years: int) -> float | None:
    if len(values) <= years:
        return None
    start, end = values[-(years + 1)], values[-1]
    if start <= 0 or end <= 0:
        return None
    return (end / start) ** (1 / years) - 1


def score(metrics: dict[str, float | None]) -> dict[str, Any]:
    """Transparent rules; scores are research prioritisation, never investment advice."""
    reasons: list[str] = []
    long_term = 0.0
    medium_term = 0.0

    for metric, points, label in (
        ("revenue_cagr_3y", 20, "Croissance du chiffre d'affaires sur 3 ans >= 8%"),
        ("roe", 15, "ROE >= 15%"),
        ("net_margin", 10, "Marge nette >= 10%"),
        ("fcf_yield", 15, "Rendement FCF >= 3%"),
    ):
        thresholds = {"revenue_cagr_3y": .08, "roe": .15, "net_margin": .10, "fcf_yield": .03}
        if metrics.get(metric) is not None and metrics[metric] >= thresholds[metric]:
            long_term += points
            reasons.append(label)
    leverage = metrics.get("net_debt_to_ebitda")
    if leverage is not None and leverage <= 2.5:
        long_term += 20
        reasons.append("Dette nette / EBITDA <= 2,5x")
    if metrics.get("pe_ratio") is not None and 0 < metrics["pe_ratio"] <= 25:
        medium_term += 35
        reasons.append("PER positif <= 25")
    if metrics.get("ev_to_ebitda") is not None and 0 < metrics["ev_to_ebitda"] <= 15:
        medium_term += 35
        reasons.append("EV / EBITDA <= 15")
    if metrics.get("revenue_cagr_3y") is not None and metrics["revenue_cagr_3y"] >= .08:
        medium_term += 30

    available = sum(value is not None for value in metrics.values())
    confidence = round(100 * available / len(metrics), 2)
    long_term, medium_term = min(long_term, 100), min(medium_term, 100)
    total = round(long_term * .65 + medium_term * .35, 2)
    allocation_lt = round(100 * long_term / (long_term + medium_term), 2) if long_term + medium_term else 50.0
    passed = long_term >= 50 and confidence >= 60
    return {"passed_filter": passed, "global_score": total, "long_term_score": long_term,
            "medium_term_score": medium_term, "long_term_allocation": allocation_lt,
            "medium_term_allocation": round(100 - allocation_lt, 2), "confidence_score": confidence,
            "reasons": reasons}


def fetch_ticker(symbol: str) -> dict[str, Any]:
    ticker = yf.Ticker(symbol)
    info = ticker.info
    income, balance, cashflow = ticker.financials, ticker.balance_sheet, ticker.cashflow
    revenue = statement_values(income, "Total Revenue")
    net_income = statement_values(income, "Net Income")
    ebitda_values = statement_values(income, "EBITDA")
    ebit_values = statement_values(income, "EBIT")
    equity = statement_values(balance, "Stockholders Equity")
    assets = statement_values(balance, "Total Assets")
    liabilities = statement_values(balance, "Total Liabilities Net Minority Interest")
    current_assets = statement_values(balance, "Current Assets")
    current_liabilities = statement_values(balance, "Current Liabilities")
    retained_earnings = statement_values(balance, "Retained Earnings")
    total_debt = statement_values(balance, "Total Debt")
    cash = statement_values(balance, "Cash Cash Equivalents And Short Term Investments")
    operating_cf = statement_values(cashflow, "Operating Cash Flow")
    capex = statement_values(cashflow, "Capital Expenditure")
    latest = lambda values: values[-1] if values else None
    fcf = number(info.get("freeCashflow"))
    market_cap = number(info.get("marketCap"))
    latest_revenue, latest_income, latest_equity = latest(revenue), latest(net_income), latest(equity)
    latest_debt, latest_cash, latest_ebitda = latest(total_debt), latest(cash), latest(ebitda_values)
    latest_assets, latest_liabilities, latest_ebit = latest(assets), latest(liabilities), latest(ebit_values)
    working_capital = (latest(current_assets) or 0) - (latest(current_liabilities) or 0)
    computed_fcf = latest(operating_cf)
    latest_capex = latest(capex)
    if computed_fcf is not None and latest_capex is not None:
        computed_fcf += latest_capex  # Yahoo reports capex as a negative cash flow.
    metrics = {
        "pe_ratio": number(info.get("trailingPE")),
        "price_to_fcf": divide(market_cap, fcf or computed_fcf),
        "ev_to_ebitda": number(info.get("enterpriseToEbitda")),
        "roe": divide(latest_income, latest_equity),
        "roce": divide(latest_ebit, (latest_assets or 0) - (latest(current_liabilities) or 0)),
        "net_margin": divide(latest_income, latest_revenue),
        "revenue_cagr_3y": cagr(revenue, 3),
        "revenue_cagr_5y": cagr(revenue, 5),
        "net_debt_to_ebitda": divide((latest_debt or 0) - (latest_cash or 0), latest_ebitda),
        "fcf_yield": divide(fcf or computed_fcf, market_cap),
        "altman_z_score": (
            1.2 * (divide(working_capital, latest_assets) or 0)
            + 1.4 * (divide(latest(retained_earnings), latest_assets) or 0)
            + 3.3 * (divide(latest_ebit, latest_assets) or 0)
            + 0.6 * (divide(market_cap, latest_liabilities) or 0)
            + (divide(latest_revenue, latest_assets) or 0)
        ) if latest_assets and latest_liabilities else None,
        "price": number(info.get("currentPrice") or info.get("regularMarketPrice")),
        "market_cap": market_cap,
    }
    return {"ticker": symbol.upper(), "name": info.get("longName") or info.get("shortName"),
            "sector": info.get("sector"), "currency": info.get("currency"),
            "source": {"name": "Yahoo Finance", "url": f"https://finance.yahoo.com/quote/{symbol}"},
            "fetched_at": datetime.now(timezone.utc).isoformat(), "metrics": metrics,
            "screening": score(metrics)}


def read_symbols(path: Path) -> list[str]:
    return [line.strip().upper() for line in path.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")]


def main() -> int:
    parser = argparse.ArgumentParser(description="Horizon fundamental screener")
    parser.add_argument("--tickers", type=Path, required=True, help="Text file: one ticker per line")
    parser.add_argument("--output", type=Path, default=Path("screening-results.json"))
    args = parser.parse_args()
    results, errors = [], []
    for symbol in read_symbols(args.tickers):
        try:
            results.append(fetch_ticker(symbol))
        except Exception as error:  # Preserve other tickers when a provider response fails.
            errors.append({"ticker": symbol, "error": str(error)})
    payload = {"algorithm_version": ALGORITHM_VERSION, "generated_at": datetime.now(timezone.utc).isoformat(),
               "results": results, "errors": errors}
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"{len(results)} result(s), {len(errors)} error(s) -> {args.output}")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
