# DabaDoc Challenge - Backend API

Ce projet est la partie Backend du challenge technique DabaDoc, développée avec Ruby on Rails en mode API et MongoDB. 
Il fournit les endpoints nécessaires pour une application "Q&A" géolocalisée.

## 🚀 Technologies utilisées

*   **Ruby:** 3.4
*   **Ruby on Rails:** 8.0 (Mode API uniquement)
*   **Base de données:** MongoDB (via l'ODM `mongoid`)
*   **Authentification:** JSON Web Tokens (`jwt` gem)
*   **Géolocalisation:** `geocoder` gem pour les requêtes spatiales et le tri par distance.

## 🏗️ Architecture et Décisions Techniques

Ce projet a été construit en gardant en tête les bonnes pratiques RESTful et l'optimisation des requêtes.

### 1. Base de données NoSQL (MongoDB)
J'ai tiré parti de la nature orientée-document de MongoDB pour optimiser la lecture des données :
*   **Documents embarqués** : Les réponses (`Answers`) sont stockées directement à l'intérieur du document de la `Question` parente via `embeds_many`. Cela permet de récupérer une question et toutes ses réponses en une seule requête très rapide, sans avoir besoin de faire des JOINs complexes.
*   **Polymorphisme** : Le système de Favoris (`Like`) utilise une relation polymorphe. Un utilisateur peut ainsi "liker" indifféremment une Question ou une (future) Réponse avec un seul et même modèle.

### 2. Authentification par Token (JWT)
L'application n'utilise pas le système de sessions par défaut de Rails.
Toute l'API est sécurisée au niveau de l'`ApplicationController` qui vérifie la présence et la validité d'un token décrypté via l'algorithme HS256. 
Lorsqu'un utilisateur s'inscrit (`/signup`) ou se connecte (`/login`), un token unique lui est délivré. Le mot de passe n'est jamais renvoyé et est hashé en base via `has_secure_password`.

### 3. Recherche Géospatiale
La fonctionnalité centrale de "Questions autour de moi" est gérée nativement dans MongoDB grâce à la gem `geocoder`. 
Lorsqu'un utilisateur envoie sa latitude et longitude au point d'entrée `GET /questions`, la méthode `Question.near` calcule directement en base de données le rayon (50km) et renvoie les résultats triés du plus proche au plus lointain de façon performante.

---

## 🛠️ Installation et Lancement (Environnement de dev)

### Prérequis
*   Ruby installé (recommandé via un gestionnaire comme rbenv ou mise)
*   MongoDB en cours d'exécution sur votre machine (`mongod`)
*   Bundler

### Étapes

1. Cloner ce dépôt
2. Aller dans le dossier du backend : `cd backend`
3. Installer les dépendances : `bundle install`
4. Lancer le serveur local : `bin/rails server`

L'API sera accessible sur `http://localhost:3000`.

## 📍 Points d'entrée de l'API (Endpoints)

| Méthode | Route | Description | Auth requise ? |
| :--- | :--- | :--- | :--- |
| `POST` | `/signup` | Inscription d'un nouvel utilisateur | Non |
| `POST` | `/login` | Connexion et récupération du token JWT | Non |
| `GET` | `/questions` | Liste les questions (triées par distance si `?lat=x&lng=y` fourni) | Oui |
| `POST` | `/questions` | Publie une nouvelle question géolocalisée | Oui |
| `POST` | `/questions/:id/answers` | Ajoute une réponse à une question | Oui |
| `POST` | `/questions/:id/like` | Ajoute une question aux favoris | Oui |
| `DELETE` | `/questions/:id/unlike` | Retire une question des favoris | Oui |

---
## Variables d'environnement

Pour simplifier le setup du challenge, la clé secrète JWT est définie directement dans `ApplicationController`. Dans un contexte de production, elle serait gérée via une variable d'environnement dédiée (ex: `ENV['JWT_SECRET']`).

---
*Note: Le mode CORS n'a pas encore été configuré, il sera adapté selon le port de l'application Angular.*
