# DabaDoc Challenge - Fullstack Project

Bienvenue dans le dépôt du challenge technique DabaDoc.
Ce projet est une application web métier, de type "Questions/Réponses géolocalisées", divisée en deux parties distinctes :
une API backend Ruby on Rails / MongoDB, et un client frontend moderne en Angular 19.

## Table des Matières
- [Aperçu de l'Architecture](#aperçu-de-larchitecture)
- [Fonctionnalités Clés](#fonctionnalités-clés)
- [Prérequis Communs](#prérequis-communs)
- [Démarrage Rapide](#démarrage-rapide)
  - [Backend (Rails API)](#1-backend-rails-api)
  - [Frontend (Angular)](#2-frontend-angular)
- [Choix Techniques Justifiés](#choix-techniques-justifiés)

---

## Aperçu de l'Architecture

Le projet repose sur la séparation claire des responsabilités (separation of concerns) pour faciliter la scalabilité et l'évolution de chaque section indépendamment :

*   **Dossier `/backend` :** Contient l'API RESTful développée avec **Ruby on Rails** (mode API). Il gère la persistance des données via **MongoDB** (utilisant l'ODM Mongoid) et sécurise l'application en émettant des **tokens JWT** lors de l'authentification.
*   **Dossier `/frontend` :** Contient l'application client SPA développée en **Angular 19**. Il s'appuie sur Angular HttpClient pour consommer l'API de manière réactive avec l'aide des **Angular Signals** pour la gestion fine de l'état local (reactive state).

---

## Fonctionnalités Clés

1.  **Système d'Inscription et d'Authentification :** 
    Comptes sécurisés par mot de passe (bcrypt) et sessions maintenues via Json Web Tokens (JWT).
2.  **Gestion des Questions :** 
    Publication de questions associées à un emplacement précis.
3.  **Géolocalisation & Tri Intelligent :** 
    Tri dynamique des questions, affichant en premier et par défaut les questions géographiquement les plus proches de l'utilisateur. Le tri temporel (les plus récentes en premier) est également permutable.
4.  **Cartes Interactives :** 
    Intégration poussée de cartes (Leaflet/OpenStreetMap) :
    *   Saisie visuelle (Map picker) pour palier aux erreurs fréquentes des API GPS des navigateurs.
    *   Affichage en temps réel des questions sous forme de marqueurs dynamiques.
5.  **Système de Réponses :** 
    Création de fils de discussion avec ajout de réponses sous chaque question.
6.  **Favoris (Likes) :** 
    Système asynchrone pour mettre en favori (ou retirer) des questions. Un onglet "Mes Favoris" filtre dynamiquement le flux selon les préférences de l'utilisateur.

---

## Prérequis Communs

Avant de démarrer le projet en local, assurez-vous de disposer des éléments suivants installés sur votre machine (idéalement via WSL sur Windows, ou nativement sous macOS/Linux) :

*   **Ruby** (>= 3.x) & **Bundler**
*   **Node.js** (>= 18.x) & **NPM**
*   **MongoDB** (Un serveur MongoDB en cours d'exécution localement ou via un URI cloud, paramétré sur `mongodb://localhost:27017` par défaut).

---

## Démarrage Rapide

Pour propulser ce projet, deux terminaux devront tourner en parallèle.

### 1. Backend (Rails API)

Le backend assure le rôle de source de vérité.

*   Ouvrez un terminal.
*   Pointez vers le dossier du serveur :
```bash
cd backend
```
*   Installez les dépendances Ruby :
```bash
bundle install
```
*   Si votre serveur MongoDB tourne bien sur `localhost:27017` (pas de migration Rails classique requise grâce à Mongoid, les bases et collections sont gérées dynamiquement par les modèles).
*   Lancez et laissez tourner le serveur en continu :
```bash
rails server
```
L'API devrait maintenant écouter sur **[http://localhost:3000](http://localhost:3000)**.

### 2. Frontend (Angular)

Le frontend offre l'interface aux utilisateurs finaux.

*   Ouvrez un **deuxième** terminal.
*   Pointez vers le dossier Angular :
```bash
cd frontend
```
*   Installez les bibliothèques et modules Node associés :
```bash
npm install
```
*   Lancez le serveur live-reload de développement de l'interface graphique :
```bash
npm start
```
Vous pouvez maintenant visiter votre application sur **[http://localhost:4200](http://localhost:4200)**.

---

## Choix Techniques Justifiés

*   **Ruby on Rails + Mongoid :** Rails offre la robustesse d'un squelette serveur rapide à mettre en place avec ses conventions. L'association avec Mongoid et MongoDB apporte de la permissivité concernant l'évolution naturelle des schémas de données (Data schema flexibility) fréquents sur les forums (champs dynamiques).
*   **JWT (Json Web Tokens) :** JWT a été préconisé plutôt que les Cookies/Sessions traditionnels en prévision de potentiels accès via une version Mobile (React Native/Flutter) pour qu'il n'y ait pas de limites techniques sur la transmission du contexte d'authentification entre différents domaines (CORS/Cross-Origin).
*   **Angular 19 + Signals :** Au-delà de ses excellentes performances de rendu Single Page (SPA), la transition vers l'API Signals simplifie la conception réactive comparé à RxJS sur ce qui définit l'interface (Tabs logic, Affichages conditionnels).
*   **Moteur Cartographique "Leaflet" :** La dépendance à Leaflet assure de solides performances lors du dessin vectoriel tout en conservant les services OpenStreetMap gratuits (sans configuration de clés API complexes type Google Maps requise pour tester l'application en développement).
