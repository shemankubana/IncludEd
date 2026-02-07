// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    onAuthStateChanged
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Authentication helper functions
export const authHelpers = {
    // Register new user
    async register(email, password, displayName, role) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with display name
            await updateProfile(user, { displayName });

            // Send email verification
            await sendEmailVerification(user);

            // Get ID token with custom claims
            const idToken = await user.getIdToken();

            // Send to backend to create user profile with role
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    email,
                    displayName,
                    role,
                    firebaseUid: user.uid
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create user profile');
            }

            return { user, message: 'Registration successful! Please verify your email.' };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Login user
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                throw new Error('Please verify your email before logging in.');
            }

            // Get ID token
            const idToken = await user.getIdToken(true); // Force refresh to get custom claims

            // Get user profile from backend
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const profile = await response.json();

            return { user, profile };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Logout user
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Reset password
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { message: 'Password reset email sent! Check your inbox.' };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Get current user token
    async getCurrentUserToken() {
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    },

    // Subscribe to auth state changes
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, callback);
    }
};

export default app;
