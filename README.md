# Forum Nuxt

Base technique pour un forum SSR Nuxt avec PrimeVue, authentification côté
serveur et PostgreSQL via Prisma.

## Modules retenus

- `@primevue/nuxt-module` + `primevue` + `@primeuix/themes`
- `nuxt-auth-utils`
- `prisma` + `@prisma/client` + `@prisma/adapter-pg` + `pg`
- `@nuxt/eslint` + `eslint`
- `prettier`

## Scripts utiles

```bash
npm run dev
npm run dev:docker
npm run build
npm run preview
npm run typecheck
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run prisma:generate
npm run prisma:validate
npm run db:push
npm run db:migrate:deploy
```

## Démarrage local

```bash
npm install
npm run dev
```

## Démarrage Docker

Le setup de développement démarre Nuxt et PostgreSQL avec initialisation Prisma
automatique. Toutes les variables d'environnement passent par `.env`. Le fichier
`.env.example` sert de modèle. Images utilisées:

- Node: `24-bookworm-slim`
- PostgreSQL: `18-alpine`
- Adminer: `5.4.2`

```bash
cp .env.example .env
docker compose up --build
```

Application: `http://localhost:3400`

Adminer: `http://localhost:18080`

PostgreSQL:

- hôte: `db`
- port interne Docker: `5432`
- port exposé sur l'hôte: `55432` via `POSTGRES_HOST_PORT`
- base: `forum`
- utilisateur: `forum`
- mot de passe: `forum`

Notes:

- l'URL Postgres est recomposée en code à partir de `POSTGRES_*`
- `POSTGRES_PORT` est le port interne entre conteneurs ; `POSTGRES_HOST_PORT`
  sert uniquement à l'exposition sur ta machine
- avec Prisma 7, la connexion DB est portée par `prisma.config.ts`, pas par
  `schema.prisma`
- le conteneur `app` installe les dépendances dans un volume Docker dédié au
  premier démarrage
- le client Prisma est généré automatiquement au démarrage du conteneur
- le schéma Prisma est appliqué automatiquement avant le lancement de Nuxt
- un compte administrateur par défaut est créé au premier démarrage : `admin` /
  `admin`
