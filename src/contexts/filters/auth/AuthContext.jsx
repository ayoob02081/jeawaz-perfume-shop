import { createContext, useContext, useEffect, useState } from "react";
import { loginApi, logoutApi } from "@/services/authServices";
import { getUserApi, updateUserApi } from "@/services/usersServices";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const user = await getUserApi();
      setUser(user);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data) => {
    await loginApi(data);
    await checkAuth();
  };

  const updateUser = async (data) => {
    await updateUserApi(data);
    await checkAuth();
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        checkAuth,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
