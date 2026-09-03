import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "../services/authApi";
import type { User, LoginData, RegisterData } from "../types/user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("abhistream_token");
    localStorage.removeItem("abhistream_user");
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const handleAuthCleared = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("abhistream:auth-cleared", handleAuthCleared);
    return () => window.removeEventListener("abhistream:auth-cleared", handleAuthCleared);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem("abhistream_user", JSON.stringify(userData));
    } catch {
      logout();
    }
  }, [logout]);

  const login = async (data: LoginData) => {
    const response = await authApi.login(data);
    localStorage.setItem("abhistream_token", response.token);
    localStorage.setItem("abhistream_user", JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data);
    localStorage.setItem("abhistream_token", response.token);
    localStorage.setItem("abhistream_user", JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("abhistream_token");
    const savedUser = localStorage.getItem("abhistream_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        authApi
          .getMe()
          .then((currentUser) => {
            setUser(currentUser);
            localStorage.setItem("abhistream_user", JSON.stringify(currentUser));
          })
          .catch(logout);
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
