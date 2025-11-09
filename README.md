# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/99d40881-5dfd-4a82-ab57-a9192733009a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/99d40881-5dfd-4a82-ab57-a9192733009a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Option 1: Deploy with Lovable (Quick)

Simply open [Lovable](https://lovable.dev/projects/99d40881-5dfd-4a82-ab57-a9192733009a) and click on Share -> Publish.

### Option 2: Deploy with Vercel (Production-Ready)

For production and staging environments with CI/CD:

1. **Quick Setup**: Follow the detailed guide in [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Requirements**:
   - Vercel account
   - 2 Supabase projects (production + staging)
   - GitHub repository connected
3. **Features**:
   - ✅ Automatic deployments (main = production, staging = pre-production)
   - ✅ Preview deployments for Pull Requests
   - ✅ CI/CD with GitHub Actions (lint, type-check, build)
   - ✅ Separate databases for each environment

See the complete deployment guide: [📖 DEPLOYMENT.md](./DEPLOYMENT.md)

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
