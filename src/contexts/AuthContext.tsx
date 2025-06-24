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
import axiosInstance from '../utils/axiosConfig';

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
      } catch (loginError) {
        // If login fails, try signup (for new users)
        try {
          const response = await axiosInstance.post('/auth/signup', { idToken });
          setUserData(response.data.user);
          localStorage.setItem('firebaseToken', idToken);
        } catch (signupError) {
          console.error('Failed to sync user with backend:', signupError);
        }
      }
    } catch (error) {
      console.error('Error getting ID token:', error);
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
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  useEffect(() => {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}