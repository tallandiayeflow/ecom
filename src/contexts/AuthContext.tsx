import {
  login as apiLogin,
  register as apiRegister,
  resetPassword as apiResetPassword,
  getCurrentUser
} from '@/lib/api';
import { User } from '@/types/index';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session existante au chargement
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        
        // Vérifier si le token est toujours valide
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          // Token invalide, nettoyer le storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { user, token } = await apiLogin(email, password);
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      toast.success(`Bienvenue ${user.name} ! 🎉`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Email ou mot de passe incorrect';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      
      // Appeler l'API d'inscription
      const { user, token } = await apiRegister(email, password, name);
      
      // Sauvegarder l'utilisateur et le token
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      toast.success(`Compte créé avec succès ! Bienvenue ${name} 🎉`);
    } catch (error: any) {
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        
        // Messages personnalisés selon l'erreur
        if (errorMessage.includes('already registered')) {
          errorMessage = 'Cet email est déjà utilisé';
        }
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Déconnexion réussie ! À bientôt 👋');
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await apiResetPassword(email);
      toast.success(response.message || 'Email de réinitialisation envoyé ! 📧');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'envoi de l\'email';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated, 
        login, 
        register, 
        logout, 
        resetPassword,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
