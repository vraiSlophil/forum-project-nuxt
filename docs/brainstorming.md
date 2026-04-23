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

## Ports Docker

- les ports exposés sur l'hôte ont été changés par rapport aux valeurs les plus
  classiques

### raison

- d'autres conteneurs tournent en parallèle sur la machine
- garder `3000`, `5432` ou `8080` exposés sur l'hôte augmentait le risque de
  conflit
- l'objectif était donc d'éviter les collisions locales sans changer la
  communication interne entre conteneurs

### décision

- conserver les ports standards à l'intérieur du réseau Docker
- changer seulement les ports publiés sur l'hôte
- séparer explicitement le port interne Postgres et le port exposé sur l'hôte

### intérêt

- plusieurs stacks Docker peuvent tourner en parallèle plus facilement
- la configuration réseau interne reste simple et prévisible
- l'application continue de parler à PostgreSQL sur `db:5432`, sans bricolage
  côté code

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

## Modération des messages

- la suppression utilisateur reste un `DELETE` dur
- la modération devient un `PATCH` sur le message existant
- un message modéré n'est pas supprimé physiquement
- on conserve `deletedAt` et `deletedByUserId` pour tracer la modération
- la restauration remet simplement ces deux champs à `null`

### Choix retenu

- un modérateur doit voir le contenu original d'un message modéré
- un visiteur ou un membre normal doit voir le placeholder de modération
- l'interface doit donc distinguer clairement le statut métier de l'affichage

### Conséquence technique

- le presenter serveur expose deux lectures différentes du même message
- la vue publique reçoit le placeholder
- la vue modérateur reçoit le vrai contenu avec une indication visuelle en plus
- `permissions.canRestore` permet d'afficher l'action inverse sans rajouter une
  route

## Contrat HTTP

- `PATCH /api/messages/:id` garde la mise à jour de contenu
- le même `PATCH` accepte aussi `moderate-delete`
- le même `PATCH` accepte aussi `moderate-restore`
- pas de nouvelle route dédiée à la restauration

### Pourquoi ce choix

- on évite de multiplier les endpoints pour une même ressource
- on garde une surface API cohérente pour les mutations de message
- l'action métier reste lisible dans le body plutôt que dans le chemin
- le serveur peut refuser une restauration si le message n'est pas modéré

## SSR Et Session

- la page du sujet doit récupérer la session au SSR
- sinon la lecture initiale reste publique même pour un admin connecté

### Problème rencontré

- les `$fetch` internes ne reprenaient pas le cookie côté serveur
- le rendu SSR envoyait donc le placeholder au lieu du contenu original
- le client corrigeait ensuite parfois l'affichage, mais trop tard

### Correction

- transmettre `cookie` dans les fetch SSR des pages concernées
- appliquer le même principe sur l'accueil et les pages de forum
- cela garantit une première lecture cohérente avec la session réelle

## UI Message

- le placeholder de modération doit rester visible pour tous
- pour un modérateur, le contenu original doit apparaître juste en dessous
- ce second bloc doit être visuellement plus discret, en gris
- le but est de rendre la suppression immédiatement évidente, sans masquer
  l'historique

### Pourquoi pas un simple tag

- le placeholder permet d'expliciter l'état public réel du message
- le contenu original visible en dessous sert uniquement à la modération

## SpeedDial

- le `SpeedDial` de PrimeVue a bien servi pour l'idée du menu radial
- en pratique, son rendu demande de respecter son propre contexte de
  positionnement
- un `z-index` local ne suffit pas si la carte suivante reste au-dessus dans le
  stacking context

### Problème observé

- le menu débordait bien de la carte
- mais il restait derrière la carte suivante
- cela montrait que le problème venait du stacking context, pas de l'overflow

### Correction retenue

- faire monter la carte active quand le menu est ouvert
- conserver le composant réutilisable sans le coupler à un contexte métier
  spécifique
