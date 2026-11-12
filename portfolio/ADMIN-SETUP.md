# Administration du portfolio — mise en service

## Projet Supabase dédié
Le portfolio utilise son propre projet Supabase, séparé de SAMA-PACK :
- Projet : ALD-Portfolio
- Project ref : `kjrgvpxmqrbhbejqedcm`
- Région : eu-west-3
- Bucket : `portfolio-media`
- Coût du projet à la création : 0 USD/mois (hors dépassement des quotas gratuits).

Le schéma actif est enregistré dans `supabase/schema.sql`. Il crée les tables `events`, `experiences`, `diplomas`, `initiatives` et `profile`, active RLS, limite toutes les écritures au compte propriétaire et crée le bucket d'images.

## Première connexion administrateur
La page d'administration est :
https://ahmadou-lamine-diouf.pages.dev/admin.html

Dans Supabase Dashboard, projet ALD-Portfolio :
1. Ouvrir Authentication → URL Configuration.
2. Définir le Site URL à `https://ahmadou-lamine-diouf.pages.dev`.
3. Ajouter l'URL de redirection `https://ahmadou-lamine-diouf.pages.dev/admin.html`.
4. Garder l'authentification par e-mail activée et la confirmation d'adresse e-mail activée.
5. Ouvrir la page admin, choisir un mot de passe d'au moins 8 caractères et cliquer une fois sur « Créer mon accès propriétaire ». Confirmer l'adresse reçue par e-mail, puis revenir à la page admin et se connecter.

Seule l'adresse `ahmadoulaminediouf39@gmail.com` est reconnue comme propriétaire par la fonction SQL `public.is_portfolio_admin()`. Les règles RLS appliquent la même restriction dans PostgreSQL et Storage ; masquer le lien admin ne serait pas une mesure de sécurité suffisante.

## Carte de visite numérique
La carte publique se trouve à https://ahmadou-lamine-diouf.pages.dev/carte.html. Le QR code ouvre cette page interactive ; le téléphone, l’e-mail, WhatsApp et LinkedIn y sont cliquables. Vous pouvez télécharger une image PNG de la carte, la partager depuis le menu natif du téléphone ou enregistrer le contact au format vCard. Les informations sont chargées depuis la table `profile`.

## Utilisation quotidienne
- Événements : nom, ville, pays, dates, statut à venir/passé, rôle, résumé EN/FR et galerie de photos.
- Expériences : organisation, dates, rôle, description EN/FR, compétences et photos.
- Diplômes : institution, année, détails EN/FR et image du certificat/badge.
- Initiatives : livre, programmes, projets, liens et photos.
- Profil principal : titre et présentation EN/FR, coordonnées, LinkedIn et portrait.

Les images acceptées sont JPG, PNG et WebP, limitées à 12 Mo par fichier et optimisées côté navigateur avant envoi. Le bucket est public en lecture pour que les images soient visibles sur le portfolio ; les opérations d'ajout, de modification et de suppression sont réservées au propriétaire authentifié.

## Déploiement
Le site reste un HTML statique hébergé sur Cloudflare Pages, connecté au dépôt GitHub `Ahmadou98/biosim-lab-pro`, branche `personal-portfolio`, dossier `portfolio/`. Chaque commit dans cette branche déclenche le déploiement de production. Aucun build command n'est requis.

La clé `sb_publishable_...` est prévue pour être utilisée dans le navigateur et est protégée par RLS. Ne jamais ajouter la clé `service_role` ou `sb_secret_...` au HTML, à GitHub ou à Cloudflare Pages.
