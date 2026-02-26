"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastMessage = Parameters<typeof sonnerToast>[0];
type ToastKind = "default" | "success" | "error" | "warning" | "info";

type ActionLike = {
  label: ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

function resolveNode(value: ExternalToast["description"] | ToastMessage): ReactNode {
  if (typeof value === "function") return value();
  return value;
}

function isActionObject(value: ExternalToast["action"]): value is ActionLike {
  return Boolean(value && typeof value === "object" && "label" in value && "onClick" in value);
}

function renderToast(kind: ToastKind, message: ToastMessage, data?: ExternalToast) {
  return sonnerToast.custom(
    (id) => {
      const action = isActionObject(data?.action) ? data.action : null;
      const title = resolveNode(message);
      const description = data?.description ? resolveNode(data.description) : null;

      return (
        <div className="solvix-popup-content">
          <button
            type="button"
            aria-label="Close"
            className="solvix-popup-close"
            onClick={() => sonnerToast.dismiss(id)}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-8">
            <p className="solvix-popup-title">{title}</p>
            {description ? <p className="solvix-popup-description mt-1">{description}</p> : null}
          </div>

          <div className="solvix-popup-footer">
            <Button
              type="button"
              variant={kind === "error" ? "destructive" : "default"}
              className={cn(
                "solvix-popup-btn",
                kind === "error" ? "solvix-popup-btn-danger" : "solvix-popup-btn-primary",
              )}
              onClick={(event) => {
                action?.onClick(event);
                sonnerToast.dismiss(id);
              }}
            >
              {action?.label ?? "Tutup"}
            </Button>
          </div>
        </div>
      );
    },
    {
      id: data?.id,
      duration: data?.duration,
      dismissible: data?.dismissible,
    },
  );
}

function base(message: ToastMessage, data?: ExternalToast) {
  return renderToast("default", message, data);
}

function success(message: ToastMessage, data?: ExternalToast) {
  return renderToast("success", message, data);
}

function error(message: ToastMessage, data?: ExternalToast) {
  return renderToast("error", message, data);
}

function warning(message: ToastMessage, data?: ExternalToast) {
  return renderToast("warning", message, data);
}

function info(message: ToastMessage, data?: ExternalToast) {
  return renderToast("info", message, data);
}

export const toast = Object.assign(base, {
  success,
  error,
  warning,
  info,
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
  message: sonnerToast.message,
  dismiss: sonnerToast.dismiss,
  getHistory: sonnerToast.getHistory,
  getToasts: sonnerToast.getToasts,
});

