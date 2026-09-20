"use client";

import { useEffect, useState } from "react";

const defaults = { name: "", risk: "Modéré", threshold: 75, telegram: false, inApp: true, sectors: "", brokers: ["Trade Republic"] };
const brokers = [
  { name: "Trade Republic", url: "https://traderepublic.com/" },
  { name: "Revolut", url: "https://www.revolut.com/" },
  { name: "Interactive Brokers", url: "https://www.interactivebrokers.com/" },
];
const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;
const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL;

export default function Workspace() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [authIssue, setAuthIssue] = useState(false);

  useEffect(() => {
    try { setSettings({ ...defaults, ...JSON.parse(localStorage.getItem("horizon-personal-workspace") || "{}") }); } catch {}
    setAuthIssue(window.location.hash.includes("error="));
  }, []);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const save = () => { localStorage.setItem("horizon-personal-workspace", JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return <main className="workspace-page">
    <header>
      <a href="/">← Horizon</a>
      <div><small>ESPACE PERSONNEL</small><h1>Mon espace d’investissement</h1><p>Personnalisez votre recherche et vos canaux d’alerte. Horizon ne passe jamais d’ordre à votre place.</p></div>
    </header>
    {authIssue && <section className="workspace-authissue"><b>Le lien de connexion a expiré ou a déjà été utilisé.</b><span>Demande un nouveau lien : il est valable pour une seule connexion.</span><a href="/auth">Recevoir un nouveau lien sécurisé →</a></section>}
    <div className="workspace-grid">
      <section className="workspace-card">
        <small>PROFIL</small><h2>Préférences de recherche</h2>
        <label>Nom d’affichage<input value={settings.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex. Erwann" /></label>
        <label>Profil de risque<select value={settings.risk} onChange={(e) => update("risk", e.target.value)}><option>Prudent</option><option>Modéré</option><option>Dynamique</option></select></label>
        <label>Secteurs à éviter<input value={settings.sectors} onChange={(e) => update("sectors", e.target.value)} placeholder="Ex. tabac, armement" /></label>
      </section>
      <section className="workspace-card">
        <small>ALERTES PERSONNELLES</small><h2>Ce qui mérite une notification</h2>
        <label className="range">Score minimum <b>{settings.threshold}/100</b><input type="range" min="50" max="95" value={settings.threshold} onChange={(e) => update("threshold", Number(e.target.value))} /></label>
        <div className="switch static"><span><b>Discord Horizon</b><small>Actualités et signaux globaux du groupe</small></span>{discordUrl ? <a className="community-link" href={discordUrl} target="_blank" rel="noreferrer">Rejoindre ↗</a> : <em>Invitation à ajouter</em>}</div>
        <label className="switch"><span><b>Telegram</b><small>Vos alertes privées, selon vos critères</small></span><input type="checkbox" checked={settings.telegram} onChange={(e) => update("telegram", e.target.checked)} /><i /></label>
        {settings.telegram && <div className="telegram-setup">{telegramUrl ? <a href={telegramUrl} target="_blank" rel="noreferrer">Connecter mon bot personnel ↗</a> : <span>Le bot Telegram personnel sera disponible dès que son lien sera configuré.</span>}</div>}
        <label className="switch"><span><b>Dans Horizon</b><small>Notifications dans votre espace personnel</small></span><input type="checkbox" checked={settings.inApp} onChange={(e) => update("inApp", e.target.checked)} /><i /></label>
      </section>
      <section className="workspace-card community-card">
        <small>COMMUNAUTÉ HORIZON</small><h2>Deux canaux, deux usages</h2>
        <div className="community-row"><b>Discord</b><p>Le canal commun : news, brief quotidien, nouveaux signaux et échanges avec la communauté.</p>{discordUrl ? <a href={discordUrl} target="_blank" rel="noreferrer">Rejoindre le Discord ↗</a> : <span>Le lien d’invitation sera ajouté par l’administrateur.</span>}</div>
        <div className="community-row"><b>Telegram</b><p>Le canal privé : chaque membre peut choisir ses seuils, actifs et fréquence de notification.</p>{telegramUrl ? <a href={telegramUrl} target="_blank" rel="noreferrer">Configurer mon Telegram ↗</a> : <span>Prochaine étape : création du bot personnel.</span>}</div>
      </section>
      <section className="workspace-card">
        <small>PASSERELLES COURTIERS</small><h2>Ouvrir, jamais exécuter</h2><p>Horizon ouvre seulement un site externe. Les ordres, vérifications et conditions restent chez votre courtier.</p>
        {brokers.map((broker) => <label className="broker" key={broker.name}><input type="checkbox" checked={settings.brokers.includes(broker.name)} onChange={(e) => update("brokers", e.target.checked ? [...settings.brokers, broker.name] : settings.brokers.filter((item) => item !== broker.name))} /><span>{broker.name}</span><a href={broker.url} target="_blank" rel="noreferrer">Ouvrir ↗</a></label>)}
      </section>
      <section className="workspace-card roadmap">
        <small>SYNCHRONISATION</small><h2>Préférences enregistrées</h2><p>Pour le moment, elles sont conservées sur cet appareil. Une fois connecté avec le lien valide, elles pourront être synchronisées dans ton compte sécurisé.</p><button onClick={save}>{saved ? "✓ Préférences enregistrées" : "Enregistrer sur cet appareil"}</button>
      </section>
    </div>
  </main>;
}
