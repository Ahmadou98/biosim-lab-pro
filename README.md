# BioSim Lab Pro — simulateur pédagogique de bioproduction

**Projet logiciel complet : Java 21 / Spring Boot / MySQL / React / TypeScript / Three.js.**

BioSim Lab Pro est un environnement de formation destiné à l'apprentissage de la supervision de procédés, de l'interprétation de tendances, des essais analytiques fictifs, de la gestion d'écarts et de la revue documentaire. Il propose une visualisation 3D WebGL manipulable à la souris, une dynamique de procédé abstraite et une API Java avec persistance relationnelle.

> **Limite de sécurité et de validité :** les équipements 3D sont des modèles pédagogiques construits à partir de primitives Three.js. Les grandeurs de procédé sont des indices normalisés (0–100), les critères analytiques sont inventés et tous les résultats sont fictifs. Le logiciel ne donne pas de paramètres de fabrication d'un organisme, ne se connecte pas à un équipement physique, n'est pas un système MES/SCADA validé et ne peut pas autoriser une libération GMP réelle.

## Fonctionnalités de cette version

- **Supervision** : état du lot-école, progression, indice qualité synthétique, alarmes, historique d'activité.
- **Salle de simulation 3D** : réacteur agité pédagogique avec cuve, chemise, arbre et hélices, sondes, conduites, niveau liquide et bulles animées ; modèles de séparation et de remplissage virtuels.
- **Commandes interactives** : démarrer, mettre en pause, avancer d'un pas, ajuster trois indices fictifs, appliquer les consignes et observer la réponse.
- **Tendances historisées** : quatre séries de mesures enregistrées en base au fil des pas de simulation, affichées en graphique.
- **Laboratoire CQ** : quatre essais fictifs — signal d'identité, profil/pureté, proxy d'endotoxines et intégrité du contenant. Les valeurs sont générées côté Java et chaque résultat reste historisé.
- **Déviations / CAPA** : création d'événements, choix de gravité et de statut, écart automatiquement créé lorsqu'un essai est hors limite.
- **Revue de lot pédagogique** : checklist de cinq éléments ; le moteur énumère les blocages si le scénario n'est pas terminé, si les essais obligatoires manquent/échouent ou si une déviation demeure active.
- **Journal** : filtre par gravité, recherche textuelle et export JSON de la session.
- **Persistance** : MySQL dans Docker Compose ; H2 fichier en démarrage local sans variables de connexion. Le backend est la source de vérité des données.

## Démarrage le plus simple (Docker)

Prérequis : **Docker Desktop** installé et démarré.

1. Décompresse le fichier ZIP du projet.
2. Ouvre le dossier `biosim-lab-pro`.
3. Dans un terminal placé à cet endroit, lance :

   ```bash
   docker compose up --build
   ```

   Au premier lancement, Docker télécharge les images de base et les dépendances, puis construit le backend Java et le frontend. La première construction peut prendre plus longtemps qu'un démarrage habituel.

4. Ouvre : **http://localhost:8088**
5. Pour arrêter : `Ctrl+C`, puis `docker compose down`.
6. Les données MySQL restent conservées dans le volume Docker `biosim_mysql` lorsque tu arrêtes les conteneurs.

### Identifiants de démonstration

Il n'y a pas de connexion utilisateur dans cette version : elle est prévue pour un poste de formation local et non pour une publication publique multi-utilisateur. Le lot-école et les événements sont générés automatiquement.

**Avant toute exposition sur un réseau**, change les mots de passe de base de données dans un fichier `.env`, limite l'accès réseau et mets en place authentification, autorisations et HTTPS. Ne publie pas une base de données de formation avec les mots de passe d'exemple.

## Démarrage en mode développeur (sans Docker)

Prérequis : **JDK 21**, **Maven 3.9+**, **Node.js 20+** et npm.

### Terminal 1 — backend Java

```bash
cd backend
mvn spring-boot:run
```

Par défaut, Spring Boot utilise H2 en mode fichier (`backend/biosimlab`) ; aucune installation séparée de MySQL n'est nécessaire pour cet essai local.

### Terminal 2 — interface web

```bash
cd frontend
npm install
npm run dev
```

