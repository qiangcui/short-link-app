# Short Link App

A React-based short link application built with Vite and Firebase.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Get your Firebase configuration from [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → "Your apps"
   - Update the `.env` file with your Firebase credentials:
     ```
     VITE_FIREBASE_API_KEY=your-api-key-here
     VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain-here
     VITE_FIREBASE_PROJECT_ID=your-project-id-here
     VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket-here
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id-here
     VITE_FIREBASE_APP_ID=your-app-id-here
     ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Environment Variables

This project uses environment variables for Firebase configuration. Make sure to:
- Never commit your `.env` file to version control (it's already in `.gitignore`)
- Use `.env.example` as a template for required variables
- All environment variables must be prefixed with `VITE_` to be accessible in the client-side code

## Firebase Setup

See the following documentation files for detailed setup instructions:
- `FIREBASE_SETUP.md` - Initial Firebase configuration
- `FIREBASE_SECURITY_RULES.md` - Security rules configuration
- `CUSTOM_DOMAIN_SETUP.md` - Custom domain configuration
- `TROUBLESHOOTING.md` - Common issues and solutions
