"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { ConfirmProvider } from "@/components/providers/confirm-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          <ConfirmProvider>
            {children}
            <Toaster
              closeButton={false}
              position="top-center"
              visibleToasts={1}
              className="solvix-toast-layer"
              toastOptions={{
                duration: 5200,
                unstyled: true,
              }}
            />
          </ConfirmProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
