# Helper Guide: Setting up Firebase for your Short Link App

To make your URL shortener work, you need to connect it to a Firebase project. Follow these steps:

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the prompts.

## 2. Enable Firestore Database
1. In your project dashboard, navigate to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a location and start in **Test mode** (for now).

## 3. Enable Authentication
1. In your project dashboard, navigate to **Build** > **Authentication**.
2. Click **Get Started**.
3. Enable **Email/Password** authentication provider.
4. Save the changes.

## 4. Get Your Configuration
1. Click the **Project settings** (gear icon) in the top left.
2. Scroll down to the "Your apps" section.
3. Click the `</>` icon (Web) to create a new web app.
4. Register the app (you can ignore Firebase Hosting for now).
5. You will see a `firebaseConfig` object. Copy the values.

## 5. Update Your Code
1. Open `src/firebase.js` in your project.
2. Replace the placeholder values in the `firebaseConfig` object with your copied values.

## 6. Security Rules (Critical!)
The app uses a strict user-ownership security model. You **must** set up the security rules correctly.

1. Navigate to **Firestore Database** > **Rules** in the Firebase Console.
2. Copy the complete rules from `FIREBASE_SECURITY_RULES.md` in this project.
3. Paste them into the Rules editor.
4. Click **Publish**.

**Important**: The app requires these rules to function properly. The rules enforce:
- User authentication for creating/managing links
- Public read access to `/publicLinks` for redirects
- Private user data isolation under `/users/{userId}`

See `FIREBASE_SECURITY_RULES.md` for the complete rules and detailed explanations.
