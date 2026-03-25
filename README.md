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
docker compose run --rm app npm install
docker compose run --rm app npm run db:migrate:deploy
docker compose up
```

Application: `http://localhost:3000`

Adminer: `http://localhost:8080`

PostgreSQL:

- hôte: `db`
- port: `5432`
- base: `forum`
- utilisateur: `forum`
- mot de passe: `forum`

Notes:

- l'URL Postgres est recomposée en code à partir de `POSTGRES_*`
- avec Prisma 7, la connexion DB est portée par `prisma.config.ts`, pas par
  `schema.prisma`
