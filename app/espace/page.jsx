"use client";

import { useEffect, useState } from "react";

const defaults = { name: "", risk: "Modéré", threshold: 75, discord: true, telegram: false, inApp: true, sectors: "", brokers: ["Trade Republic"] };
const brokers = [
  { name: "Trade Republic", url: "https://traderepublic.com/" },
  { name: "Revolut", url: "https://www.revolut.com/" },
  { name: "Interactive Brokers", url: "https://www.interactivebrokers.com/" },
];

export default function Workspace() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { setSettings({ ...defaults, ...JSON.parse(localStorage.getItem("horizon-personal-workspace") || "{}") }); } catch {} }, []);
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const save = () => { localStorage.setItem("horizon-personal-workspace", JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  return <main className="workspace-page"><header><a href="/">← Horizon</a><div><small>ESPACE PERSONNEL</small><h1>Mon espace d’investissement</h1><p>Ces préférences restent sur cet appareil jusqu’à l’activation de la connexion sécurisée.</p></div></header><div className="workspace-grid"><section className="workspace-card"><small>PROFIL</small><h2>Préférences de recherche</h2><label>Nom d’affichage<input value={settings.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex. Erwann"/></label><label>Profil de risque<select value={settings.risk} onChange={(e) => update("risk", e.target.value)}><option>Prudent</option><option>Modéré</option><option>Dynamique</option></select></label><label>Secteurs à éviter<input value={settings.sectors} onChange={(e) => update("sectors", e.target.value)} placeholder="Ex. tabac, armement"/></label></section><section className="workspace-card"><small>ALERTES PERSONNELLES</small><h2>Ce qui mérite une notification</h2><label className="range">Score minimum <b>{settings.threshold}/100</b><input type="range" min="50" max="95" value={settings.threshold} onChange={(e) => update("threshold", Number(e.target.value))}/></label>{[["discord", "Discord", "Le canal Horizon que vous avez relié"], ["telegram", "Telegram", "À connecter avec votre bot personnel"], ["inApp", "Dans Horizon", "Notifications dans l’espace personnel"]].map(([key, label, note]) => <label className="switch" key={key}><span><b>{label}</b><small>{note}</small></span><input type="checkbox" checked={settings[key]} onChange={(e) => update(key, e.target.checked)}/><i/></label>)}</section><section className="workspace-card"><small>PASSERELLES COURTIERS</small><h2>Ouvrir, jamais exécuter</h2><p>Horizon ouvre seulement un site externe. Les ordres, vérifications et conditions restent chez votre courtier.</p>{brokers.map((broker) => <label className="broker" key={broker.name}><input type="checkbox" checked={settings.brokers.includes(broker.name)} onChange={(e) => update("brokers", e.target.checked ? [...settings.brokers, broker.name] : settings.brokers.filter((item) => item !== broker.name))}/><span>{broker.name}</span><a href={broker.url} target="_blank" rel="noreferrer">Ouvrir ↗</a></label>)}</section><section className="workspace-card roadmap"><small>SYNCHRONISATION</small><h2>Prochaine couche : connexion</h2><p>La version multi-utilisateur utilisera une connexion par email/social login et enregistrera vos préférences, watchlists et alertes dans une base sécurisée.</p><button onClick={save}>{saved ? "✓ Préférences enregistrées" : "Enregistrer sur cet appareil"}</button></section></div></main>;
}
