'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { getRedirectUrl } from '../utils/redirectUrl';

// User type definition
export type User = {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
} | null;

// Auth context type
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (newUsername: string) => void;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the auth state from Supabase on component mount
  useEffect(() => {
    // First check for active session
    const initializeAuth = async () => {
      setIsLoading(true);

      // Get the current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user) {
        // Format user data for our app
        const formattedUser = {
          id: currentSession.user.id,
          username:
            currentSession.user.user_metadata?.username ||
            currentSession.user.email?.split('@')[0] ||
            '',
          email: currentSession.user.email || '',
          avatar_url: currentSession.user.user_metadata?.avatar_url || null,
        };
        setUser(formattedUser);
      }

      setIsLoading(false);

      // Set up the auth state listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          // For new Google sign-ins, update the profile with avatar URL
          if (event === 'SIGNED_IN' && newSession.user.app_metadata.provider === 'google') {
            // Update the profile with Google avatar if available
            if (newSession.user.user_metadata?.avatar_url) {
              await supabase.from('profiles').upsert(
                {
                  id: newSession.user.id,
                  avatar_url: newSession.user.user_metadata.avatar_url,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              );
            }
          }

          const formattedUser = {
            id: newSession.user.id,
            username:
              newSession.user.user_metadata?.username || newSession.user.email?.split('@')[0] || '',
            email: newSession.user.email || '',
            avatar_url: newSession.user.user_metadata?.avatar_url || null,
          };
          setUser(formattedUser);
        } else {
          setUser(null);
        }
      });

      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = getRedirectUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile',
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
  };

  const updateUsername = (newUsername: string) => {
    if (user) {
      setUser({
        ...user,
        username: newUsername,
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signInWithGoogle,
    logout,
    updateUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
