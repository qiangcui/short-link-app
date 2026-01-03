# Troubleshooting Guide

## Permission Denied Errors

If you're getting "Permission denied" errors when creating short links, follow these steps:

### Step 1: Verify Your Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** > **Rules**
4. Make sure your rules include **ALL** of the following:

#### Required Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
	  
    // Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isExistingOwner(userId) {
      return isOwner(userId) && resource != null;
    }

    // ⚠️ IMPORTANT: This rule is REQUIRED for redirects to work
    match /publicLinks/{shortCode} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.userId == resource.data.userId;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // User Profile
    match /users/{userId} {
      allow get: if isOwner(userId);
      allow list: if false;
      allow create: if isOwner(userId) && request.resource.data.id == userId;
      allow update: if isExistingOwner(userId) && request.resource.data.id == resource.data.id;
      allow delete: if isExistingOwner(userId);
    }

    // User's Short Links
    match /users/{userId}/shortLinks/{shortLinkId} {
      allow get: if isOwner(userId);
      allow list: if isOwner(userId);
      allow create: if isOwner(userId) && request.resource.data.userId == userId;
      allow update: if isExistingOwner(userId) && request.resource.data.userId == resource.data.userId;
      allow delete: if isExistingOwner(userId);
    }
    
    // Click Events
    match /users/{userId}/shortLinks/{shortLinkId}/clickEvents/{clickEventId} {
      allow get: if isOwner(userId);
      allow list: if isOwner(userId);
      allow create: if isOwner(userId) && request.resource.data.shortLinkId == shortLinkId;
      allow update: if isExistingOwner(userId) && request.resource.data.shortLinkId == resource.data.shortLinkId;
      allow delete: if isExistingOwner(userId);
    }

  }
}
```

### Step 2: Publish Your Rules

After updating the rules:
1. Click **Publish** button in the Rules editor
2. Wait for the confirmation message
3. Rules can take a few seconds to propagate

### Step 3: Verify Authentication

1. Make sure you're signed in (check the navbar - you should see your email/name)
2. If not signed in, click "Login" and sign in
3. Try creating a link again

### Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to the **Console** tab
3. Look for specific error messages that indicate which operation failed:
   - "Error creating private link" = issue with `/users/{userId}/shortLinks` rules
   - "Error creating public link" = issue with `/publicLinks` rules (most common)

### Step 5: Common Issues

#### Issue: "Permission denied creating public link"
**Solution**: You're missing the `/publicLinks` collection rules. Add the `match /publicLinks/{shortCode}` block to your rules.

#### Issue: "Permission denied creating private link"
**Solution**: Check that:
- You're signed in
- The `/users/{userId}/shortLinks` rules are present
- The `userId` in the document matches `request.auth.uid`

#### Issue: Rules published but still getting errors
**Solution**: 
- Wait 10-30 seconds for rules to propagate
- Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
- Sign out and sign back in

### Step 6: Test Rules in Firebase Console

1. Go to **Firestore Database** > **Rules**
2. Click **Rules Playground** tab
3. Test your rules:
   - Location: `publicLinks/test123`
   - Operation: `create`
   - Authenticated: `Yes`
   - User ID: Your user ID
   - Data: `{ userId: "your-user-id", originalUrl: "https://example.com" }`
4. Click **Run** - it should show "Allow"

## Still Having Issues?

1. Check the complete rules in `FIREBASE_SECURITY_RULES.md`
2. Verify Authentication is enabled in Firebase Console
3. Check that Email/Password authentication is enabled
4. Make sure your `firebase.js` has the correct configuration

