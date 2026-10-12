# Ouvrir BioSim Lab Pro depuis le navigateur — sans installer de logiciel

Tu n'as pas besoin d'installer Java, Node.js, Maven ou Docker sur ton PC. La compilation et l'hébergement se feront sur les serveurs Render. Il faut néanmoins déposer le code sur GitHub depuis ton navigateur une seule fois.

## Étape 1 — Télécharger et décompresser le ZIP

1. Télécharge `biosim-lab-pro.zip`.
2. Dans Windows, clique dessus avec le bouton droit puis **Extraire tout**. Cette opération n'installe aucun logiciel.
3. Ouvre le dossier extrait `biosim-lab-pro`. Vérifie que tu vois notamment `Dockerfile`, `render.yaml`, `backend`, `frontend` et `docker-compose.yml`.

## Étape 2 — Créer un dépôt GitHub dans le navigateur

1. Ouvre https://github.com/new et connecte-toi.
2. Nom du dépôt : `biosim-lab-pro`.
3. Choisis **Public** pour le chemin de déploiement gratuit le plus simple. Ne coche pas la création automatique d'un README ou d'une licence.
4. Clique sur **Create repository**.
5. Sur le dépôt vide, clique sur **Add file → Upload files**.
6. Glisse les éléments du dossier `biosim-lab-pro` (les fichiers et dossiers `backend`, `frontend`, etc. — pas le ZIP lui-même) dans la zone de dépôt. Si le navigateur refuse le dossier en une fois, ouvre les dossiers et importe les fichiers via la page Upload files en gardant leur arborescence.
7. Attends la fin du transfert, ajoute le message `Préparer déploiement navigateur`, puis clique sur **Commit changes**.

Vérifie que `Dockerfile` et `render.yaml` apparaissent à la racine du dépôt GitHub.

## Étape 3 — Déployer gratuitement sur Render

1. Ouvre https://render.com et inscris-toi/connecte-toi.
2. Dans le tableau de bord, choisis **New → Blueprint**.
3. Connecte ton compte GitHub si Render le demande, puis sélectionne le dépôt `biosim-lab-pro`.
4. Render lit le fichier `render.yaml`. Vérifie le service `biosim-lab-pro` et le plan `Free`, puis valide **Apply/Deploy Blueprint**.
5. Ouvre les journaux du déploiement. Attends que le statut indique **Live**. Le premier build compile l'interface et le backend Java dans le cloud, ce qui peut prendre plusieurs minutes.
6. Ouvre l'URL `https://biosim-lab-pro.onrender.com` (ou l'URL effectivement attribuée par Render) dans ton navigateur.

Si Render attribue un autre sous-domaine, utilise celui affiché dans le tableau de bord. Tu n'as pas besoin d'exécuter de commande sur ton ordinateur.

## Important sur l'offre gratuite et les données

- Une instance Render gratuite peut se mettre en veille après une période sans activité et prendre un peu de temps à se réveiller.
- Cette configuration utilise une base H2 **en mémoire** pour simplifier la démo en ligne. Les données de session peuvent être réinitialisées quand le service redémarre ou se redéploie ; ne l'utilise pas pour conserver les résultats d'une formation officielle.
- Le code-source du dépôt doit rester public pour ce parcours gratuit simple. Ne mets jamais de mots de passe, de données personnelles ou de données réelles de fabrication dans le dépôt.
- Les variables, mesures, critères et décisions sont pédagogiques et fictifs. L'application n'est pas un système de contrôle industriel ou un système GMP validé.

## Utiliser l'application

Une fois l'URL Render ouverte, utilise le menu latéral : **Supervision**, **Salle de simulation**, **Laboratoire CQ**, **Déviations / CAPA**, **Revue de lot** et **Journal d'événements**. Dans le simulateur, choisis un scénario, ajuste les indices abstraits, démarre la simulation et avance pas à pas pour faire apparaître les tendances et les événements.
