# eSign Platform — Backend

> Backend de la plateforme de signature électronique eSign Platform.
>
> API sécurisée, gestion des utilisateurs, documents et workflows administratifs.

## ✨ Vue d’ensemble

Le backend de `eSign Platform` alimente le frontend Angular et fournit :

- Une API REST sécurisée pour l’administration et l’accès aux documents.
- La gestion des utilisateurs, rôles et statuts.
- La validation des documents électroniques.
- La gestion des connexions et de l’activité utilisateur.

## 🧱 Architecture

- **Framework** : NestJS
- **Langage** : TypeScript
- **ORM** : TypeORM
- **Style** : modules, contrôleurs, services, entités, DTOs, migrations

## 🚀 Environnement de développement

### Installation

```bash
cd apps/backend
npm install
```

### Lancer l’application

```bash
npm run start
```

### Lancer en mode développement

```bash
npm run start:dev
```

### Lancer en production

```bash
npm run start:prod
```

## 🧪 Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## 📁 Structure clé

- `src/app.module.ts` — point d’entrée principal
- `src/controllers/` — routes de l’API et gestion des endpoints
- `src/services/` — logique métier, sécurité, cryptographie, stockage
- `src/entities/` — modèles de données et entités TypeORM
- `src/dto/` — validation et transformation des requêtes
- `src/migrations/` — versionnage du schéma de base de données
- `src/config/` — configuration des variables d’environnement

## ⚙️ Configuration

La configuration est centralisée dans `src/config/configuration.ts`.

Assure-toi de définir les variables suivantes :

- `DATABASE_URL` ou les paramètres DB
- `JWT_SECRET`
- paramètres de stockage et de certificats
- options d’authentification et de sécurité

## 🎯 Objectif du backend

Ce backend est construit pour :

- prendre en charge l’administration de la plateforme,
- sécuriser les opérations sur les utilisateurs et documents,
- offrir une base évolutive pour les nouvelles fonctionnalités métier.

## 📝 Recommandations

- Garder la logique métier dans les services.
- Utiliser les DTOs pour valider les données entrantes.
- Versionner les changements de schéma avec les migrations.

## 📌 Licence

Ce projet est distribué sous licence **MIT**.
