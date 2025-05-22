"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "./MainLayout";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't apply the main layout to the login or forgot password pages
  if (pathname === "/login" || pathname === "/forgot-password") {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
} 