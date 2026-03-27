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

# Brainstorming Couche Serveur Minimale

Cette section trace les choix faits pour l'étape 5 : poser une vraie couche
serveur Nuxt avant l'interface complète.

## Doc vérifiée avant implémentation

Points vérifiés dans la doc officielle :

- Nuxt 4 : conventions `server/api/` et routes serveur intégrées
- `h3` : `getValidatedQuery`, `getValidatedRouterParams`, `readValidatedBody`,
  `sendNoContent`
- `nuxt-auth-utils` : `getUserSession`, `requireUserSession`, `hashPassword`

L'objectif était d'éviter d'inventer des conventions de routing ou des helpers
de session qui n'existent pas vraiment dans la stack retenue.

## Forme des routes

Choix retenu :

- des routes de lecture alignées sur les pages SSR attendues
- des routes de mutation alignées sur les workflows du forum
- un espace `admin` séparé pour les opérations sensibles

Routes de lecture :

- `GET /api/forums`
- `GET /api/forums/[forumSlug]?page=...`
- `GET /api/forums/[forumSlug]/topics/[topicSlug]?page=...`

Routes de mutation :

- `POST /api/forums/[forumSlug]/topics`
- `POST /api/forums/[forumSlug]/topics/[topicSlug]/messages`
- `PATCH /api/messages/[messageId]`

Routes admin :

- `POST /api/admin/forums`
- `PATCH /api/admin/forums/[forumId]`
- `DELETE /api/admin/forums/[forumId]`
- `POST /api/admin/users`
- `DELETE /api/admin/topics/[topicId]`
- `DELETE /api/admin/messages/[messageId]`

### Pourquoi cette forme

- la lecture publique suit directement la hiérarchie Forums -> Sujets ->
  Messages du sujet
- une page SSR n'a pas besoin d'une API CRUD générique énorme ; elle a besoin
  d'un payload adapté à son rendu
- les mutations retournent assez d'informations pour rediriger proprement le
  front vers la bonne page après action

## Réponses de mutation orientées workflow

Pour `créer un sujet`, `répondre` ou `modifier un message`, les réponses ne
renvoient pas seulement l'entité brute.

Elles renvoient aussi :

- le slug du forum
- le slug du sujet
- l'identifiant du message concerné
- la page cible dans la pagination
- un `redirectTo` prêt à être utilisé par le front

Pourquoi :

- un parcours SSR de forum est surtout une suite de redirections et de retours
  vers la page du sujet
- une réponse purement générique de type "message updated" obligerait le front à
  recalculer lui-même la page où se trouve le message
- centraliser ce calcul côté serveur évite de dupliquer la logique de pagination
  dans les composants

## Services serveur

### Constats après premier jet

Avant le refactor, la couche serveur avait déjà quelques bons signaux :

- handlers HTTP courts
- validation centralisée
- logique métier commencée dans une couche service

Mais un problème de structure apparaissait déjà :

- un unique fichier service regroupait lecture publique, écriture utilisateur,
  administration, pagination, sérialisation SSR, redirections et gestion
  d'erreurs
- les fonctions de service levaient directement des erreurs HTTP
- certaines autorisations sensibles vivaient seulement dans les handlers
- la couche service dépendait à la fois de Prisma, de `h3`, de la session et du
  format exact des réponses SSR

Conclusion :

- ce n'était déjà plus un simple service applicatif
- c'était un point de concentration de responsabilités hétérogènes
- avec l'arrivée de l'auth complète et du WebSocket, ce fichier serait devenu un
  monolithe difficile à faire évoluer proprement

### Question d'architecture posée

Questions examinées :

- faut-il rester sur une organisation proche de MVC ?
- faut-il passer en hexagonale ?
- existe-t-il un compromis plus simple et plus souple ?

Le critère principal retenu n'était pas "la plus belle architecture sur le
papier", mais :

- garder une base défendable pour le rendu
- ne pas sur-architecturer trop tôt
- éviter qu'une seule couche devienne responsable de tout

Choix retenu :

- garder les handlers HTTP très fins
- séparer le serveur par module `forum`
- isoler les use cases applicatifs, les règles domaine et l'accès Prisma/session
- garder la validation HTTP dans une couche transport dédiée

Pourquoi :

- les fichiers `server/api/*` restent lisibles
- les règles de pagination, de droits et de sérialisation ne se dispersent pas
- les routes HTTP, le WebSocket et d'autres adaptateurs futurs pourront appeler
  les mêmes use cases
- on évite le gros fichier service unique qui mélangeait transport,
  autorisation, requêtes Prisma et DTO SSR

### Forme d'architecture retenue

Architecture retenue :

- pas de MVC classique
- pas d'hexagonale complète
- une architecture modulaire "clean-lite"

### Pourquoi pas MVC

Le problème de MVC ici n'est pas qu'il soit "mauvais", mais qu'il est trop flou
pour ce type de backend intégré Nuxt.

Risques observés :

- un dossier `controllers/` finit souvent par contenir validation, authz, appels
  Prisma, mapping de réponse et règles métier
- un dossier `services/` devient alors une zone fourre-tout sans frontière
  claire
