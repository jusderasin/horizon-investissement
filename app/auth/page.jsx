"use client";

import { useState } from "react";
import { createClient, hasSupabaseConfig } from "../../lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const configured = hasSupabaseConfig();
  const submit = async (event) => {
    event.preventDefault();
    if (!configured) return;
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/espace` } });
    setState(error ? "error" : "sent");
  };
  return <main className="auth-page"><a href="/">← Retour à Horizon</a><section><small>HORIZON ID</small><h1>Votre espace, partout.</h1><p>Connectez-vous avec un lien sécurisé envoyé par email. Aucun mot de passe à mémoriser.</p>{configured ? <form onSubmit={submit}><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com"/></label><button disabled={state === "sending"}>{state === "sending" ? "Envoi…" : "Recevoir mon lien sécurisé"}</button>{state === "sent" && <p className="auth-success">Vérifiez votre boîte mail : le lien de connexion vient d’être envoyé.</p>}{state === "error" && <p className="auth-error">Impossible d’envoyer le lien. Vérifiez la configuration Supabase.</p>}</form> : <div className="auth-config"><b>Connexion en attente de configuration</b><p>Ajoutez les deux variables Supabase dans Vercel, puis cette page devient immédiatement active.</p><code>NEXT_PUBLIC_SUPABASE_URL</code><code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></div>}<p className="auth-note">La connexion sécurise les préférences, watchlists et alertes personnelles. Horizon ne conserve jamais les identifiants de courtier.</p></section></main>;
}
