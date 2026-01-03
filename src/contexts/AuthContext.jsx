import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Create user profile if it doesn't exist
          await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            createdAt: serverTimestamp()
          });
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName = '') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Create user profile in Firestore
    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName || '',
      createdAt: serverTimestamp()
    });
    
    return userCredential;
  };

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    return await firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    signup,
    login,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

