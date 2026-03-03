import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { login as doLogin, logout as doLogout, getSession, UserRole } from "@/lib/auth-store";

interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INACTIVITY_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours
const LAST_ACTIVITY_KEY = "printstock_last_activity";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const session = getSession();
    return session ? { id: session.id, username: session.username, name: session.name, role: session.role } : null;
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performLogout = useCallback(() => {
    doLogout();
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
  }, []);

  // Track user activity and reset inactivity timer
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(performLogout, INACTIVITY_TIMEOUT);
    };

    // Check if already expired on mount
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity && Date.now() - parseInt(lastActivity) >= INACTIVITY_TIMEOUT) {
      performLogout();
      return;
    }

    resetTimer();

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    // Throttle activity tracking to avoid excessive writes
    let lastTracked = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastTracked > 60000) { // Update at most once per minute
        lastTracked = now;
        resetTimer();
      }
    };

    events.forEach(e => window.addEventListener(e, throttledReset));
    return () => {
      events.forEach(e => window.removeEventListener(e, throttledReset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, performLogout]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await doLogin(username, password);
    if (result) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      setUser({ id: result.id, username: result.username, name: result.name, role: result.role });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
