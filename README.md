# Horizon Investissement

Terminal macro multi-actifs, construit avec Next.js 14 App Router, TypeScript strict et Supabase. La première tranche livre l’écran **Or** avec des signaux de démonstration, le widget TradingView officiel et le socle de données sécurisé.

## Démarrage en 10 minutes

1. Créez un projet Supabase puis copiez `.env.example` vers `.env.local`.
2. Renseignez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Gardez les clés secrètes uniquement côté serveur.
3. Installez la CLI Supabase et connectez votre projet : `supabase login && supabase link --project-ref votre-ref`.
4. Appliquez le schéma et le seed : `supabase db push`.
5. Installez les dépendances : `pnpm i`.
6. Démarrez l’application : `pnpm dev`.
7. Ouvrez `http://localhost:3000/gold`.
8. Vérifiez le typage : `pnpm typecheck`.
9. Poussez le dépôt sur GitHub.
10. Importez-le dans Vercel et configurez les variables `.env.example` nécessaires à votre phase de déploiement.

## Sécurité

- Les clés de fournisseurs de données et le `SUPABASE_SERVICE_ROLE_KEY` ne sont jamais exposés au navigateur.
- `profiles`, `lots`, `alerts` et `alert_history` sont protégés par RLS et filtrés par l’utilisateur connecté.
- Les tables de marché sont publiques en lecture seulement. Les Edge Functions avec rôle de service sont les seules à pouvoir les modifier.

## État du MVP

L’écran `/gold` utilise les valeurs mockées demandées (score 59, fourchette $4,121–$5,085, DXY et géopolitique) afin d’être visualisable sans clé. Les feeds, auth, Vault et alertes sont les prochaines itérations prévues.
