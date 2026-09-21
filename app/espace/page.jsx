"use client";

import { useEffect, useState } from "react";
import { createClient, hasSupabaseConfig } from "../../lib/supabase/client";

const defaults = { name: "", risk: "Modéré", threshold: 75, telegram: false, inApp: true, sectors: "", brokers: ["Trade Republic"] };
const brokers = [{ name: "Trade Republic", url: "https://traderepublic.com/" }, { name: "Revolut", url: "https://www.revolut.com/" }, { name: "Interactive Brokers", url: "https://www.interactivebrokers.com/" }];
const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/jNrcA5zzp";

export default function Workspace() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [authIssue, setAuthIssue] = useState(false);
  const [telegramPairing, setTelegramPairing] = useState("");
  const [telegramMessage, setTelegramMessage] = useState("");
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    try { setSettings({ ...defaults, ...JSON.parse(localStorage.getItem("horizon-personal-workspace") || "{}") }); } catch {}
    setAuthIssue(window.location.hash.includes("error="));
  }, []);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async () => {
    localStorage.setItem("horizon-personal-workspace", JSON.stringify(settings));
    if (hasSupabaseConfig()) {
      const { data: { session } } = await createClient().auth.getSession();
      if (session) await fetch("/api/preferences", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(settings) });
    }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };
  const connectTelegram = async () => {
    if (!hasSupabaseConfig()) return;
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) { setTelegramMessage("Connectez-vous d’abord à Horizon pour associer votre Telegram en sécurité."); return; }
    setTelegramMessage("Création du lien sécurisé...");
    const response = await fetch("/api/telegram/connect", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    const data = await response.json();
    if (!response.ok) { setTelegramMessage(data.message || "Impossible de créer le lien Telegram."); return; }
    setTelegramPairing(data.url);
    setTelegramMessage("Ouvrez Telegram puis appuyez sur Start. Le lien expire dans 10 minutes.");
  };
  const testTelegram = async () => {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) { setTelegramMessage("Connectez-vous d’abord à Horizon."); return; }
    setTestingTelegram(true);
    const response = await fetch("/api/alerts/test", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    const data = await response.json();
    setTelegramMessage(data.message || "Test terminé.");
    setTestingTelegram(false);
  };

  return <main className="workspace-page">
    <header><a href="/">← Horizon</a><div><small>ESPACE PERSONNEL</small><h1>Mon espace d’investissement</h1><p>Personnalisez votre recherche et vos canaux d’alerte. Horizon ne passe jamais d’ordre à votre place.</p></div></header>
    {authIssue && <section className="workspace-authissue"><b>Le lien de connexion a expiré ou a déjà été utilisé.</b><span>Demande un nouveau lien : il est valable pour une seule connexion.</span><a href="/auth">Recevoir un nouveau lien sécurisé →</a></section>}
    <div className="workspace-grid">
      <section className="workspace-card"><small>PROFIL</small><h2>Préférences de recherche</h2><label>Nom d’affichage<input value={settings.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex. Erwann" /></label><label>Profil de risque<select value={settings.risk} onChange={(e) => update("risk", e.target.value)}><option>Prudent</option><option>Modéré</option><option>Dynamique</option></select></label><label>Secteurs à éviter<input value={settings.sectors} onChange={(e) => update("sectors", e.target.value)} placeholder="Ex. tabac, armement" /></label></section>
      <section className="workspace-card"><small>ALERTES PERSONNELLES</small><h2>Ce qui mérite une notification</h2><label className="range">Score minimum <b>{settings.threshold}/100</b><input type="range" min="50" max="95" value={settings.threshold} onChange={(e) => update("threshold", Number(e.target.value))} /></label><div className="switch static"><span><b>Discord Horizon</b><small>Actualités et signaux globaux du groupe</small></span><a className="community-link" href={discordUrl} target="_blank" rel="noreferrer">Rejoindre ↗</a></div><label className="switch"><span><b>Telegram</b><small>Vos alertes privées, selon vos critères</small></span><input type="checkbox" checked={settings.telegram} onChange={(e) => update("telegram", e.target.checked)} /><i /></label>{settings.telegram && <div className="telegram-setup">{telegramPairing ? <a href={telegramPairing} target="_blank" rel="noreferrer">Ouvrir Telegram et associer mon compte ↗</a> : <button type="button" onClick={connectTelegram}>Associer mon Telegram privé</button>}<button type="button" onClick={testTelegram} disabled={testingTelegram}>{testingTelegram ? "Envoi..." : "Envoyer une alerte test"}</button><span>{telegramMessage || "L’association sécurisée est nécessaire avant la première alerte privée."}</span></div>}<label className="switch"><span><b>Dans Horizon</b><small>Notifications dans votre espace personnel</small></span><input type="checkbox" checked={settings.inApp} onChange={(e) => update("inApp", e.target.checked)} /><i /></label></section>
      <section className="workspace-card community-card"><small>COMMUNAUTÉ HORIZON</small><h2>Deux canaux, deux usages</h2><div className="community-row"><b>Discord</b><p>Le canal commun : news, brief quotidien, nouveaux signaux et échanges avec la communauté.</p><a href={discordUrl} target="_blank" rel="noreferrer">Rejoindre le Discord ↗</a></div><div className="community-row"><b>Telegram</b><p>Le canal privé : chaque membre peut choisir ses seuils, actifs et fréquence de notification.</p><span>Associez votre compte dans la section Alertes.</span></div></section>
      <section className="workspace-card"><small>PASSERELLES COURTIERS</small><h2>Ouvrir, jamais exécuter</h2><p>Horizon ouvre seulement un site externe. Les ordres, vérifications et conditions restent chez votre courtier.</p>{brokers.map((broker) => <label className="broker" key={broker.name}><input type="checkbox" checked={settings.brokers.includes(broker.name)} onChange={(e) => update("brokers", e.target.checked ? [...settings.brokers, broker.name] : settings.brokers.filter((item) => item !== broker.name))} /><span>{broker.name}</span><a href={broker.url} target="_blank" rel="noreferrer">Ouvrir ↗</a></label>)}</section>
      <section className="workspace-card roadmap"><small>SYNCHRONISATION</small><h2>Préférences enregistrées</h2><p>Pour le moment, elles sont conservées sur cet appareil. Une fois connecté avec le lien valide, elles pourront être synchronisées dans ton compte sécurisé.</p><button onClick={save}>{saved ? "✓ Préférences enregistrées" : "Enregistrer sur cet appareil"}</button></section>
    </div>
  </main>;
}
