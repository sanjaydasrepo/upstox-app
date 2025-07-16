import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axiosInstance, { setAuthContextHandler } from '../utils/axiosConfig';

interface AuthContextType {
  currentUser: User | null;
  userData: any;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  handleTokenError: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const syncUserWithBackend = async (user: User) => {
    try {
      const idToken = await user.getIdToken();
      
      // Try to login first (for existing users)
      try {
        const response = await axiosInstance.post('/auth/login', { idToken });
        setUserData(response.data.user);
        localStorage.setItem('firebaseToken', idToken);
      } catch (loginError: any) {
        // Check if this is a Firebase token error
        if (isFirebaseTokenError(loginError)) {
          console.warn('🚨 Firebase token error during login, forcing logout');
          await handleTokenError();
          return;
        }
        
        // If login fails, try signup (for new users)
        try {
          const response = await axiosInstance.post('/auth/signup', { idToken });
          setUserData(response.data.user);
          localStorage.setItem('firebaseToken', idToken);
        } catch (signupError: any) {
          if (isFirebaseTokenError(signupError)) {
            console.warn('🚨 Firebase token error during signup, forcing logout');
            await handleTokenError();
            return;
          }
          console.error('Failed to sync user with backend:', signupError);
        }
      }
    } catch (error: any) {
      if (isFirebaseTokenError(error)) {
        console.warn('🚨 Firebase token error getting ID token, forcing logout');
        await handleTokenError();
        return;
      }
      console.error('Error getting ID token:', error);
    }
  };

  const isFirebaseTokenError = (error: any): boolean => {
    const errorMessage = error?.message || '';
    const responseData = error?.response?.data || {};
    const responseText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
    
    return (
      errorMessage.includes('Firebase ID token has expired') ||
      errorMessage.includes('Invalid or expired Firebase token') ||
      errorMessage.includes('auth/id-token-expired') ||
      errorMessage.includes('auth/argument-error') ||
      responseText.includes('Firebase ID token has expired') ||
      responseText.includes('Invalid or expired Firebase token') ||
      (error?.response?.status === 401 && responseText.includes('Firebase'))
    );
  };

  const handleTokenError = async () => {
    console.log('🚪 Handling Firebase token error - logging out user');
    try {
      // Clear all storage
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('token');
      localStorage.removeItem('default-selected-account');
      
      // Reset state
      setUserData(null);
      setCurrentUser(null);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Redirect to login
      window.location.href = '/login';
    } catch (logoutError) {
      console.error('❌ Error during token error logout:', logoutError);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
  };

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    await syncUserWithBackend(userCredential.user);
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await syncUserWithBackend(userCredential.user);
  };

  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await syncUserWithBackend(userCredential.user);
  };

  const logout = async () => {
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('token'); // Remove legacy token if exists
    setUserData(null);
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        const response = await axiosInstance.get('/auth/me', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        setUserData(response.data.data);
      } catch (error: any) {
        if (isFirebaseTokenError(error)) {
          console.warn('🚨 Firebase token error during refresh, forcing logout');
          await handleTokenError();
          return;
        }
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  useEffect(() => {
    // Register the token error handler with axios
    setAuthContextHandler(handleTokenError);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await syncUserWithBackend(user);
      } else {
        setUserData(null);
        localStorage.removeItem('firebaseToken');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    sendVerificationEmail,
    refreshUserData,
    handleTokenError,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-gray-200 border-t-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading application...</p>
            <p className="mt-2 text-sm text-gray-500">Checking authentication...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}