- n'émettre que l'état `show` / `hide` pour laisser le parent décider du
  stacking

### Réutilisabilité

- le dial reste exploitable ailleurs sans logique de forum
- le parent peut ignorer les events si le stacking n'est pas un problème
- ici, la carte message exploite ces events pour passer au-dessus des voisines

## Tests

- des tests d'intégration couvrent le presenter et la commande de restauration
- des tests e2e vérifient la lecture admin vs public
- les tests confirment aussi la réversibilité du soft delete
- le typecheck et les e2e ont servi à valider les changements SSR et UI

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

## Authentification et sessions

### Objectif

L'étape 6 impose de rendre opérationnels :

- l'inscription
- la connexion
- la déconnexion
- le changement de mot de passe
- la gestion des rôles

Le sujet demande une lecture publique du forum, mais réserve l'écriture et
l'administration aux utilisateurs authentifiés selon leur rôle.

### Choix retenu

- session HTTP gérée côté serveur avec `nuxt-auth-utils`
- payload de session minimal : `id`, `username`, `role`
- inscription et connexion qui ouvrent immédiatement une session
- déconnexion via la route de session fournie par `nuxt-auth-utils`
- changement de mot de passe conditionné par la saisie de l'ancien mot de passe
- création automatique du compte administrateur par défaut au démarrage si aucun
  admin n'existe encore

### Pourquoi garder une session minimale

- le cookie ne doit pas devenir une copie partielle de la table `users`
- les contrôles sensibles doivent continuer à relire l'utilisateur courant en
  base
- cela limite les risques de session obsolète si un rôle change ou si un compte
  est supprimé

### Pourquoi demander l'ancien mot de passe

Le modèle `User` ne contient pas d'email. Donc :

- pas de parcours fiable de réinitialisation par lien ou jeton envoyé par mail
- pas de secret secondaire pour prouver l'identité hors session existante

Le changement de mot de passe retenu est donc volontairement simple et
défendable :

- l'utilisateur doit être connecté
- il doit fournir son mot de passe actuel
- le nouveau mot de passe doit être différent de l'ancien

Cela reste cohérent avec le besoin fonctionnel réel du projet, sans inventer un
parcours de récupération de compte qui n'est pas supporté par le schéma.

### Choix de hachage

Le hachage des mots de passe est centralisé dans `server/utils/password.ts`.

Choix retenu :

- `argon2id`
- via le driver `Argon` de `@adonisjs/hash`
- avec le module natif `argon2` requis par ce driver

Pourquoi :

- `argon2id` est aujourd'hui le choix le plus défendable pour un mot de passe
  applicatif
- le format PHC produit est standard et portable
- le changement de paramètres de coût pourra être géré plus tard sans changer
  tous les appels métier

Conséquence importante :

- les use cases `register`, `login`, `change-password` et `create-admin-user`
  dépendent tous du même adaptateur de hachage
- le choix de l'algorithme ne fuit pas dans les handlers HTTP ni dans les pages

### Placement des règles d'autorisation

Point important confirmé pendant l'implémentation :

- les règles d'autorisation ne doivent pas être dispersées entre pages,
  composants et handlers HTTP

Donc :

- les pages pilotent l'expérience utilisateur
- les handlers valident le transport et la session
- les use cases applicatifs restent la frontière réelle d'autorisation

Cela évite qu'un futur adaptateur, par exemple WebSocket ou script serveur,
contourne accidentellement une règle métier simplement parce qu'il ne passe pas
par le même handler HTTP.

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

## Stratégie de tests

L'ajout des tests a servi à valider non seulement les use cases, mais aussi la
solidité de l'architecture retenue.

### Doc vérifiée pour la stratégie de tests

Points revérifiés dans la doc officielle :

- Nuxt 4 : préparation de l'environnement avec `nuxi prepare`
- Vitest : mocking de modules, fake timers et isolement des suites

