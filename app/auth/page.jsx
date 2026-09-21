"use client";

import { useState } from "react";
import { createClient, hasSupabaseConfig } from "../../lib/supabase/client";

const initialMessage = {
  signin: "Connectez-vous avec votre adresse email et votre mot de passe.",
  signup: "Créez votre accès Horizon une seule fois. Un email de confirmation peut être demandé.",
  recovery: "Recevez un lien unique pour créer ou réinitialiser votre mot de passe.",
};

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const configured = hasSupabaseConfig();

  function chooseMode(nextMode) {
    setMode(nextMode);
    setState("idle");
    setMessage("");
    setPassword("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!configured) return;

    setState("sending");
    setMessage("");
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setState("error");
        setMessage("Email ou mot de passe incorrect. Si c'est votre premier accès, créez ou réinitialisez votre mot de passe.");
        return;
      }
      window.location.assign("/espace");
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/espace` },
      });
      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }
      if (data.session) {
        window.location.assign("/espace");
        return;
      }
      setState("sent");
      setMessage("Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous avec ce mot de passe.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setState(error ? "error" : "sent");
    setMessage(error ? error.message : "Si cette adresse possède un compte, un email sécurisé vient d'être envoyé.");
  }

  const isRecovery = mode === "recovery";

  return <main className="auth-page">
    <a href="/">← Retour à Horizon</a>
    <section>
      <small>HORIZON ID</small>
      <h1>{mode === "signin" ? "Bon retour parmi nous." : mode === "signup" ? "Créez votre espace." : "Définissez votre mot de passe."}</h1>
      <p>{initialMessage[mode]}</p>
      {configured ? <>
        <div className="auth-tabs" role="tablist" aria-label="Choisir un mode de connexion">
          <button className={mode === "signin" ? "selected" : ""} type="button" onClick={() => chooseMode("signin")}>Connexion</button>
          <button className={mode === "signup" ? "selected" : ""} type="button" onClick={() => chooseMode("signup")}>Créer un compte</button>
        </div>
        <form onSubmit={submit}>
          <label>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" /></label>
          {!isRecovery && <label>Mot de passe<input required minLength="8" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caractères minimum" /></label>}
          <button disabled={state === "sending"}>{state === "sending" ? "Veuillez patienter…" : mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien sécurisé"}</button>
          {state === "sent" && <p className="auth-success">{message}</p>}
          {state === "error" && <p className="auth-error">{message}</p>}
        </form>
        <button className="auth-recovery" type="button" onClick={() => chooseMode(isRecovery ? "signin" : "recovery")}>{isRecovery ? "Revenir à la connexion" : "Première connexion ou mot de passe oublié ?"}</button>
      </> : <div className="auth-config"><b>Connexion en attente de configuration</b><p>Ajoutez les deux variables Supabase dans Vercel, puis cette page devient immédiatement active.</p><code>NEXT_PUBLIC_SUPABASE_URL</code><code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></div>}
      <p className="auth-note">Votre session reste active sur cet appareil. Horizon ne conserve jamais les identifiants de courtier.</p>
    </section>
  </main>;
}
