import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createMinutelyApiClient } from "@minutely/shared";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  token: string | null;
  userEmail: string | null;
  api: ReturnType<typeof createMinutelyApiClient>;
  login: (token: string, email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem("user_email"));
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    localStorage.removeItem("user_email");
    setToken(null);
    setUserEmail(null);
    navigate("/login", { replace: true });
  };

  const login = (newToken: string, newEmail: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("auth", "true");
    localStorage.setItem("user_email", newEmail);
    setToken(newToken);
    setUserEmail(newEmail);
    navigate("/", { replace: true });
  };

  const api = useMemo(() => {
    return createMinutelyApiClient({
      baseUrl: import.meta.env.VITE_BACKEND || "",
      getToken: () => localStorage.getItem("token"),
      onUnauthorized: logout,
    });
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, userEmail, api, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
