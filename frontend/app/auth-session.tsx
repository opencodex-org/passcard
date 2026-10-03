"use client";

import { createContext, useContext, useState } from "react";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ageGroup: string;
  role: string;
  emailVerified: boolean;
};

type AuthSessionValue = {
  accessToken: string | null;
  user: SessionUser | null;
  pendingEmail: string | null;
  registrationEmail: string | null;
  setSession: (token: string, user: SessionUser) => void;
  clearSession: () => void;
  setPendingEmail: (email: string | null) => void;
  setRegistrationEmail: (email: string | null) => void;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(null);

  function setSession(token: string, sessionUser: SessionUser) {
    setAccessToken(token);
    setUser(sessionUser);
  }

  function clearSession() {
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthSessionContext.Provider
      value={{
        accessToken,
        user,
        pendingEmail,
        registrationEmail,
        setSession,
        clearSession,
        setPendingEmail,
        setRegistrationEmail,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error("useAuthSession must be used within AuthSessionProvider");
  return session;
}
