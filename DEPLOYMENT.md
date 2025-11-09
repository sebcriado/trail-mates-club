# 🚀 Guide de Déploiement - HikingHub

Ce guide décrit comment déployer HikingHub sur Vercel avec des environnements de **production** et **pré-production** (staging).

## 📋 Table des Matières

1. [Architecture des Environnements](#architecture-des-environnements)
2. [Prérequis](#prérequis)
3. [Configuration Supabase](#configuration-supabase)
4. [Configuration Vercel](#configuration-vercel)
5. [Configuration GitHub](#configuration-github)
6. [Déploiement](#déploiement)
7. [Workflow de Développement](#workflow-de-développement)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture des Environnements

```
┌─────────────────────────────────────────────────┐
│              GitHub Repository                   │
│                                                  │
│  main branch      →  Production                  │
│  staging branch   →  Staging (Pré-production)   │
│  Pull Requests    →  Preview deployments        │
└─────────────────────────────────────────────────┘
         │                    │                │
         ▼                    ▼                ▼
    ┌─────────┐          ┌─────────┐      ┌─────────┐
    │  PROD   │          │ STAGING │      │ PREVIEW │
    │ Vercel  │          │ Vercel  │      │ Vercel  │
    └─────────┘          └─────────┘      └─────────┘
         │                    │                │
         ▼                    ▼                ▼
    ┌─────────┐          ┌─────────┐      ┌─────────┐
    │Supabase │          │Supabase │      │Supabase │
    │  PROD   │          │ STAGING │      │ STAGING │
    └─────────┘          └─────────┘      └─────────┘
```

---

## ✅ Prérequis

- [ ] Compte [Vercel](https://vercel.com) (gratuit ou payant)
- [ ] Compte [Supabase](https://supabase.com) (gratuit ou payant)
- [ ] Repository GitHub connecté
- [ ] Node.js 20+ installé localement
- [ ] Git installé

---

## 🗄️ Configuration Supabase

### Étape 1: Créer les Projets Supabase

Vous avez besoin de **2 projets Supabase** distincts:

#### 1.1 Projet Production

1. Aller sur https://app.supabase.com
2. Cliquer sur "New Project"
3. Nommer le projet: `hikinghub-prod`
4. Choisir une région proche de vos utilisateurs
5. Définir un mot de passe fort pour la base de données
6. Attendre la création du projet (~2 minutes)

#### 1.2 Projet Staging

1. Répéter le processus
2. Nommer le projet: `hikinghub-staging`
3. Utiliser la même région
4. Définir un mot de passe différent

### Étape 2: Configurer les Bases de Données

Pour **chaque projet** (prod et staging):

#### 2.1 Récupérer les Credentials

1. Aller dans `Settings` → `API`
2. Noter:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

#### 2.2 Exécuter les Migrations

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet PRODUCTION
supabase link --project-ref your-prod-project-id

# Exécuter les migrations sur PRODUCTION
supabase db push

# Lier le projet STAGING
supabase link --project-ref your-staging-project-id

# Exécuter les migrations sur STAGING
supabase db push
```

#### 2.3 Vérifier les Tables

Dans l'interface Supabase (`Table Editor`), vérifier que les tables suivantes existent:
- `profiles`
- `hiking_groups`
- `group_members`
- `hiking_events`
- `event_participants`

---

## ☁️ Configuration Vercel

### Étape 1: Créer le Projet Vercel

1. Aller sur https://vercel.com
2. Cliquer sur "Add New..." → "Project"
3. Importer votre repository GitHub
4. **Important**: Ne pas déployer tout de suite!

### Étape 2: Configurer les Environnements

#### 2.1 Variables d'Environnement - Production

1. Dans Vercel, aller dans `Settings` → `Environment Variables`
2. Ajouter les variables suivantes pour **Production**:

| Variable Name              | Value                              | Environment |
|---------------------------|------------------------------------|-------------|
| `VITE_SUPABASE_URL`       | URL de votre projet Supabase PROD  | Production  |
| `VITE_SUPABASE_ANON_KEY`  | Anon key de votre projet PROD      | Production  |

#### 2.2 Variables d'Environnement - Staging

1. Ajouter les variables pour **Preview** (staging):

| Variable Name              | Value                                 | Environment |
|---------------------------|---------------------------------------|-------------|
| `VITE_SUPABASE_URL`       | URL de votre projet Supabase STAGING  | Preview     |
| `VITE_SUPABASE_ANON_KEY`  | Anon key de votre projet STAGING      | Preview     |

### Étape 3: Configurer les Domaines

#### 3.1 Production

- Domaine par défaut: `hikinghub.vercel.app`
- Domaine custom (optionnel): `www.votre-domaine.com`

#### 3.2 Staging

1. Dans `Settings` → `Domains`
2. Ajouter un domaine staging: `staging-hikinghub.vercel.app`
3. Le lier à la branche `staging`

### Étape 4: Récupérer les Tokens Vercel

Pour le CI/CD avec GitHub Actions:

1. Aller dans `Settings` → `Tokens`
2. Créer un nouveau token: "GitHub Actions Token"
3. Copier le token (vous ne le verrez qu'une fois!)
4. Noter aussi:
   - **Vercel Org ID**: Dans `Settings` → `General` → `Organization ID`
   - **Vercel Project ID**: Dans `Settings` → `General` → `Project ID`

---

## 🔐 Configuration GitHub

### Étape 1: Ajouter les Secrets GitHub

1. Aller sur votre repository GitHub
2. `Settings` → `Secrets and variables` → `Actions`
3. Cliquer sur "New repository secret"
4. Ajouter les secrets suivants:

| Secret Name                         | Value                                    |
|------------------------------------|------------------------------------------|
| `VERCEL_TOKEN`                     | Token Vercel créé précédemment           |
| `VERCEL_ORG_ID`                    | Organization ID de Vercel                |
| `VERCEL_PROJECT_ID`                | Project ID de Vercel                     |
| `VITE_SUPABASE_URL_STAGING`        | URL du projet Supabase STAGING           |
| `VITE_SUPABASE_ANON_KEY_STAGING`   | Anon key du projet Supabase STAGING      |

### Étape 2: Créer la Branche Staging

```bash
# Créer la branche staging depuis main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

### Étape 3: Protéger les Branches

1. Dans GitHub: `Settings` → `Branches`
2. Ajouter une règle pour `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

3. Répéter pour `staging`

---

## 🚀 Déploiement

### Déploiement Automatique

Le CI/CD est configuré pour déployer automatiquement:

#### 1. Staging (Pré-production)
```bash
# Push sur la branche staging
git checkout staging
git merge main  # ou votre branche feature
git push origin staging

# → Déclenche automatiquement:
#    1. Tests de qualité (lint, type check, build)
#    2. Déploiement sur Vercel (environnement preview)
#    3. Utilise la base Supabase STAGING
```

#### 2. Production
```bash
# Push sur la branche main (via PR recommandé)
git checkout main
git merge staging  # après validation sur staging
git push origin main

# → Déclenche automatiquement:
#    1. Tests de qualité
#    2. Déploiement sur Vercel (environnement production)
#    3. Utilise la base Supabase PRODUCTION
```

#### 3. Preview (Pull Requests)
```bash
# Créer une Pull Request
git checkout -b feature/nouvelle-fonctionnalite
git push -u origin feature/nouvelle-fonctionnalite

# Ouvrir une PR sur GitHub
# → Crée automatiquement un déploiement preview avec URL unique
```

### Déploiement Manuel

Si besoin de déployer manuellement:

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer en staging
vercel --env VITE_SUPABASE_URL=xxx --env VITE_SUPABASE_ANON_KEY=xxx

# Déployer en production
vercel --prod --env VITE_SUPABASE_URL=xxx --env VITE_SUPABASE_ANON_KEY=xxx
```

---

## 🔄 Workflow de Développement

### Workflow Recommandé

```
1. Développement local
   ├── Créer une branche feature
   ├── Développer et tester localement
   └── Commit + Push

2. Pull Request
   ├── Ouvrir une PR vers staging
   ├── Review automatique (CI)
   ├── Déploiement preview automatique
   ├── Review code par l'équipe
   └── Merge vers staging

3. Test sur Staging
   ├── Tests manuels sur l'environnement staging
   ├── Tests d'intégration
   └── Validation métier

4. Déploiement Production
   ├── Ouvrir une PR de staging vers main
   ├── Review finale
   ├── Merge vers main
   └── Déploiement automatique en production
```

### Commandes Utiles

```bash
# Créer une nouvelle feature
git checkout staging
git pull origin staging
git checkout -b feature/nom-de-la-feature

# Pousser la feature
git add .
git commit -m "feat: description de la feature"
git push -u origin feature/nom-de-la-feature

# Mettre à jour staging
git checkout staging
git merge feature/nom-de-la-feature
git push origin staging

# Mettre en production
git checkout main
git merge staging
git push origin main
```

---

## 🐛 Troubleshooting

### Problème: Build échoue sur Vercel

**Solution**: Vérifier les variables d'environnement
```bash
# Dans Vercel Dashboard
Settings → Environment Variables
# S'assurer que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies
```

### Problème: Erreur de connexion Supabase

**Solution**: Vérifier les CORS
```sql
-- Dans Supabase SQL Editor
SELECT * FROM auth.config;

-- Ajouter les domaines Vercel aux CORS si nécessaire
```

### Problème: GitHub Actions échoue

**Solution**: Vérifier les secrets GitHub
```bash
# Dans GitHub Repository
Settings → Secrets and variables → Actions
# Vérifier que tous les secrets sont présents et valides
```

### Problème: Migrations ne s'appliquent pas

**Solution**: Exécuter manuellement
```bash
# Se connecter au projet Supabase
supabase link --project-ref your-project-id

# Forcer les migrations
supabase db push --force
```

### Problème: Preview deployment ne fonctionne pas

**Solution**: Vérifier les variables Preview dans Vercel
```bash
# Dans Vercel Dashboard
Settings → Environment Variables → Preview
# S'assurer que les variables STAGING sont définies pour Preview
```

---

## 📞 Support

- **Documentation Vercel**: https://vercel.com/docs
- **Documentation Supabase**: https://supabase.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions

---

## 📝 Checklist de Déploiement Initial

- [ ] 2 projets Supabase créés (prod + staging)
- [ ] Migrations exécutées sur les 2 projets
- [ ] Projet Vercel créé et repository importé
- [ ] Variables d'environnement configurées dans Vercel (Production + Preview)
- [ ] Secrets GitHub configurés (5 secrets requis)
- [ ] Branche `staging` créée et poussée
- [ ] Protection des branches `main` et `staging` activée
- [ ] Premier déploiement en staging réussi
- [ ] Tests sur staging effectués
- [ ] Premier déploiement en production réussi
- [ ] Domaines configurés (optionnel)

---

**Dernière mise à jour**: Novembre 2025
**Version**: 1.0.0