L'objectif était d'éviter un setup de test "magique" qui ne fonctionnerait qu'en
local par hasard.

### Objectif retenu

Le besoin n'était pas encore de tester une interface complète au navigateur,
mais de sécuriser la couche serveur du forum.

Donc, la priorité était de couvrir :

- des cas légaux
- des cas illégaux
- les règles de droits
- la pagination
- les réponses HTTP réelles
- l'intégration Prisma/PostgreSQL

### Découpage retenu

Deux niveaux de tests ont été retenus :

- tests d'intégration sur les use cases applicatifs
- tests e2e HTTP contre un vrai serveur Nuxt démarré dans Docker

### Pourquoi des tests d'intégration

Les tests d'intégration couvrent les use cases sans dépendre du démarrage
complet de Nuxt.

Ils servent à vérifier rapidement :

- les autorisations
- les erreurs applicatives
- les calculs de page
- les redirections retournées au front
- les cas métier légaux et illégaux

Ce choix est cohérent avec l'architecture modulaire retenue :

- la couche application reste testable seule
- les règles métier ne dépendent pas directement de `h3`
- les mocks ciblent l'infrastructure, pas le métier

### Pourquoi des tests e2e HTTP

Les tests d'intégration ne suffisent pas à valider :

- le routing Nuxt
- la validation `h3`
- les statuts HTTP
- la session
- la base réelle

Les tests e2e ont donc été ajoutés pour exécuter de vrais appels HTTP contre le
serveur du projet, avec PostgreSQL dans Docker.

Point important d'isolement :

Historique a conserver pour le rapport :

- le brainstorming a d'abord retenu l'idee d'une base PostgreSQL dediee
  `forum_test`

Version actuelle :

- les e2e utilisent finalement le schéma PostgreSQL dédié `forum_test`
- le schéma `forum_test` est explicité pour Prisma CLI et pour l'adapter runtime
- la base de développement reste sur `forum` avec le schéma `public`
- les resets de test ne peuvent donc plus effacer les données locales de
  développement

### Leçon importante sur Prisma

Le point de fuite trouvé pendant l'implémentation est subtil :

- `prisma db push` peut viser un schéma dédié via l'URL datasource
- le runtime Prisma avec `@prisma/adapter-pg` doit recevoir le `schema`
  explicitement dans l'adapter

Si on ne fait que la première partie, on peut créer la bonne base de test mais
continuer à lire le schéma `public` au runtime.

Le pattern retenu est donc :

- URL Prisma CLI avec `schema=...`
- adapter runtime avec option `schema`
- schéma e2e séparé du schéma de dev

Différence entre l'idée initiale et la version actuelle :

- l'isolation finale est assurée par un schéma dédié plutôt que par une base
  dédiée

Ce qu'ils vérifient :

- lecture publique
- refus d'écriture sans session
- écriture autorisée avec session valide
- refus des routes admin pour un utilisateur simple
- réussite d'une route admin pour un administrateur
- validation HTTP des paramètres

### Pourquoi pas d'e2e navigateur à ce stade

Le sujet de cette étape porte d'abord sur la couche serveur.

Il aurait été possible d'ajouter Playwright ou un e2e UI complet, mais la valeur
immédiate était faible tant que les parcours d'interface du forum ne sont pas
encore construits.

Le meilleur compromis à ce stade était donc :

- e2e réseau réel
- sans surcoût d'un navigateur
- avec un retour rapide sur les contrats serveur

### Choix pratiques importants

Quelques points concrets se sont imposés pendant l'implémentation :

- les tests doivent s'exécuter dans le conteneur Docker du projet
- un wrapper `npm run test:e2e` doit pouvoir déléguer vers le conteneur `app`
  pour réutiliser le réseau Docker et éviter les écarts de permissions `.nuxt`
- `nuxi prepare` doit être exécuté avant Vitest, sinon les fichiers Nuxt générés
  manquent
