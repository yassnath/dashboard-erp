import { format } from "date-fns";
import { id } from "date-fns/locale";

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string) {
  const numeric = typeof value === "number" ? value : Number(value);
  return idrFormatter.format(Number.isNaN(numeric) ? 0 : numeric);
}

export function formatNumber(value: number | string) {
  const numeric = typeof value === "number" ? value : Number(value);
  return decimalFormatter.format(Number.isNaN(numeric) ? 0 : numeric);
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "dd MMM yyyy", { locale: id });
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "dd MMM yyyy HH:mm", { locale: id });
}
