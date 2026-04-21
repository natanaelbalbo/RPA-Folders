import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formata data ISO para formato brasileiro dd/mm/aaaa HH:mm
 */
export function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata CNPJ para exibição
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return "—";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Converte o caminho local do arquivo para URL acessível via servidor estático.
 * Ex: C:\...\backend\uploads\nf\arquivo.pdf → http://localhost:8000/uploads/nf/arquivo.pdf
 */
export function getFileUrl(caminho) {
  if (!caminho) return null;
  const normalized = caminho.replace(/\\/g, "/");
  const idx = normalized.toLowerCase().indexOf("/uploads/");
  if (idx === -1) return null;
  return `http://localhost:8000${normalized.slice(idx)}`;
}
