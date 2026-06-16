import React from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** "danger" pinta el botón de confirmación en rojo (acciones destructivas). */
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmación reutilizable que reemplaza window.confirm().
 * Mismo lenguaje visual que los demás modales del sistema (asignaciones,
 * cancelación de compra). El estado de carga deshabilita los botones.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const isDanger = tone === "danger";

  return (
    <div
      className="fixed inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={() => { if (!loading) onCancel(); }}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-5 rounded-full mb-5 ${isDanger ? "bg-red-50 text-red-500" : "bg-[#fff7ed] text-[#E8612D]"}`}>
          {isDanger ? <AlertTriangle size={40} /> : <ShieldCheck size={40} />}
        </div>

        <h3 className="text-2xl font-bold text-[#1a1a2e] mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-8 px-2 leading-relaxed">{message}</p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md text-white disabled:opacity-50 ${
              isDanger ? "bg-red-500 hover:bg-red-600" : "bg-[#E8612D] hover:bg-[#d4551f]"
            }`}
          >
            {loading ? "Procesando…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface InfoModalProps {
  open: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

/**
 * Modal informativo (éxito/error) para contextos sin el override global de
 * window.alert (ej. páginas de ruta como /planes, /mis-suscripciones).
 */
export function InfoModal({ open, title, message, type = "info", onClose }: InfoModalProps) {
  if (!open) return null;

  const palette =
    type === "success" ? "bg-green-50 text-green-600" :
    type === "error" ? "bg-red-50 text-red-600" :
    "bg-blue-50 text-blue-600";

  return (
    <div
      className="fixed inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-5 rounded-full mb-5 ${palette}`}>
          <X size={40} className={type === "error" ? "" : "hidden"} />
          {type !== "error" && <ShieldCheck size={40} />}
        </div>
        <h3 className="text-2xl font-bold text-[#1a1a2e] mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-8 px-2 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-3.5 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white rounded-xl text-sm font-bold transition-all shadow-md"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
