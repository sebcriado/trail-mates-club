# Configuration de la fonctionnalité Itinéraires 🗺️

## ✅ Implémentation terminée

Toutes les fonctionnalités ont été implémentées avec succès :
- ✅ Migration de base de données
- ✅ Installation des dépendances Mapbox
- ✅ Types TypeScript et utilitaires géospatiaux
- ✅ Service API d'élévation (Open-Elevation)
- ✅ Composant d'affichage de carte (public)
- ✅ Composant de dessin de carte (premium)
- ✅ Barre de recherche d'adresse (Geocoder)
- ✅ Import de fichiers GPX
- ✅ Intégration dans les pages CreateEvent, EditEvent et EventDetail

## 🚀 Étapes restantes pour activer la fonctionnalité

### 1. Configurer le token Mapbox

1. Créer un compte gratuit sur [Mapbox](https://www.mapbox.com/)
2. Obtenir votre token d'accès public (pk.xxx...)
3. Ajouter le token dans votre fichier `.env` :

```bash
VITE_MAPBOX_ACCESS_TOKEN=pk.votre_token_ici
VITE_MAPBOX_STYLE=mapbox://styles/mapbox/outdoors-v12
```

**Limites du plan gratuit Mapbox :**
- 50 000 chargements de carte par mois
- 100 000 requêtes d'élévation par mois

### 2. Appliquer la migration de base de données

La migration se trouve dans : `/supabase/migrations/20250205000000_add_event_itinerary.sql`

**Option A - Via le dashboard Supabase :**
1. Aller sur [app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans `Database` > `Migrations` (ou `SQL Editor`)
4. Copier-coller le contenu du fichier de migration
5. Exécuter

**Option B - Via Supabase CLI (recommandé) :**
```bash
# Installer la CLI Supabase si nécessaire
npm install -g supabase

# Appliquer la migration
supabase db push
```

### 3. Régénérer les types TypeScript

Après avoir appliqué la migration, régénérer les types Supabase :

```bash
# Avec la CLI Supabase
supabase gen types typescript --project-id votre-project-id > src/integrations/supabase/types.ts
```

Une fois les types régénérés, vous pourrez **supprimer les commentaires `// @ts-ignore`** dans :
- `/src/pages/CreateEvent.tsx` (lignes ~161-171)
- `/src/pages/EditEvent.tsx` (lignes ~176-186)

### 4. Tester la fonctionnalité

```bash
# Lancer l'application
npm run dev
```

**Tests à effectuer :**

1. **En tant qu'utilisateur premium :**
   - ✅ Créer un événement → Dessiner un itinéraire sur la carte
   - ✅ Vérifier que les métriques se calculent (distance, dénivelé, durée)
   - ✅ Éditer un événement existant → Modifier l'itinéraire

2. **En tant qu'utilisateur non-premium :**
   - ✅ Créer un événement → Voir le CTA "Passer à Premium"
   - ✅ Voir un événement avec itinéraire → La carte s'affiche

3. **En tant que visiteur non connecté :**
   - ✅ Voir un événement avec itinéraire → La carte s'affiche

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers :
- `/supabase/migrations/20250205000000_add_event_itinerary.sql`
- `/src/types/itinerary.ts`
- `/src/lib/geospatial.ts`
- `/src/lib/gpxParser.ts` - Parseur GPX vers GeoJSON
- `/src/services/elevationService.ts`
- `/src/components/itinerary/ItineraryDrawMap.tsx`
- `/src/components/itinerary/ItineraryDisplayMap.tsx`

### Fichiers modifiés :
- `/src/pages/CreateEvent.tsx` - Ajout du composant de dessin
- `/src/pages/EditEvent.tsx` - Ajout du composant de dessin avec données existantes
- `/src/pages/EventDetail.tsx` - Ajout de l'affichage public de la carte
- `/src/main.tsx` - Import des CSS Mapbox et Geocoder
- `/.env.example` - Ajout des variables Mapbox

## 🎯 Fonctionnalités

### Gating Premium ✅
- **Création/édition d'itinéraires** : Réservé aux utilisateurs premium uniquement
- **Affichage des itinéraires** : Public (tous les utilisateurs peuvent voir les cartes)

### Barre de recherche d'adresse 🔍
- **Geocoder intégré** : Recherche d'adresses et de lieux sur les cartes
- **Langue française** : Interface et résultats en français
- **Pays limité** : Recherche limitée à la France (modifiable dans le code)
- **Disponible sur** : Composants de dessin ET d'affichage

### Import GPX 📁
- **Import de traces** : Compatible avec fichiers GPX depuis Strava, Komoot, GPS, etc.
- **Conversion automatique** : Conversion GPX → GeoJSON
- **Détection d'élévation** : Utilise les données d'élévation du GPX si présentes, sinon appel API
- **Validation** : Vérification du format et gestion d'erreurs
- **Prévisualisation** : La trace s'affiche immédiatement sur la carte

### Métriques calculées 📊
- **Distance totale** : Calcul via formule de Haversine
- **Dénivelé positif** : D+ via API d'élévation Open-Elevation
- **Dénivelé négatif** : D- via API d'élévation
- **Durée estimée** : Règle de Naismith (5 km/h + 1h/600m D+) ajustée par difficulté

### API d'élévation
L'application utilise **Open-Elevation API** (gratuite, sans token) :
- Pas de limite de requêtes
- Requêtes batchées (100 points par requête)
- Rate limiting respectueux (500ms entre batches)
- Fallback gracieux si l'API échoue

## 🔧 Technologies utilisées

- **Mapbox GL JS** - Cartographie interactive
- **Mapbox Draw** - Outils de dessin d'itinéraires
- **Mapbox Geocoder** - Recherche d'adresses et de lieux
- **@tmcw/togeojson** - Conversion GPX vers GeoJSON
- **Open-Elevation API** - Données d'élévation gratuites
- **Formule de Haversine** - Calcul de distance précis
- **Règle de Naismith** - Estimation de durée de randonnée

## 📱 Responsive

- Desktop : Carte 500px de hauteur
- Mobile : Carte 400px de hauteur
- Métriques : Grid 4 colonnes → 2 colonnes sur mobile
- Touch optimisé pour le dessin sur mobile

## 🐛 Dépannage

### La carte ne s'affiche pas
- Vérifier que `VITE_MAPBOX_ACCESS_TOKEN` est configuré dans `.env`
- Vérifier la console pour des erreurs Mapbox
- S'assurer que le token est bien un token public (commence par `pk.`)

### Les métriques ne se calculent pas
- Vérifier la console pour des erreurs de l'API Open-Elevation
- L'API peut être temporairement indisponible (retry plus tard)
- Les métriques resteront à 0 si l'API échoue (graceful degradation)

### Erreurs TypeScript après migration
- Régénérer les types Supabase (voir étape 3)
- Redémarrer le serveur de développement

## 📖 Documentation

Pour plus de détails sur l'implémentation, voir le plan complet :
`/Users/criadosebastien/.claude/plans/rustling-discovering-sutton.md`
