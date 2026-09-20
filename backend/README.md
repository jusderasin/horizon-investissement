# Backend — étapes 1 & 2

## Base de données

`database/schema.sql` crée les actifs, la provenance, les états financiers bruts, les ratios calculés et l'historique immuable des exécutions du screener. Les résultats stockent également les raisons et le niveau de confiance : aucune recommandation ne peut donc être affichée sans sa trace de calcul.

```powershell
psql $env:DATABASE_URL -f database/schema.sql
```

## Screener local

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python backend\screener.py --tickers backend\tickers.example.txt --output screening-results.json
```

Le script utilise Yahoo Finance, conserve les métriques absentes à `null`, produit un JSON sourcé et applique des règles explicites de qualité financière. Le score est une priorisation de recherche, pas un conseil d'investissement. Les données Yahoo Finance doivent être utilisées selon leurs conditions d'utilisation.
