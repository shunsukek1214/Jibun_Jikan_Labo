"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ApiError, CurrentUser, getCurrentUser, logout } from "./api";


type AuthContextValue = {
  user: CurrentUser | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const PUBLIC_PATHS = new Set(["/"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(!PUBLIC_PATHS.has(pathname));

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        if (!active) return;

        const code =
          error instanceof ApiError && error.status === 401
            ? "session_expired"
            : "backend_unavailable";

        router.replace(`/?auth_error=${code}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  const signOut = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      window.location.assign("/");
    }
  };

  if (loading) {
    return (
      <main className="login">
        <p>ログイン状態を確認しています。</p>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthはAuthProvider内で使用してください。");
  }
  return value;
}

export function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button
      type="button"
      className="hicon"
      onClick={() => void signOut()}
      aria-label="ログアウト"
      title="ログアウト"
    >
      退出
    </button>
  );
}
