# Guide des Tests

Ce document explique comment exécuter et comprendre les tests de la plateforme e-signature.

## Structure des Tests

### Tests Unitaires (`*.spec.ts`)
Les tests unitaires se trouvent à côté des fichiers sources dans `src/` :
- `src/services/*.spec.ts` - Tests des services
- `src/controllers/*.spec.ts` - Tests des contrôleurs (à créer)

### Tests Fonctionnels/E2E (`*.e2e-spec.ts`)
Les tests end-to-end se trouvent dans le dossier `test/` :
- `test/auth.e2e-spec.ts` - Tests des endpoints d'authentification
- `test/documents.e2e-spec.ts` - Tests des endpoints de documents

## Commandes de Test

### Exécuter tous les tests unitaires
```bash
npm run test
```

### Exécuter les tests en mode watch
```bash
npm run test:watch
```

### Exécuter les tests avec couverture de code
```bash
npm run test:cov
```

### Exécuter les tests e2e
```bash
npm run test:e2e
```

### Exécuter un fichier de test spécifique
```bash
npm run test -- file-validation.service.spec.ts
```

## Tests Unitaires Créés

### Services Testés

1. **FileValidationService**
   - Validation des types MIME
   - Validation de la taille des fichiers
   - Règles de validation personnalisées

2. **PermissionService**
   - Vérification d'accès aux documents
   - Gestion des rôles (USER/ADMIN)

3. **DocumentMapperService**
   - Conversion Document → DocumentDto
   - Mapping des signatures et signataires

4. **CryptographyService**
   - Génération de hash
   - Création de signatures PKCS#7
   - Vérification de signatures

5. **AuthService**
   - Login avec validation
   - Inscription d'utilisateurs
   - Validation de tokens

6. **StorageService**
   - Stockage et récupération de fichiers
   - Gestion des clés de stockage

7. **DocumentService**
   - Création de documents
   - Signature de documents
   - Vérification de documents

## Tests E2E Créés

### AuthController (e2e)
- ✅ POST /auth/register - Inscription
- ✅ POST /auth/login - Connexion
- ✅ GET /auth/profile - Profil utilisateur
- ✅ POST /auth/logout - Déconnexion

### DocumentsController (e2e)
- ✅ POST /documents - Upload de document
- ✅ GET /documents - Liste des documents
- ✅ GET /documents/:id - Détail d'un document
- ✅ POST /documents/:id/sign - Signature d'un document
- ✅ POST /documents/:id/verify - Vérification d'un document

## Configuration

### Jest (Tests Unitaires)
Configuration dans `package.json` :
- `rootDir: "src"`
- `testRegex: ".*\\.spec\\.ts$"`
- `testEnvironment: "node"`

### Jest E2E
Configuration dans `test/jest-e2e.json` :
- `rootDir: "."`
- `testRegex: ".e2e-spec.ts$"`
- Timeout: 30 secondes

## Prérequis pour les Tests E2E

Les tests e2e nécessitent :
1. Une base de données PostgreSQL accessible
2. Les variables d'environnement configurées (`.env`)
3. Les migrations exécutées

## Exemples d'Utilisation

### Exécuter un test spécifique
```bash
# Test unitaire
npm run test -- file-validation.service.spec.ts

# Test e2e
npm run test:e2e -- auth.e2e-spec.ts
```

### Mode debug
```bash
npm run test:debug
```

### Couverture de code
```bash
npm run test:cov
# Résultats dans coverage/
```

## Notes Importantes

1. **Base de données** : Les tests e2e utilisent une vraie base de données. Utilisez une base de test séparée.

2. **Isolation** : Chaque test devrait être indépendant. Utilisez `beforeEach` et `afterEach` pour nettoyer.

3. **Mocks** : Les tests unitaires utilisent des mocks pour isoler les dépendances.

4. **Timeout** : Les tests e2e ont un timeout de 30 secondes par défaut.

## Prochaines Étapes

- [ ] Ajouter des tests pour les contrôleurs
- [ ] Ajouter des tests d'intégration pour les transactions
- [ ] Améliorer la couverture de code
- [ ] Ajouter des tests de performance