Ouvre **http://localhost:5173**. Vite relaie les requêtes `/api` au backend `http://localhost:8080`.

## Architecture du dépôt

```text
biosim-lab-pro/
├── backend/
│   ├── pom.xml                         # dépendances et build Maven
│   ├── Dockerfile
│   └── src/main/java/sn/biosimlab/api/
│       ├── BioSimLabApplication.java   # point d'entrée Spring Boot
│       ├── controller/                 # API REST et erreurs HTTP
│       ├── dto/                        # requêtes/réponses API
│       ├── model/                      # entités JPA
│       ├── repository/                 # accès aux tables
│       └── service/                    # logique de simulation et règles de revue
│   └── src/main/resources/application.yml
├── frontend/
│   ├── src/App.tsx                     # vues de supervision et de formation
│   ├── src/components/EquipmentViewer.tsx # modèles 3D Three.js
│   ├── src/lib/api.ts                  # client HTTP vers Java
│   ├── src/lib/types.ts                # contrats TypeScript
│   ├── src/styles.css                  # interface responsive
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── .env.example
```

## API principale

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Action |
|---|---|---|
| `GET` | `/health` | Vérifier l'API |
| `GET` | `/dashboard` | Résumé de la session active |
| `GET` | `/simulation/state` | État + événements + essais + déviations + télémétrie |
| `POST` | `/simulation/new?scenario=bioreactor` | Créer une session |
| `POST` | `/simulation/start` | Démarrer |
| `POST` | `/simulation/pause` | Mettre en pause |
| `POST` | `/simulation/advance` | Calculer et historiser le pas suivant |
| `POST` | `/simulation/parameters` | Appliquer trois indices pédagogiques (0–100) |
| `POST` | `/quality-tests` | Exécuter un essai (`identity`, `purity`, `endotoxin`, `closure`) |
| `POST` | `/deviations` | Créer une déviation pédagogique |
| `PATCH` | `/deviations/{id}` | Changer son statut |
| `POST` | `/release-review` | Calculer les blocages de la revue de formation |

### Exemple de test API

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/simulation/state
curl -X POST http://localhost:8080/api/simulation/start
curl -X POST http://localhost:8080/api/simulation/advance
curl -X POST http://localhost:8080/api/quality-tests \
  -H 'Content-Type: application/json' -d '{"testId":"identity"}'
```

## Règles pédagogiques

- Chaque clic sur « Pas suivant » calcule un pas de temps déterministe à partir de l'état courant et des indices choisis. Les mesures observées convergent vers les indices de consigne et une tendance qualité synthétique est recalculée.
- Les paramètres choisis hors des bornes d'apprentissage prédéfinies déclenchent des événements d'alarme fictifs.
- Chaque essai produit un résultat synthétique côté serveur, avec un critère affiché et une interprétation.
- La revue reste en attente tant que le scénario de procédé n'est pas terminé, qu'un essai obligatoire manque/est hors limite, qu'un document de la checklist n'est pas vérifié ou qu'une déviation n'est pas clôturée.

## Périmètre de validation de cette livraison

Le code source et les fichiers de lancement sont fournis. L'environnement d'exécution de génération ne disposait ni de Maven ni d'un accès réseau aux dépôts de paquets ; je n'ai donc pas pu lancer `mvn test`, `mvn package` ou `npm install` ici. Il faut exécuter le premier build avec Docker ou les outils de développement listés, puis corriger tout éventuel problème de dépendance selon la version effectivement téléchargée. La structure applicative, les routes, les modèles persistants et le client web sont présents dans le projet ; ne considère pas cette mention comme une certification de logiciel GMP.


## Fondation commerciale en cours

Voir [`docs/COMMERCIAL-FOUNDATION.md`](docs/COMMERCIAL-FOUNDATION.md) avant tout déploiement de cette branche. Cette étape introduit un identifiant d'espace navigateur et la prise en charge de PostgreSQL via `DATABASE_URL`, mais **n'inclut pas encore d'authentification utilisateur**. L'identifiant navigateur n'est pas une frontière de sécurité commerciale.

Sur Render, ajoute `DATABASE_URL` dans l'onglet **Environment** du service en utilisant l'Internal Database URL de la base PostgreSQL. Les secrets restent dans l'hébergeur, jamais dans le dépôt.
