# Deploy Short Link App to GitHub + Vercel

This app has a **frontend** (Vite + React) and a **backend** (Firebase: Firestore + Auth). Both work together when you deploy the frontend to Vercel and keep using Firebase in the cloud.

## 1. Push to GitHub

From the project root:

```bash
cd /path/to/short-link-app

# If this folder is not yet a git repo:
git init
git add .
git commit -m "Prepare for Vercel deployment"

# Create a new repository on GitHub (github.com → New repository), then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

If the folder is already a git repo (e.g. part of a monorepo), add this app as a **separate repo** by creating a new GitHub repo and pushing only the `short-link-app` directory:

```bash
cd short-link-app
git init
git add .
git commit -m "Initial commit: short-link-app"
git remote add origin https://github.com/YOUR_USERNAME/short-link-app.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. **Add New Project** → **Import Git Repository** → select the repo that contains `short-link-app`.
3. If the repo has multiple apps (monorepo), set **Root Directory** to `short-link-app`.
4. Vercel will detect Vite. Use:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. **Environment variables:** Add these (same as your local `.env`):

   | Name | Value |
   |------|--------|
   | `VITE_FIREBASE_API_KEY` | Your Firebase API key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
   | `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID |
   | `VITE_FIREBASE_APP_ID` | Your Firebase app ID |

   Get these from [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your apps.

5. Click **Deploy**. Your app will be live at `https://your-project.vercel.app`.

The `vercel.json` in this repo already configures SPA routing so paths like `/dashboard` and short links like `/:code` work correctly.

## 3. Backend (Firebase) — No Extra Deploy

- **Firestore** and **Auth** run on Firebase; no server of your own to deploy.
- The frontend on Vercel talks to Firebase using the env vars above. No backend deploy step on Vercel.
- Optional: the **Firebase Cloud Function** in `functions/` (server-side redirect) is not required for the app to work; redirects are handled in the browser. If you want to use it, deploy it to Firebase:

  ```bash
  cd functions
  npm install
  cd ..
  firebase deploy --only functions
  ```

## 4. After Deployment

- App URL: `https://your-project.vercel.app`
- Short links: `https://your-project.vercel.app/abc123`
- You can add a custom domain in Vercel: Project → Settings → Domains.
