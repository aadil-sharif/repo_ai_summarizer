// src/lib/auth-provider.ts

"use client"; // This component must be client-side

import { SessionProvider } from "next-auth/react";
import React, { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
