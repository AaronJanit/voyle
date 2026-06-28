"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** YouTube's sidebar is fully open (240px) by default, or collapsed to
 *  an 72px icon rail. The NavBar hamburger button toggles this and the
 *  layout reacts accordingly. */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    // Safe fallback so non-(app) routes (login, locked, embed, p/[id])
    // can still import the hook if they ever want to.
    return {
      collapsed: false,
      setCollapsed: () => {},
      toggle: () => {},
    } satisfies SidebarContextValue;
  }
  return ctx;
}