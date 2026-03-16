/**
 * AppContext — backward-compatible aggregate of the three domain contexts.
 *
 * Architecture: app state is now split across three focused contexts:
 *   - AuthContext    (src/context/AuthContext.tsx)   — identity and session
 *   - AuctionContext (src/context/AuctionContext.tsx) — marketplace data and mutations
 *   - NotificationContext (src/context/NotificationContext.tsx) — in-app notifications
 *
 * useAppContext() merges all three into a single object so that existing
 * screens do not need to be updated immediately. New screens should import
 * from the specific context they need (useAuthContext, useAuctionContext,
 * useNotificationContext) to limit their re-render surface.
 */

import React from "react";
import { AuthContextValue, AuthProvider, useAuthContext } from "./AuthContext";
import { AuctionContextValue, AuctionProvider, useAuctionContext } from "./AuctionContext";
import { NotificationContextValue, NotificationProvider, useNotificationContext } from "./NotificationContext";

export type AppContextValue = AuthContextValue & AuctionContextValue & NotificationContextValue;

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuctionProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </AuctionProvider>
    </AuthProvider>
  );
}

/** Convenience hook that merges all domain contexts into one object. */
export function useAppContext(): AppContextValue {
  const auth = useAuthContext();
  const auction = useAuctionContext();
  const notification = useNotificationContext();

  return { ...auth, ...auction, ...notification };
}
