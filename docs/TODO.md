# TODO

## 5. Mettre en place la couche serveur Nuxt minimale

fait : [x]

Il faut créer les routes et services serveur qui portent le métier du forum
avant de construire une interface complète.

Contexte: Le sujet impose un backend intégré directement dans Nuxt, sans API
externe séparée. Pour l'instant, le dépôt ne contient pas encore de
`server/api/`, ni de middleware d'autorisation, ni de logique métier au-delà du
client Prisma. Il faut donc définir une couche serveur claire pour lire les
forums, lire un forum paginé, lire un sujet paginé, créer un sujet avec son
premier message, répondre à un sujet, modifier un message et exécuter les
actions d'administration.

Axe de réflexion intéressant: Il faut concevoir des routes qui servent d'abord
les besoins de l'interface SSR plutôt que de simuler une API générique
abstraite.

---

## 6. Implémenter l'authentification et les autorisations

fait : [x]

Il faut rendre opérationnels l'inscription, la connexion, la déconnexion, le
changement de mot de passe et la gestion des rôles.

Contexte: Le projet embarque déjà `nuxt-auth-utils` et le schéma contient un
`passwordHash` ainsi qu'un `role`, mais aucun flux d'authentification n'est
encore visible dans `app/` ou `server/`. Le sujet demande une lecture publique
du forum mais réserve la création, la réponse, l'édition et l'administration aux
utilisateurs authentifiés selon leur niveau de droit. Il faut donc mettre en
place des contrôles d'accès explicites, cohérents et centralisés.

Axe de réflexion intéressant: Il faut choisir très tôt où placer les règles
d'autorisation pour éviter qu'elles se dispersent entre pages, composants et
routes.

---

## 7. Construire les parcours SSR de lecture publique

fait : []

Il faut implémenter la navigation principale du forum en commençant par les
pages consultables sans connexion.

Contexte: La page d'accueil actuelle est seulement un placeholder et ne reflète
pas encore la hiérarchie Forums -> Sujets -> Messages attendue par le sujet. Le
premier bloc fonctionnel utile consiste à afficher la liste des forums avec leur
nombre de sujets, puis la page d'un forum avec ses sujets triés par date du
dernier message, puis la page d'un sujet avec ses messages triés
chronologiquement et paginés par 20. Ce parcours constitue la colonne vertébrale
de toute l'application.

Axe de réflexion intéressant: Il faut penser la structure des données retournées
par le serveur en fonction des besoins exacts de chaque page SSR.

---

## 8. Ajouter les parcours d'écriture côté utilisateur

fait : []

Il faut implémenter la création de sujet, la réponse à un sujet et l'édition de
ses propres messages.

Contexte: Une fois la lecture publique en place, il devient possible de brancher
les premiers parcours authentifiés réellement utiles. Le sujet impose qu'un
nouveau sujet contienne toujours un message initial, et que les réponses et
modifications respectent les droits de l'utilisateur courant. Il faut aussi
gérer les validations de formulaire, les états d'erreur, les redirections
post-action et la mise à jour correcte du `lastMessageAt` sur les sujets.

Axe de réflexion intéressant: Il faut traiter les écritures comme des
transitions de workflow complètes et pas seulement comme des insertions en base.

---

## 9. Mettre en place l'administration fonctionnelle

fait : []

Il faut créer l'espace administrateur permettant de gérer les forums, les
administrateurs et les opérations de modération.

Contexte: Le sujet attend qu'un administrateur puisse créer un autre
administrateur, créer, renommer ou supprimer un forum, supprimer un sujet et
modérer les messages. Ces actions touchent à la fois aux autorisations, aux
cascades de suppression, aux confirmations UI et à la traçabilité du
comportement en base. Comme elles sont plus sensibles et plus destructrices,
elles doivent être développées après les parcours de lecture et d'écriture
standard.

Axe de réflexion intéressant: Il faut définir si l'administration doit être
pensée comme un ensemble d'actions ponctuelles ou comme un sous-produit cohérent
avec sa propre ergonomie.

---

## 10. Ajouter le temps réel avec WebSocket Nitro

fait : []

Il faut brancher la diffusion temps réel après stabilisation du CRUD principal.

Contexte: Le flag `nitro.experimental.websocket` est déjà activé, mais la route
`server/routes/_ws.ts` et la mécanique de diffusion n'existent pas encore. Le
sujet demande une mise à jour immédiate de la liste des sujets lorsqu'un sujet
ou un message est créé, ainsi qu'une mise à jour immédiate d'un sujet lorsqu'un
nouveau message arrive. Il faut donc définir des événements serveur simples,
stocker les connexions actives et connecter proprement le client sans casser le
rendu SSR.

Axe de réflexion intéressant: Il faut choisir des événements métier explicites
plutôt que de diffuser des rafraîchissements opaques difficiles à faire évoluer.

---

## 11. Finaliser la qualité, les tests et le packaging de rendu

fait : []

Il faut terminer le projet par une phase de consolidation, de vérification et de
préparation du livrable.

Contexte: Le sujet demande une application Docker lançable via
`docker compose up`, ainsi qu'un rapport succinct expliquant l'application, les
choix techniques et les difficultés rencontrées. Une fois les fonctionnalités
principales terminées, il faudra vérifier les parcours critiques, la pagination,
les droits, les suppressions, le bootstrap initial, les comportements temps réel
et la cohérence des données. Il faudra aussi nettoyer les éléments trop orientés
développement si nécessaire pour que le rendu soit compréhensible et défendable.

Axe de réflexion intéressant: Il faut considérer la soutenance et le rapport
comme une partie de la qualité du projet, pas comme une étape annexe de dernière
minute.

---

## 12. Traiter les bonus uniquement après le tronc principal

fait : []

Il faut réserver les fonctionnalités bonus à une phase finale, une fois le
périmètre obligatoire sécurisé.

Contexte: Le schéma actuel anticipe déjà plusieurs bonus possibles comme la
citation, l'avatar et le verrouillage, ce qui peut faire gagner du temps plus
tard. En revanche, tant que l'auth, la lecture SSR, l'écriture, l'administration
et le temps réel obligatoire ne sont pas terminés, les bonus augmentent surtout
le risque de dispersion. Le bonus le plus coûteux semble être l'état lu/non-lu,
qui demandera probablement un modèle supplémentaire et une stratégie de suivi
précise.

Axe de réflexion intéressant: Il faut choisir les bonus non pas selon leur
attrait visuel, mais selon leur rapport valeur démontrable sur coût réel
d'implémentation.
