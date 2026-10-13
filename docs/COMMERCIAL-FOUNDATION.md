# BioSim Lab Pro — fondation commerciale

Cette branche est une étape de préparation technique. Elle ne doit pas être fusionnée dans `main` avant vérification du build, de l'API, de l'isolation des sessions et de la persistance PostgreSQL.

## Changements de cette étape

- Chaque profil de navigateur génère un UUID local (`biosim-lab.client-id`) et l'envoie à l'API dans l'en-tête `X-Client-Id`.
- Le backend rattache chaque lot-école à cet identifiant et choisit le lot actif par identifiant, au lieu de sélectionner globalement le dernier lot créé.
- Les consultations d'état, actions de procédé, essais, déviations, revues et résumés passent par le même espace navigateur.
- Un test d'intégration vérifie que deux identifiants de navigateur reçoivent des lots indépendants.
- Le backend accepte PostgreSQL à partir de la variable `DATABASE_URL`. H2 reste disponible comme solution de développement.
- Le build Docker revient à `mvn -DskipTests package` : les tests ne sont pas exécutés, mais leurs sources sont compilées.

## Limite de sécurité à ne pas ignorer

`X-Client-Id` est un identifiant de profil de navigateur, **pas une identité authentifiée**. Il apporte une séparation pratique entre profils de navigateur, mais un utilisateur peut modifier l'en-tête, et plusieurs personnes utilisant le même profil de navigateur partagent cet espace.

Ne commercialise pas cette étape comme une plateforme multi-utilisateur sécurisée. Avant toute ouverture à des clients réels, il faut ajouter :
1. authentification et gestion de comptes ;
2. autorisations par rôle (apprenant, formateur, administrateur d'établissement) ;
3. contrôle serveur de l'appartenance de chaque session à l'utilisateur connecté ;
4. isolation de chaque établissement (multi-tenant), tests d'accès interdits et journaux d'audit adaptés ;
5. procédures de sauvegarde, restauration, surveillance et gestion des secrets.

Les données de formation peuvent être fictives ; les comptes, évaluations et dossiers pédagogiques des clients ne le sont pas nécessairement.

## Activer PostgreSQL sur Render

La variable `DATABASE_URL` est prioritaire sur les propriétés H2 actuelles. Ne place pas l'URL de connexion ni son mot de passe dans GitHub.

1. Crée une base PostgreSQL dans Render. Choisis une région compatible avec le service web et un plan adapté à la conservation de données réelles.
2. Dans la base, copie l'**Internal Database URL**.
3. Dans le service Web BioSim Lab Pro, ouvre **Environment** et ajoute `DATABASE_URL` avec cette URL. N'inscris jamais ce secret dans le code source.
4. Enregistre et redéploie.
5. Vérifie `/api/health`, crée une session, exécute un pas de simulation, redémarre/redéploie le service puis vérifie que la télémétrie et le lot existent encore.
6. Ne tente pas d'importer les anciens lots H2 par simple changement de variable. Une migration de données séparée et validée est nécessaire si ces données doivent être conservées.

Attention : la base PostgreSQL gratuite de Render expire après 30 jours et n'inclut pas de sauvegardes. N'y stocke pas des données clients dont la conservation est importante.

## Vérifications avant fusion

- [ ] Le build d'image Docker réussit depuis cette branche.
- [ ] La page principale s'affiche et appelle `/api/simulation/state`.
- [ ] La création, le démarrage et l'avancement du lot fonctionnent.
- [ ] Les mesures de télémétrie sont enregistrées.
- [ ] Deux navigateurs/profils ont des sessions distinctes.
- [ ] Le démarrage avec `DATABASE_URL` PostgreSQL fonctionne.
- [ ] Les données restent présentes après redéploiement.
- [ ] Les tests Maven sont exécutés avec succès (ils sont actuellement compilés mais pas exécutés par le build Docker).
- [ ] La connexion utilisateur et les contrôles d'autorisation sont implémentés avant une ouverture commerciale.
