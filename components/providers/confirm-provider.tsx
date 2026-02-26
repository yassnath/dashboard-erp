"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConfirmIntent = "default" | "danger";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  intent?: ConfirmIntent;
};

type ConfirmRequest = Required<ConfirmOptions> & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const defaultOptions: Required<ConfirmOptions> = {
  title: "Konfirmasi Aksi",
  description: "Yakin ingin melanjutkan aksi ini?",
  confirmText: "Lanjutkan",
  cancelText: "Batal",
  intent: "default",
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const closeDialog = useCallback((result: boolean) => {
    setRequest((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const confirm = useCallback((options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({
        ...defaultOptions,
        ...options,
        resolve,
      });
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={Boolean(request)}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog(false);
          }
        }}
      >
        <DialogContent className="solvix-popup-content max-w-md">
          <DialogHeader>
            <DialogTitle className="solvix-popup-title">{request?.title ?? defaultOptions.title}</DialogTitle>
            <DialogDescription className="solvix-popup-description">{request?.description ?? defaultOptions.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="solvix-popup-footer">
            <Button type="button" variant="outline" className="solvix-popup-btn solvix-popup-btn-neutral" onClick={() => closeDialog(false)}>
              {request?.cancelText ?? defaultOptions.cancelText}
            </Button>
            <Button
              type="button"
              variant={request?.intent === "danger" ? "destructive" : "default"}
              className={cn(
                "solvix-popup-btn",
                request?.intent === "danger" ? "solvix-popup-btn-danger" : "solvix-popup-btn-primary",
              )}
              onClick={() => closeDialog(true)}
            >
              {request?.confirmText ?? defaultOptions.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }
  return context.confirm;
}
