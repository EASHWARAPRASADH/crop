import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService, User } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (name: string, email: string, password: string, organization?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = authService.getStoredUser();
    const token = authService.getToken();
    
    if (storedUser && token) {
      setUser(storedUser);
      
      // Validate token by fetching current user
      authService.getMe()
        .then((freshUser) => {
          setUser(freshUser);
          setIsLoading(false);
        })
        .catch(() => {
          // Token expired or invalid
          authService.logout();
          setUser(null);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const signUp = async (name: string, email: string, password: string, organization?: string) => {
    try {
      const newUser = await authService.register({ name, email, password, organization });
      setUser(newUser);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.message || "Registration failed" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const loggedInUser = await authService.login({ email, password });
      setUser(loggedInUser);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.message || "Login failed" };
    }
  };

  const signOut = async () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedFields };
    localStorage.setItem('gotek_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useRequireAuth = (redirectTo: string = "/login") => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(redirectTo);
    }
  }, [user, isLoading, navigate, redirectTo]);

  return { user, isLoading };
};