- on retombe vite sur la situation initiale : un gros fichier central qui sait
  tout faire

Autrement dit :

- MVC est moins fermé qu'une hexagonale stricte
- mais il ne donne pas assez de garde-fous pour empêcher le mélange transport /
  application / infrastructure

### Pourquoi pas hexagonale complète

L'hexagonale devenait tentante pour séparer proprement le métier du reste, mais
elle a été jugée prématurée dans ce projet.

Raisons :

- backend intégré directement dans Nuxt
- un seul accès aux données via Prisma/PostgreSQL
- pas encore de second adaptateur applicatif réel en dehors du HTTP
- peu de valeur immédiate à introduire ports, adapters, interfaces et factories
  partout

Risque principal :

- payer beaucoup de cérémonie avant d'avoir une complexité qui la justifie

### Compromis retenu

Le compromis choisi est une architecture modulaire orientée use cases.

Idée :

- prendre de la clean architecture la séparation des responsabilités
- sans imposer toute la mécanique formelle d'une hexagonale stricte

Ce que cela donne concrètement :

- la couche HTTP valide, traduit et fixe les status codes
- la couche application porte les use cases
- la couche domaine porte les règles pures et réutilisables
- la couche infrastructure porte Prisma, la session et les détails techniques

Ce que ce compromis apporte :

- plus de souplesse qu'une hexagonale stricte
- plus de garde-fous qu'un simple couple controllers/services
- une base simple à expliquer dans un rapport
- une évolution plus facile vers WebSocket, auth complète ou tests de use cases

Structure :

- `server/api/*` : adaptateurs HTTP
- `server/modules/forum/http/*` : validation HTTP et traduction d'erreurs
- `server/modules/forum/application/*` : use cases
- `server/modules/forum/domain/*` : règles pures
- `server/modules/forum/infrastructure/*` : Prisma, session, slugs

Pourquoi ne pas faire une hexagonale complète :

- le projet reste un backend intégré dans Nuxt
- Prisma est l'unique accès aux données
- une hexagonale stricte ajouterait beaucoup de cérémonie trop tôt

Pourquoi ne pas rester sur une couche service unique :

- les frontières d'autorisation deviennent floues
- les DTO SSR contaminent vite toute la logique
- l'arrivée du WebSocket et de l'auth complète ferait grossir un monolithe
  difficile à tester et faire évoluer

### Points pratiques retirés du refactor

Quelques décisions concrètes se sont imposées pendant le travail :

- les use cases ne doivent pas dépendre de `h3`
- la traduction entre erreurs applicatives et erreurs HTTP doit être centralisée
- l'autorisation admin ne doit pas vivre seulement dans les handlers
- la lecture SSR ne doit pas faire confiance aveuglément aux données minimales
  du cookie si un rôle peut changer en base
- les détails Prisma doivent rester dans l'infrastructure plutôt que remonter
  dans tous les fichiers applicatifs

En pratique, cela a conduit à :

- un wrapper HTTP commun pour transformer les erreurs applicatives en réponses
  HTTP
- des use cases admin qui revalident eux-mêmes les privilèges
- une relecture de l'utilisateur en base même pour la lecture SSR lorsqu'une
  session existe

## Autorisation minimale

L'étape 6 traitera les parcours complets d'inscription et de connexion, mais la
couche serveur de l'étape 5 doit déjà savoir protéger les routes d'écriture.

Choix retenu :

- lecture publique sans session
- routes d'écriture protégées par l'auth serveur
- routes admin revalidées dans les use cases applicatifs
- les routes protégées relisent l'utilisateur courant en base avant autorisation

Pourquoi relire la base :

- la session stockée en cookie doit rester minimale
- le rôle peut changer
- un utilisateur peut être supprimé
- pour une route sensible, il vaut mieux vérifier l'état courant que faire
  confiance aveuglément au cookie

La session attendue pour la suite du projet est donc volontairement petite :

- `id`
- `username`
- `role`

## Pagination

Choix retenu :

- 20 sujets par page
- 20 messages par page
- validation stricte du paramètre `page`
- 404 si la page demandée dépasse le nombre total de pages

Pourquoi :

- c'est le comportement demandé par le sujet
- cela évite d'avoir des pages "vides" ambiguës
- cela donne un contrat clair au front SSR

## Slugs et renommage

Choix retenu :

- slug généré côté serveur à la création
- gestion des collisions avec suffixes numériques
- renommage d'un forum sans changer son slug

Pourquoi conserver le slug lors d'un renommage :

- un changement de nom ne doit pas casser les URLs déjà partagées
- on évite d'introduire tout de suite une couche de redirection ou
  d'historisation des anciens slugs
- c'est plus stable pour un forum SSR dont les liens vont vite être référencés

## Moderation des messages

Choix retenu:

- suppression logique pour un message modere
- suppression physique pour un sujet
- suppression physique pour un forum

Implementation cote lecture:

- utilisateur simple: contenu remplace par un message de moderation
- administrateur: contenu original toujours visible

Pourquoi:

- coherent avec les notes de modelisation deja prises plus haut
- garde un historique de moderation
- ne casse ni la pagination ni les citations existantes

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