- les scénarios e2e ont besoin d'un seed de base dédié
- la création de session de test doit être explicite et activable uniquement en
  mode test

Cela a conduit à :

- des scripts `test:prepare`, `test:integration` et `test:e2e`
- un démarrage explicite du serveur Nuxt dans les tests e2e
- un helper de seed Prisma pour les scénarios e2e
- un schéma `forum_test` pour séparer les resets e2e du schéma de dev
- une route `__test__/session` activée seulement avec
  `FORUM_ENABLE_TEST_ROUTES=1`

### Leçon importante sur les imports Nuxt

Le travail sur les tests a mis en évidence un point d'architecture utile :

- `#imports` est pratique, mais reste un module virtuel dépendant du runtime
  Nuxt

Cela a créé une fragilité réelle :

- certains tests et certains boots serveur cassaient dès qu'un module applicatif
  ou d'infrastructure dépendait directement de `#imports`

Conclusion pratique :

- éviter `#imports` dans la couche application et dans l'infrastructure métier
- préférer des adaptateurs explicites pour la session et le hachage de mot de
  passe

À l'inverse, les alias `#server` et `#shared` ne posent pas le même problème
dans les tests, car ils peuvent être résolus comme de simples alias de chemins
dans la configuration de Vitest.

### Ce que la stratégie de tests apporte

Au-delà de la couverture technique, cette stratégie confirme plusieurs points :

- l'architecture modulaire est réellement testable
- les frontières entre HTTP, application et infrastructure sont plus nettes
- les cas illégaux ne sont pas traités seulement "par convention"
- le backend peut être validé dans Docker de façon reproductible

## Factorisation front du forum

### Doc vérifiée avant refactor

Points revérifiés dans la documentation officielle Nuxt :

- `app/composables/` pour l'auto-import de composables d'application
- `useState` comme état réactif partagé et compatible SSR

Le but était d'éviter deux écueils :

- dupliquer la même logique de session, de création et d'édition dans plusieurs
  pages
- introduire trop tôt un store global lourd alors que le besoin reste très
  localisé au forum

### Choix retenu

Le front du forum a été refactoré autour de trois composables orientés cas
d'usage :

- `useForumViewer` pour l'état de session réellement affiché dans l'interface
- `useForumPage` pour le formulaire de création de sujet
- `useTopicThread` pour la liste de messages, la réponse, l'édition et les
  extensions futures du sujet

La présentation d'un message a été sortie dans un composant dédié :

- `ForumMessageCard`

### Pourquoi des composables plutôt qu'un store global

Le besoin n'imposait pas encore un store transverse de type Pinia.

Raisons :

- l'état concerné reste centré sur quelques pages du forum
- la topbar, la page forum et la page sujet n'ont pas besoin d'un énorme objet
  global partagé partout
- un store global aurait mélangé état de session affiché, formulaire de sujet,
  édition de message, citation en préparation et futur temps réel
- des composables ciblés gardent des frontières plus simples à lire et à faire
  évoluer

Le seul état réellement partagé entre plusieurs composants sur une même page a
été porté par `useState` dans `useTopicThread`, ce qui reste cohérent avec la
doc Nuxt :

- état sérialisable
- compatible SSR
- réutilisable sans créer un singleton manuel risqué côté serveur

### Composant de message

Le composant `ForumMessageCard` a été introduit pour sortir de la page sujet :

- l'affichage d'un message
- l'affichage d'une citation existante
- les actions d'édition, suppression et citation
- l'état visuel "citation prête"

Cela évite que la page sujet devienne un template monolithique difficile à faire
évoluer lorsque d'autres comportements UI arriveront.

### Historique : préparation de la citation

Dans une version intermédiaire du brainstorming, la citation était pensée comme
une évolution en deux temps.

Choix imaginés à ce moment-là :

- le clic sur `Citer` prépare un brouillon local avec `messageId`, auteur et
  contenu
