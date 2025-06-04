import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ChatPage from './pages/chat';
import FriendsPage from './pages/Friends';
import SocialPage from './pages/Social';
import NotFound from './pages/NotFound';
import VerifyNoticePage from './pages/VerifyNoticePage';
import TermsPage from './pages/TermsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useState, useEffect } from 'react';
import Cloud from './pages/Cloud';
import ForgotPassword from './pages/ForgotPassword';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="relative w-24 h-24 mb-5">
          <div className="absolute inset-0 rounded-full animate-spin border-4 border-blue-500 border-opacity-25"></div>
          <div className="absolute inset-0 rounded-full animate-spin border-4 border-transparent border-t-blue-500"></div>
        </div>
        <div className="flex space-x-2 mt-4">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-notice" replace state={{ email: currentUser.email, message: "Please verify your email to access this page." }} />;
  }

  return children;
};

// Public Route component for login and register
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser && currentUser.emailVerified) {
    return <Navigate to="/chat" replace />;
  }
  
  return children;
};

// New Route wrapper for pages that require auth but not necessarily verified email (like /verify-notice)
const AuthRequiredRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Similar loading pattern as ProtectedRoute for consistency, can be adjusted
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Shorter delay as it's a simpler check
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        {/* Simplified spinner or message */}
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated and already verified, redirect them from verify-notice page
  // This handles the case where a verified user manually navigates to /verify-notice
  if (currentUser.emailVerified) {
     // Check current path to avoid redirect loop if already at home/chat
    if (window.location.pathname === '/verify-notice') {
        return <Navigate to="/" replace />;
    }
  }
  
  return children; // Allow access if currentUser exists (verified or not, VerifyNoticePage handles its own logic)
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            <Route
              path="/verify-notice"
              element={
                <AuthRequiredRoute>
                  <VerifyNoticePage />
                </AuthRequiredRoute>
              }
            />
            <Route
              path="/terms"
              element={<TermsPage />}
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/social"
              element={
                <ProtectedRoute>
                  <SocialPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cloud"
              element={
                <ProtectedRoute>
                  <Cloud />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Navigate to="/chat" replace />
                </ProtectedRoute>
              } 
            />
            {/* Catch-all route for 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;