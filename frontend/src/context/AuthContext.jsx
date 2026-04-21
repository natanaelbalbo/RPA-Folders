import { createContext, useContext, useState, useCallback } from "react";
import { login as apiLogin } from "@/api/apiService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("rpa_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = useCallback(async (usuario, senha) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiLogin(usuario, senha);
      const userData = { ...data.user, token: data.token };
      setUser(userData);
      sessionStorage.setItem("rpa_user", JSON.stringify(userData));
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || "Credenciais inválidas. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("rpa_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
