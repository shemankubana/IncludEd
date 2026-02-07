// Authentication Context Provider
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, authHelpers } from '../firebase.config';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = authHelpers.onAuthStateChange(async (user) => {
            setCurrentUser(user);
            
            if (user) {
                try {
                    // Fetch user profile from backend
                    const token = await user.getIdToken();
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const profile = await response.json();
                        setUserProfile(profile);
                    }
                } catch (err) {
                    console.error('Error fetching user profile:', err);
                    setError(err.message);
                }
            } else {
                setUserProfile(null);
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Register function
    const register = async (email, password, displayName, role) => {
        setError(null);
        try {
            const result = await authHelpers.register(email, password, displayName, role);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Login function
    const login = async (email, password) => {
        setError(null);
        try {
            const { user, profile } = await authHelpers.login(email, password);
            setUserProfile(profile);
            return { user, profile };
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Logout function
    const logout = async () => {
        setError(null);
        try {
            await authHelpers.logout();
            setUserProfile(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Reset password function
    const resetPassword = async (email) => {
        setError(null);
        try {
            return await authHelpers.resetPassword(email);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Get current user token
    const getToken = async () => {
        return await authHelpers.getCurrentUserToken();
    };

    // Check if user has specific role
    const hasRole = (role) => {
        return userProfile?.role === role;
    };

    // Check if user is teacher
    const isTeacher = () => hasRole('teacher');

    // Check if user is student
    const isStudent = () => hasRole('student');

    // Check if user is admin
    const isAdmin = () => hasRole('admin');

    const value = {
        currentUser,
        userProfile,
        loading,
        error,
        register,
        login,
        logout,
        resetPassword,
        getToken,
        hasRole,
        isTeacher,
        isStudent,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
