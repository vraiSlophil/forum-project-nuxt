# Brainstorming Initial

## Cadre

- sujet initial plus contraignant
- validation du prof : stack libre si résultat propre et cohérent
- donc possible d'utiliser :
- PrimeVue au lieu de Vuetify
- PostgreSQL
- Prisma

## Objectif de départ

- base technique propre
- démarrage simple du projet
- éviter les bricolages compliqués dès l'init
- préparer une base maintenable pour la suite

## Stack retenue

- Nuxt 4
- Vue 3
- PrimeVue
- PostgreSQL
- Prisma
- `nuxt-auth-utils`

## Pourquoi PrimeVue

- préférence perso
- plus envie de partir sur PrimeVue que Vuetify
- suffisant pour un forum
- intégration Nuxt simple via `@primevue/nuxt-module`
- moins envie d'imposer la logique visuelle Vuetify au projet

## Pourquoi PostgreSQL

- préférence perso
- robuste
- standard
- très bon support Prisma
- adapté à un schéma relationnel de forum

## Pourquoi Prisma

- bon typage avec TypeScript
- schéma lisible
- client généré pratique
- bonne DX
- bien adapté à Nuxt côté serveur

## Prisma 7

- point vérifié dans la doc
- config moderne via `prisma.config.ts`
- attention aux changements récents de Prisma 7
- certains flags CLI ont changé / disparu

## Connexion base de données

- discussion sur `DATABASE_URL` complète vs variables atomiques
- variables atomiques préférées :
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

- idée : éviter de dupliquer les infos dans une URL complète dans `.env`
- mais impossibilité d'éviter totalement une URL finale
- Prisma et le driver Postgres attendent une vraie connection string

### décision

- garder les variables atomiques dans `.env`
- reconstruire l'URL dans un seul helper partagé
- ne pas dupliquer la logique dans plusieurs fichiers

## Docker dev

- objectif : démarrer juste avec

```sh
docker compose build
docker compose up
```

## Première idée Docker

- `/app` pour le code bindé
- `/opt/app` pour les dépendances du conteneur
- idée initiale : garder la priorité au `node_modules` du conteneur sans volume
  dédié

### problème

- trop compliqué
- symlink
- double logique
- difficile à justifier si on accepte que Docker écrive `node_modules` sur le
  host

## Clarification importante

- finalement pas de problème si le conteneur crée `node_modules` sur le host
- donc plus besoin de `/opt/app`

### décision

- tout dans `/app`
- bind mount simple `.:/app`
- installation des deps directement dans `/app/node_modules`
- suppression du symlink et de la logique spéciale

## npm install vs npm ci

- question clarifiée explicitement
- comme `package-lock.json` existe :
- `npm ci` préférable

### raisons

- plus déterministe
- mieux pour Docker
- évite les dérives du lockfile
- plus cohérent pour un environnement propre

## Script d'entrée Docker

- rôle du script :
- installer les deps si besoin
- générer Prisma
- lancer les migrations si présentes
- sinon `db push`
- lancer Nuxt en dev

## Erreur rencontrée au démarrage

- conteneur `app` absent dans `docker compose ps`
- donc `localhost:3000` inaccessible
- cause trouvée dans les logs

### cause

- `prisma db push --skip-generate`
- flag non valide avec Prisma 7

### correction

- suppression de `--skip-generate`
- garder `prisma generate` juste avant

## Healthcheck PostgreSQL

- idée rejetée : passer par Prisma ou un script custom pour attendre la DB
- jugé inutilement complexe

### décision

- healthcheck natif Postgres uniquement
- `pg_isready`

### intérêt

- plus simple
- plus propre
- plus fiable conceptuellement
- pas de dépendance applicative pour vérifier la DB

## Variables d'environnement Postgres pour l'image Docker

- vérification sur les variables attendues par l'image officielle

### pour le service `db`

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### important

- `POSTGRES_HOST` n'est pas une variable utile à l'image Postgres elle-même
- elle sert à l'application, pas au conteneur de base

## Versions Docker retenues

- Node : `node:24-bookworm-slim`
- PostgreSQL : `postgres:18-alpine`

### logique

- démarrer sur des versions récentes
- éviter de construire le projet sur une base déjà datée

## Structure Nuxt / problème d'alias

- erreur runtime :
- import résolu vers `/app/app/server/...`

### cause

- alias `~` de Nuxt pointe vers `srcDir`
- ici `srcDir` correspond à `app/`
- mais `server/` est à la racine du projet

### conséquence

- `~/server/...` mauvais dans ce contexte

### correction

- imports relatifs côté serveur

### leçon

- ne pas supposer le comportement des alias sans regarder la structure réelle du
  projet