- la réponse continue pour un temps à n'envoyer que `content`
- l'UI indique explicitement que `quotedMessageId` sera branché quand le contrat
  serveur de réponse l'acceptera

Pourquoi cette étape avait été imaginée :

- ne pas casser le flux de réponse déjà en place
- préparer proprement l'évolution sans bricolage dans le template
- garder l'identifiant du message cité déjà disponible au bon endroit

### Citation livree de bout en bout

La citation est maintenant implementee de bout en bout.

Choix retenu :

- le clic sur `Citer` prepare un brouillon local avec `messageId`, auteur et
  contenu
- la reponse envoie `content` et `quotedMessageId`
- le serveur verifie que le message cite appartient bien au sujet
- le rendu du sujet affiche d'abord le bloc cite, puis la reponse
- des tests d'integration et e2e couvrent ce flux

Interet pour le rapport :

- bonus reellement livre
- evolution propre depuis le composable jusqu'au rendu SSR
- contrat coherent entre front, use case et persistance

### Historique : préparation du temps réel

Dans une version intermédiaire du brainstorming, le temps réel était encore
pensé comme un point d'extension.

Choix imaginés à ce moment-là :

- un type partagé `TopicMessageRealtimeEvent`
- un nom de canal calculé par sujet
- une fonction `applyRealtimeEvent` dans `useTopicThread`

Projection formulée dans ces notes :

- quand le WebSocket serait ajouté, l'abonnement traduirait les messages réseau
  en `TopicMessageRealtimeEvent`
- la mise à jour locale des messages resterait centralisée dans le composable
- la page sujet n'aurait pas à porter elle-même la logique de fusion temps réel

### Temps reel effectivement branche

Le temps reel via WebSocket est maintenant branche de bout en bout.

Choix retenu :

- une route Nitro `server/routes/_ws.ts`
- un registre de clients par canal
- un canal `forums:{forumId}:topics` pour les evenements de sujets
- un canal `topics:{topicId}:messages` pour les evenements de messages
- des fonctions de publication dediees pour `topic.created`, `topic.bumped`,
  `topic.updated`, `topic.deleted`, `message.created`, `message.updated`,
  `message.deleted`, `message.moderated` et `message.restored`
- des composables `useForumPage` et `useTopicThread` qui fusionnent ces
  evenements dans l'etat local

Resultat visible :

- la liste des sujets se met a jour immediatement
- un sujet ouvert recoit les nouveaux messages sans rechargement
- le detail d'un sujet reagit aussi au verrouillage / deverrouillage

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
- la garantie qu'un sujet conserve toujours son message initial
- le temps reel via WebSocket

Point metier important a expliciter dans le rapport :

- le premier message d'un sujet n'est pas supprimable seul
- si un administrateur veut retirer completement ce contenu, il doit supprimer
  le sujet entier

Historique de modelisation a conserver :

- a ce stade du brainstorming, les bonus vus comme ayant un impact direct sur la
  base etaient : citation de message, avatar, verrouillage de sujet
- le statut lu / non-lu n'etait deja pas prevu en base car pense comme une
  responsabilite du front

## Etat reel des bonus

Etat a expliciter tel quel dans le rapport pour eviter toute sur-declaration :

- citation de message : livree de bout en bout
- verrouillage de sujet : livre avec action admin, blocage serveur des reponses
  et diffusion temps reel du changement
- avatar : modele prepare via `avatarUrl`, mais upload et affichage reel non
  livres
- lu / non-lu : non livre

Le statut lu / non-lu n'est pas stocke en base dans l'etat actuel.

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
- hash du mot de passe avec `argon2id`, jamais de mot de passe en clair en base
- generation fiable des slugs et gestion des collisions
- mise a jour de `topics.last_message_at` a chaque nouveau message
- controle strict des droits pour l'edition, la suppression et le verrouillage
- diffusion WebSocket apres creation de sujet, ajout de message, edition ou
  moderation si necessaire
