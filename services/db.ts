
import { User, Message, ChatSession } from '../types';
import { auth, firestore } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile as updateAuthProfile,
  signOut as firebaseSignOut
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc
} from "firebase/firestore";

/**
 * Firebase Database Service
 * Connects to Firebase Auth and Firestore.
 */

export const db = {
  users: {
    async create(email: string, password: string, name: string): Promise<User> {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update display name in Auth
        await updateAuthProfile(firebaseUser, { displayName: name });

        const newUser: User = {
          id: firebaseUser.uid,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          createdAt: Date.now(),
          lastLogin: Date.now()
        };

        // Create user document in Firestore
        await setDoc(doc(firestore, "users", firebaseUser.uid), newUser);
        
        return newUser;
      } catch (error: any) {
        console.error("Firebase Create User Error:", error);
        throw new Error(this._mapAuthError(error.code));
      }
    },

    async authenticate(email: string, password: string): Promise<User> {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Retrieve extra user data from Firestore
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          // Update last login
          await updateDoc(userDocRef, { lastLogin: Date.now() });
          return { ...userData, lastLogin: Date.now() };
        } else {
            // Fallback if firestore doc doesn't exist but auth does (rare)
            const fallbackUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || email,
                name: firebaseUser.displayName || 'User',
                createdAt: Date.now(),
                lastLogin: Date.now()
            }
             await setDoc(userDocRef, fallbackUser);
             return fallbackUser;
        }
      } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        throw new Error(this._mapAuthError(error.code));
      }
    },

    async updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
      try {
        const userDocRef = doc(firestore, "users", userId);
        
        // Update Auth profile if name changed
        if (updates.name && auth.currentUser) {
            await updateAuthProfile(auth.currentUser, { displayName: updates.name });
        }

        await updateDoc(userDocRef, updates);
        
        // Return updated user
        const updatedSnap = await getDoc(userDocRef);
        return updatedSnap.data() as User;
      } catch (error) {
        console.error("Update Profile Error:", error);
        throw new Error("Failed to update profile");
      }
    },

    async getUser(userId: string): Promise<User | null> {
        try {
            const docRef = doc(firestore, "users", userId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() as User : null;
        } catch (e) {
            return null;
        }
    },

    async logout(): Promise<void> {
        await firebaseSignOut(auth);
    },

    _mapAuthError(code: string): string {
        switch (code) {
            case 'auth/email-already-in-use': return 'Email is already registered.';
            case 'auth/invalid-email': return 'Invalid email address.';
            case 'auth/user-not-found': return 'User not found.';
            case 'auth/wrong-password': return 'Invalid password.';
            case 'auth/invalid-credential': return 'Invalid credentials.';
            default: return 'Authentication failed. Please try again.';
        }
    }
  },

  chats: {
    async saveSession(userId: string, messages: Message[]): Promise<void> {
      try {
        const sessionRef = doc(firestore, "sessions", userId);
        const sessionData: ChatSession = {
            userId,
            messages,
            lastUpdated: Date.now()
        };
        await setDoc(sessionRef, sessionData);
      } catch (e) {
        console.error("Error saving session", e);
      }
    },

    async getSession(userId: string): Promise<Message[]> {
      try {
        const sessionRef = doc(firestore, "sessions", userId);
        const sessionSnap = await getDoc(sessionRef);
        
        if (sessionSnap.exists()) {
            return (sessionSnap.data() as ChatSession).messages || [];
        }
        return [];
      } catch (e) {
        console.error("Error fetching session", e);
        return [];
      }
    },

    async clearSession(userId: string): Promise<void> {
       try {
        const sessionRef = doc(firestore, "sessions", userId);
        await setDoc(sessionRef, { messages: [], userId, lastUpdated: Date.now() });
       } catch (e) {
           console.error("Error clearing session", e);
       }
    }
  },

  // Admin utilities simplified for Firebase
  admin: {
    exportAllData(): string {
        return JSON.stringify({ error: "Bulk export not available in client-side Firebase mode for security." });
    },

    importAllData(jsonString: string): void {
      console.warn("Bulk import not supported in client-side Firebase mode.");
      alert("Bulk import is disabled in this mode.");
    }
  }
};