## DevTools

- question sur l'intérêt du Vue / Nuxt DevTools
- constat : utiles pour debug
- mais pas indispensables au projet
- l'activation explicite n'apportait pas grand-chose ici

### décision

- retirer l'activation explicite dans `nuxt.config.ts`
- retirer le port DevTools de Docker
- retirer la variable d'environnement associée

## Outils qualité

- ESLint
- Prettier
- Husky
- lint-staged

## Prettier

- besoin explicite :
- support `.vue`
- un attribut par ligne dans les balises

### config importante

- `singleAttributePerLine: true`

### intérêt

- composants Vue plus lisibles
- templates plus propres

## Husky / lint-staged

- objectif :
- formatter automatiquement avant commit
- ne formatter que les fichiers stagés

### choix

- Husky pour le hook Git
- lint-staged pour cibler les fichiers stagés
- Prettier exécuté avant commit

### intérêt

- éviter les oublis de format
- éviter de reformater tout le repo à chaque commit
- garder des commits plus propres

## Problème de permissions

- `node_modules` écrit par Docker
- permissions cassées côté host
- `npm install` échouait avec `EACCES`

### leçon

- bind mount + Docker + Node = attention forte aux permissions
- point important à mentionner dans le rapport

### correction appliquée

- reprise des permissions via Docker
- puis installation des dépendances possible

## Ligne directrice qui s'est dégagée

- éviter les couches inutiles
- éviter les scripts intermédiaires compliqués
- préférer le natif quand il suffit
- chercher une base simple à expliquer
- privilégier une architecture maintenable dès le départ

## Points intéressants à réutiliser dans le rapport final

- liberté de stack validée par le prof
- justification PrimeVue / PostgreSQL / Prisma
- discussion sur variables atomiques vs URL complète
- simplification progressive de Docker
- adaptation à Prisma 7
- correction d'un vrai bug de démarrage
- importance des permissions dans un bind mount Docker
- mise en place des outils qualité dès l'initialisation

## Backlog / sujets à traiter plus tard

- vrai schéma Prisma du forum
- stratégie migration Prisma à stabiliser
- initialisation automatique du compte admin
- auth complète
- rôles / autorisations
- stratégie WebSocket
- documentation plus propre de l'architecture `app/` / `server/`

# Brainstorming Base De Donnees

Ce document sert a garder une trace des choix de modelisation faits pour le
forum Nuxt, ainsi que des alternatives ecartees. Il pourra etre reutilise plus
tard dans le rapport du projet.

## Contexte fonctionnel

Le sujet impose une hierarchie simple:

- forums
- sujets
- messages

Le forum doit permettre:

- la lecture publique des forums, sujets et messages
- la creation d'un compte et l'authentification pour poster
- deux roles: utilisateur simple et administrateur
- la creation de sujets
- la reponse a un sujet
- l'edition de ses propres messages
- la moderation par l'administrateur
- la suppression d'un forum avec suppression de tous ses sujets et messages
- la suppression d'un sujet avec suppression de tous ses messages
- le temps reel via WebSocket

Des bonus prevus dans le sujet ont ete integres des maintenant dans le modele
lorsqu'ils avaient un impact direct sur la base:

- citation de message
- avatar
- verrouillage de sujet

Le statut lu / non-lu n'est pas stocke en base car il sera gere uniquement par
le front.

## Stack retenue

Le sujet mentionne MySQL, mais le projet deja initialise utilise Prisma avec
PostgreSQL:

- `prisma/schema.prisma` etait configure en `postgresql`
- `server/utils/prisma.ts` utilise `@prisma/adapter-pg`
- `server/utils/database-url.ts` construit deja une URL PostgreSQL

Le choix retenu est donc PostgreSQL pour rester coherent avec l'existant et
eviter une migration technique inutile.

## Identifiants

Choix retenu:

- UUID partout

Pourquoi:

- pas d'identifiants incrementaux exposes
- meilleur decouplage vis-a-vis de l'ordre de creation
- plus pratique si des donnees sont importees ou generees dans plusieurs
  contextes

Implementation Prisma retenue:

- `String @db.Uuid`
- `@default(uuid())`

## Tables retenues

### `users`

Contient:

- l'identifiant UUID
- le `username`
- le mot de passe hache
- le role
- l'URL relative de l'avatar
- les dates de creation et mise a jour

Choix importants:

- pas d'email
- pas de stockage de session en base dans ce schema

Raison:

- l'authentification sera geree avec les modules Nuxt
- le besoin fonctionnel ne demande pas d'email

### `forums`

Contient:

- l'identifiant UUID
- le nom
- le slug
- une description optionnelle
- les dates de creation et mise a jour

