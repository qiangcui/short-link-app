# Firestore Security Rules

This document contains the complete Firestore security rules for the Short Link App, including the required public collection for redirects.

## Important: Public Links Collection

The app uses a hybrid approach:
- **Private Collections**: `/users/{userId}/shortLinks/{shortLinkId}` - User-owned, private data
- **Public Collection**: `/publicLinks/{shortCode}` - Public read access for redirects

## Complete Rules

Copy and paste these rules into your Firestore Rules tab in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
	  
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------

    /**
     * Checks if the user is authenticated.
     */
    function isSignedIn() {
      return request.auth != null;
    }

    /**
     * Checks if the currently authenticated user's UID matches the provided userId.
     * This is the foundation of the user-ownership model.
     * @param userId The UID to check against the authenticated user.
     */
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    /**
     * Checks for ownership on an existing document. Used for safe updates and deletes.
     * Prevents operations on documents that do not exist.
     * @param userId The UID of the document owner.
     */
    function isExistingOwner(userId) {
      return isOwner(userId) && resource != null;
    }

    // ------------------------------------------------------------------------
    // Public Links Collection (for redirects)
    // ------------------------------------------------------------------------

    /**
     * @description Public collection for URL redirects. Allows anyone to read links
     * for redirect purposes, but only authenticated users can create/update/delete
     * their own links.
     * @path /publicLinks/{shortCode}
     * @allow (read) Anyone can read for redirect purposes
     * @allow (create, update, delete) Only the owner can manage their public links
     */
    match /publicLinks/{shortCode} {
      allow read: if true; // Public read for redirects
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.userId == resource.data.userId;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // ------------------------------------------------------------------------
    // User Profile Collection
    // ------------------------------------------------------------------------

    /**
     * @description Manages user profile documents.
     * @path /users/{userId}
     * @allow (create) A new user creating their own profile document. `auth.uid` must match `{userId}`.
     * @allow (get, update, delete) The user accessing or modifying their own profile.
     * @deny (list) Any user attempting to list all user profiles.
     * @deny (create, update) A user trying to create or modify a profile for another user.
     * @principle Restricts access to a user's own data tree and allows self-creation of a root profile.
     */
    match /users/{userId} {
      allow get: if isOwner(userId);
      allow list: if false;
      allow create: if isOwner(userId) && request.resource.data.id == userId;
      allow update: if isExistingOwner(userId) && request.resource.data.id == resource.data.id;
      allow delete: if isExistingOwner(userId);
    }

    /**
     * @description Manages the short links created by a user.
     * @path /users/{userId}/shortLinks/{shortLinkId}
     * @allow (create, get, list, update, delete) The owner of the links managing their own data.
     * @deny (any) A user trying to access another user's links.
     * @principle Enforces document ownership for all operations within a user's private subcollection.
     */
    match /users/{userId}/shortLinks/{shortLinkId} {
      allow get: if isOwner(userId);
      allow list: if isOwner(userId);
      allow create: if isOwner(userId) && request.resource.data.userId == userId;
      allow update: if isExistingOwner(userId) && request.resource.data.userId == resource.data.userId;
      allow delete: if isExistingOwner(userId);
    }
    
    /**
     * @description Manages the click event analytics for a user's short link.
     * @path /users/{userId}/shortLinks/{shortLinkId}/clickEvents/{clickEventId}
     * @allow (create, get, list, update, delete) The owner of the parent short link managing its analytics.
     * @deny (any) A user trying to access analytics for another user's link.
     * @principle Enforces inherited ownership from the path and validates relational integrity.
     * 
     * NOTE: Click events are currently created by authenticated users only. For public click tracking
     * (redirects from unauthenticated users), consider using Cloud Functions.
     */
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

## Setup Instructions

1. Go to your Firebase Console
2. Navigate to **Firestore Database** > **Rules**
3. Replace the existing rules with the rules above
4. Click **Publish**

## Authentication Setup

You also need to enable Authentication in Firebase:

1. Go to **Authentication** in the Firebase Console
2. Click **Get Started**
3. Enable **Email/Password** authentication
4. Save

## Data Structure

The app uses the following data structure:

```
/users/{userId}                          # User profile (private)
  /shortLinks/{shortLinkId}               # User's short links (private)
    /clickEvents/{clickEventId}           # Click analytics (private)

/publicLinks/{shortCode}                  # Public redirect lookup (public read)
```

## Security Notes

- **Public Links**: The `/publicLinks` collection allows public read access for redirects, but only the owner can create/update/delete entries.
- **User Privacy**: All user data is isolated under `/users/{userId}` and only accessible by the owner.
- **No User Enumeration**: Listing all users is explicitly denied.
- **Click Tracking**: Currently, click tracking requires authentication. For public redirects, consider using Cloud Functions to handle click events server-side.

