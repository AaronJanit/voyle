"use client";

import { useSidebar } from "./SidebarContext";

/** Adds left padding equal to the sidebar width so page content sits
 *  next to the rail instead of behind it. The sidebar is 240px when
 *  expanded and 72px when collapsed. */
export default function ShellOffset({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();
  return (
    <div className={collapsed ? "pl-[72px]" : "pl-60"}>{children}</div>
  );
}