Le slug est stocke en base pour faciliter des URLs propres et stables.

### `topics`

Contient:

- l'identifiant UUID
- le forum parent
- l'auteur
- le titre
- le slug
- l'etat verrouille / non verrouille
- les dates de creation et mise a jour
- la date du dernier message

Choix important:

- le slug du sujet est unique seulement a l'interieur d'un forum

Implementation:

- contrainte `@@unique([forumId, slug])`

Raison:

- deux forums differents peuvent raisonnablement avoir un sujet avec le meme
  slug
- cela reste compatible avec des URLs du type
  `/forums/:forumSlug/topics/:topicSlug`

### `messages`

Contient:

- l'identifiant UUID
- le sujet parent
- l'auteur
- le contenu
- une reference optionnelle vers un message cite
- les dates de creation et mise a jour
- une date d'edition
- une date de suppression logique
- l'administrateur ayant supprime le message

Le contenu n'est pas efface en base lorsqu'un message est modere.

Comportement prevu:

- pour un utilisateur normal: affichage de `message supprime`
- pour un administrateur: le contenu original reste visible

Ce choix permet:

- de conserver l'historique
- de garder une moderation tracable
- d'eviter de casser les citations ou la pagination

## Choix ecartes

### `topics.last_message_author_id`

Ce champ avait ete envisage pour accelerer l'affichage de la liste des sujets.

Utilite theorique:

- eviter une jointure supplementaire pour afficher l'auteur du dernier message

Choix final:

- champ supprime

Raisons:

- `last_message_at` suffit pour le tri des sujets
- l'auteur du dernier message peut etre retrouve via la requete applicative
- cela evite une redondance supplementaire a maintenir a chaque nouveau message
  ou suppression

Ce champ pourra etre reintroduit plus tard si un vrai besoin de performance
apparait sur la page liste des sujets.

### Table de suivi lu / non-lu

Table envisagee:

- `topic_reads` ou equivalent

Choix final:

- non retenue

Raison:

- l'etat lu / non-lu sera gere cote front, sans stockage en base

### Suppression physique des messages

Choix final:

- non retenue

Raison:

- le besoin "message supprime par un moderateur" suppose de conserver une trace
- une suppression physique casserait l'historique et rendrait la moderation
  moins explicable

### Suppression logique des sujets et forums

Choix final:

- non retenue

Raison:

- le sujet demande explicitement la suppression complete d'un sujet et de ses
  messages
- meme logique pour un forum et tout son contenu

Implementation retenue:

- suppression physique avec cascades

## Avatars

Choix retenu:

- la base stocke uniquement un chemin relatif

Exemple:

- `/uploads/avatars/abc123.webp`

Traitement prevu cote backend:

- reception du fichier image
- generation d'un nom aleatoire
- compression
- conversion en WebP
- sauvegarde sur le serveur
- exposition via un repertoire statique

Pourquoi ce choix:

- le front peut recomposer l'URL facilement
- la base reste simple
- pas de blob en base

## Contraintes de suppression

Regles retenues:

- suppression d'un forum: suppression physique en cascade de ses sujets et
  messages
- suppression d'un sujet: suppression physique en cascade de ses messages
- suppression d'un message par moderation: suppression logique uniquement

Effet attendu:

- cohérence fonctionnelle avec le sujet
- historique conserve la ou il est utile
- suppression forte uniquement sur les objets de plus haut niveau

## Index utiles

Les index principaux prevus sont:

- unicite sur `users.username`
- unicite sur `forums.slug`
- unicite sur `topics(forum_id, slug)`
- index sur `topics(forum_id, last_message_at desc)` pour lister un forum
- index sur `messages(topic_id, created_at)` pour paginer les messages d'un
  sujet
- index sur `messages(quoted_message_id)` pour la citation
- index sur `messages(deleted_at)` pour filtrer ou auditer les messages moderes

## Impact sur les requetes applicatives

Quelques consequences importantes du modele:

- la page d'accueil peut compter les sujets par forum
- la page forum trie les sujets avec `last_message_at`
- la page sujet pagine les messages sur `created_at`
- le front affiche un message de moderation pour les utilisateurs simples quand
  `deleted_at` est renseigne
- l'administration peut toujours consulter le contenu original du message

## Points a garder en tete pour l'implementation

- creation automatique du compte admin initial au premier demarrage
- hash du mot de passe, jamais de mot de passe en clair en base
- generation fiable des slugs et gestion des collisions
- mise a jour de `topics.last_message_at` a chaque nouveau message
- controle strict des droits pour l'edition, la suppression et le verrouillage
- diffusion WebSocket apres creation de sujet, ajout de message, edition ou
  moderation si necessaire
