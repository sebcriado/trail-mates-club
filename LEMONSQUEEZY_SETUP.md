# Configuration Lemonsqueezy

## 1. Créer ton produit

1. Va sur [Lemonsqueezy Dashboard](https://app.lemonsqueezy.com)
2. Crée un nouveau produit **Subscription** :
   - Nom : "Premium"
   - Prix : 5,99€/mois
   - Type : Récurrent (mensuel)

## 2. Configurer le Checkout

### URLs de redirection (Optionnel)

Les URLs de redirection sont **automatiquement gérées par l'application** via les paramètres d'URL.

Cependant, tu peux configurer des **URLs de fallback** dans Lemonsqueezy :

1. Va dans **Products** → Sélectionne ton produit Premium
2. Clique sur **Checkout settings** ou **Settings**
3. Dans la section **"Redirect URLs"** ou **"After checkout"** :
   - **Success URL** (optionnel) : `https://ton-domaine.com/pricing?success=true`

**Note** : L'app passe déjà l'URL de succès via le paramètre `checkout[success_url]`, donc cette configuration est un fallback si l'URL n'est pas passée.

### Custom Data

Active les **custom fields** pour recevoir le `user_id` dans les webhooks :

1. Dans ton produit, cherche **"Custom data"** ou **"Checkout data"**
2. Active le champ `user_id` (sera passé automatiquement par l'app dans le webhook)

## 3. Récupérer l'URL de Checkout

1. Dans ton produit, clique sur **"Get checkout link"**
2. Copie l'URL (format : `https://yourstore.lemonsqueezy.com/checkout/buy/xxxxx`)
3. Ajoute-la dans ton fichier `.env` :

```bash
VITE_LEMONSQUEEZY_CHECKOUT_URL=https://yourstore.lemonsqueezy.com/checkout/buy/xxxxx
```

## 4. Configurer le Webhook

Pour que l'abonnement soit activé automatiquement dans l'app :

1. Va dans **Settings → Webhooks**
2. Crée un nouveau webhook :
   - URL : `https://[ton-projet].supabase.co/functions/v1/lemonsqueezy-webhook`
   - Events : Sélectionne tous les événements `subscription_*` :
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
     - `subscription_resumed`
     - `subscription_expired`
     - `subscription_paused`
     - `subscription_unpaused`
     - `subscription_payment_success`

3. Copie le **Signing Secret**
4. Ajoute-le dans les secrets de Supabase Edge Functions :

```bash
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=ton_signing_secret
```

## 5. Mode Test

Pour tester sans payer réellement :

1. Active le **Test Mode** dans Lemonsqueezy (Settings → Store)
2. Utilise la carte de test :
   - Numéro : `4242 4242 4242 4242`
   - Date : N'importe quelle date future
   - CVC : N'importe quel code à 3 chiffres

## 6. Déployer l'Edge Function

Une fois tout configuré :

```bash
# Déployer la fonction webhook
supabase functions deploy lemonsqueezy-webhook

# Vérifier que le secret est bien configuré
supabase secrets list
```

## 7. Tester le flux complet

1. Connecte-toi à ton app
2. Va sur `/pricing`
3. Clique sur "Passer à Premium"
4. Effectue un paiement test
5. Vérifie que tu es bien redirigé vers `/pricing?success=true`
6. Vérifie dans Supabase que la subscription a été créée dans la table `subscriptions`
7. Vérifie que le badge "Abonnement actif" s'affiche

## Résolution de problèmes

### Le webhook ne fonctionne pas

1. Vérifie les logs de l'Edge Function :
   ```bash
   supabase functions logs lemonsqueezy-webhook
   ```

2. Vérifie que le webhook est bien configuré dans Lemonsqueezy
3. Teste manuellement le webhook avec l'outil de test Lemonsqueezy

### L'utilisateur n'est pas redirigé

1. Vérifie que l'URL de checkout est bien configurée dans `.env`
2. Vérifie que les URLs de redirection sont correctes dans Lemonsqueezy
3. Regarde la console du navigateur pour des erreurs

### L'abonnement n'est pas activé

1. Vérifie que le webhook a bien été appelé (dans Lemonsqueezy → Webhooks → Logs)
2. Vérifie les logs de la fonction Edge
3. Vérifie manuellement la table `subscriptions` dans Supabase
