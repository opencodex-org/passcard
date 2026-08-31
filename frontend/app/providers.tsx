"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "1010378538216-jqt8nn2e3brtlplhr4jcore830ef2aqp.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
