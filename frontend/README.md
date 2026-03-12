# DabaDoc Challenge - Frontend (Angular)

Ce projet Angular constitue l'interface utilisateur du challenge DabaDoc. Il s'agit d'une application Single Page Application (SPA) développée avec **Angular 19** et **Bootstrap 5**.

## Prérequis

- **Node.js** (v18+ recommandé)
- **NPM** (v9+ recommandé)
- **Angular CLI** (v19)

## Installation

1. Assurez-vous d'être dans le dossier `frontend` du projet :
   ```bash
   cd frontend
   ```

2. Installez les dépendances npm :
   ```bash
   npm install
   ```

## Configuration

L'application est configurée pour communiquer par défaut avec l'API backend sur `http://localhost:3000`.
Si votre backend tourne sur un autre port ou un autre domaine, vous pouvez modifier l'URL de base dans les services Angular (`src/app/services/auth.ts` et `src/app/services/question.ts`).

## Démarrage du serveur de développement

Pour lancer l'application en mode développement :

```bash
npm start
```
*Ou via Angular CLI directement : `ng serve`*

L'application sera accessible dans votre navigateur à l'adresse logique locale : **[http://localhost:4200/](http://localhost:4200/)**.
L'application se rechargera automatiquement si vous modifiez un fichier source.

## Fonctionnalités principales

L'interface Angular consomme l'API Rails et offre les fonctionnalités suivantes :

1.  **Authentification :**
    *   Inscription (`/signup`) et Connexion (`/login`) via JWT.
    *   Les jetons JWT sont stockés dans le `localStorage` et un Intercepteur Angular (`auth.interceptor.ts`) se charge de les injecter automatiquement dans les en-têtes `Authorization` de toutes les requêtes HTTP sortantes.

2.  **Gestion des Questions :**
    *   Affichage d'un flux de questions.
    *   **Carte Interactive (Leaflet) :** Lors de la création d'une question, l'utilisateur peut cliquer ou glisser un marqueur sur une carte pour définir précisément l'emplacement géographique de sa question, contournant ainsi les limitations de précision ou les blocages de l'API de géolocalisation native des navigateurs.
    *   **Mini-cartes :** Chaque question listée est accompagnée d'une mini-carte statique illustrant sa localisation.

3.  **Filtres et Tri :**
    *   **Tri intelligent :** L'utilisateur peut choisir via un menu déroulant de trier les questions soit par **Distance** (les plus proches de lui en premier grâce aux coordonnées GPS du navigateur), soit par **Récence** (les plus récentes en premier).
    *   Les listes et les marqueurs sur la grande carte interactive se mettent à jour automatiquement à chaque changement de filtre (Architecture réactive basée sur les nouveaux `Signals` d'Angular).

4.  **Favoris :**
    *   Système de "J'aime" sur les questions.
    *   Onglet dédié "Mes Favoris" permettant de filtrer instantanément l'affichage pour ne montrer que les questions likées par l'utilisateur connecté en appelant la route spécifique `/questions/favorites`.

5.  **Réponses :**
    *   Lecture et ajout de réponses à toute question existante, affichées sous forme de fil de discussion.

## Choix Techniques

*   **Angular Signals :** Le projet tire parti de la réactivité moderne d'Angular (Signals, `effect()`) pour gérer l'état local (comme le tri, l'onglet actif et le chargement conditionnel des données).
*   **Leaflet :** Utilisé pour l'affichage de toutes les cartes interactives (carte principale, sélection de point, mini-cartes) en raison de sa légèreté et de sa simplicité d'intégration, sans dépendance à une clé API tierce (contrairement à Google Maps).
*   **Bootstrap 5 :** Choisi pour prototyper rapidement une interface claire, "mobile-first" et esthétiquement propre via des classes utilitaires (pas de SCSS personnalisé lourd).
