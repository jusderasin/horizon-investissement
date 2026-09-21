"use client";

import { useEffect, useState } from "react";
import { createClient, hasSupabaseConfig } from "../../../lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState("checking");
  const [message, setMessage] = useState("");
  const configured = hasSupabaseConfig();

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setState("ready");
    });
    supabase.auth.getSession().then(({ data }) => setState(data.session ? "ready" : "checking"));
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  async function submit(event) {
    event.preventDefault();
    if (password.length < 8) {
      setState("error");
      setMessage("Choisissez un mot de passe d'au moins 8 caractères.");
      return;
    }
    if (password !== confirmation) {
      setState("error");
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setState("saving");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setState("error");
      setMessage("Ce lien n'est plus valide. Demandez-en un nouveau depuis la page de connexion.");
      return;
    }
    window.location.assign("/espace");
  }

  return <main className="auth-page">
    <a href="/auth">← Retour à la connexion</a>
    <section>
      <small>HORIZON ID</small>
      <h1>Choisissez votre mot de passe.</h1>
      <p>Cette étape est nécessaire une seule fois. Vous utiliserez ensuite votre email et ce mot de passe pour vous connecter.</p>
      {configured ? <form onSubmit={submit}>
        <label>Nouveau mot de passe<input required minLength="8" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caractères minimum" /></label>
        <label>Confirmer le mot de passe<input required minLength="8" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Retapez votre mot de passe" /></label>
        <button disabled={state === "saving" || state === "checking"}>{state === "saving" ? "Enregistrement…" : state === "checking" ? "Vérification du lien…" : "Enregistrer mon mot de passe"}</button>
        {state === "error" && <p className="auth-error">{message}</p>}
      </form> : <p className="auth-error">La configuration Supabase est indisponible.</p>}
      <p className="auth-note">Ne partagez jamais ce mot de passe. Horizon ne vous demandera jamais vos identifiants de courtier.</p>
    </section>
  </main>;
}
