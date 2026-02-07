// Protected Route Component for Role-Based Access Control
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { currentUser, userProfile, loading } = useAuth();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading-spinner-large"></div>
                <p className="ml-4 text-gray-600">Loading...</p>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Check if email is verified
    if (!currentUser.emailVerified) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="card max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Email Not Verified</h2>
                    <p className="text-gray-700 mb-4">
                        Please verify your email address to access this page.
                    </p>
                    <p className="text-sm text-gray-600">
                        Check your inbox for a verification link.
                    </p>
                </div>
            </div>
        );
    }

    // Check role if required
    if (requiredRole && userProfile?.role !== requiredRole) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="card max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-700 mb-4">
                        You don't have permission to access this page.
                    </p>
                    <p className="text-sm text-gray-600">
                        Required role: <strong>{requiredRole}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                        Your role: <strong>{userProfile?.role || 'Unknown'}</strong>
                    </p>
                    <button 
                        onClick={() => window.history.back()}
                        className="btn btn-primary mt-4"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Render children if all checks pass
    return children;
};

export default ProtectedRoute;
