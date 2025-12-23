import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, clearToken, getToken, setToken as persistToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getToken());
  const [initializing, setInitializing] = useState(true);

  const fetchMe = useCallback(async (activeToken) => {
    const me = await api("/api/me", { token: activeToken });
    setUser(me);
    setToken(activeToken);
    return me;
  }, []);

  const loginWithToken = useCallback(
    async (nextToken) => {
      persistToken(nextToken);
      try {
        return await fetchMe(nextToken);
      } catch (err) {
        clearToken();
        setUser(null);
        setToken(null);
        throw err;
      }
    },
    [fetchMe]
  );

  const bootstrapMe = useCallback(async () => {
    const existing = getToken();

    if (!existing) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      return await fetchMe(existing);
    } catch (err) {
      clearToken();
      setUser(null);
      setToken(null);
      throw err;
    }
  }, [fetchMe]);

  const logout = useCallback(async () => {
    const activeToken = getToken();

    if (activeToken) {
      try {
        await api("/api/logout", { method: "POST", token: activeToken });
      } catch {
        // ignore logout errors, client state will still clear
      }
    }

    clearToken();
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await bootstrapMe();
      } catch {
        // bootstrapMe already cleans up on failure
      } finally {
        setInitializing(false);
      }
    })();
  }, [bootstrapMe]);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      loginWithToken,
      logout,
      bootstrapMe,
    }),
    [user, token, initializing, loginWithToken, logout, bootstrapMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}
