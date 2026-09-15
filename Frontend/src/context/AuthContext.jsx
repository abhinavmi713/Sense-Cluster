import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "../api";


const TOKEN_KEY = "sensecluster_token";

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY)
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(
    Boolean(sessionStorage.getItem(TOKEN_KEY))
  );


  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(token);

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [token]);


  async function login(email, password) {
    const result = await loginRequest(
      email,
      password
    );

    sessionStorage.setItem(
      TOKEN_KEY,
      result.access_token
    );

    setLoading(true);
    setToken(result.access_token);

    return result;
  }


  async function register(email, password) {
    const result = await registerRequest(
      email,
      password
    );

    sessionStorage.setItem(
      TOKEN_KEY,
      result.access_token
    );

    setLoading(true);
    setToken(result.access_token);

    return result;
  }


  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);

    setToken(null);
    setUser(null);
  }


  async function refreshUser() {
    if (!token) {
      return null;
    }

    const currentUser = await getCurrentUser(token);

    setUser(currentUser);

    return currentUser;
  }


  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),

      isMember: user?.role === "member",

      isContributor:
        user?.role === "contributor",

      isAdmin: user?.role === "admin",

      login,
      register,
      logout,
      refreshUser,
    }),
    [token, user, loading]
  );


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}