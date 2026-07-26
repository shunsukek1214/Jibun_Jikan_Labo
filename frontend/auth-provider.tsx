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

  const [verifiedPathname, setVerifiedPathname] = useState<string | null>(null);

  const isPublicPath = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (isPublicPath) {
      return;
    }

    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!active) {
          return;
        }

        setUser(currentUser);
        setVerifiedPathname(pathname);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        const code =
          error instanceof ApiError && error.status === 401
            ? "session_expired"
            : "backend_unavailable";

        router.replace(`/?auth_error=${code}`);
      });

    return () => {
      active = false;
    };
  }, [isPublicPath, pathname, router]);

  const loading = !isPublicPath && verifiedPathname !== pathname;

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
