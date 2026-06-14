"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { X, Check, CreditCard, Loader } from "lucide-react";

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  trial_days: number;
  profile_names: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiBaseUrl: string;
}

const money = (n: any) => `$${Number(n || 0).toLocaleString("es-AR")}`;

export default function PlanCheckout({ open, onClose, onSuccess, apiBaseUrl }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    apiFetch(`${apiBaseUrl}/orders/plans/`)
      .then((r) => r.json())
      .then((d) => setPlans((d.results || d || []).filter((p: any) => p.is_active !== false)))
      .catch(() => {});
  }, [open, apiBaseUrl]);

  if (!open) return null;

  const pay = async () => {
    if (!selected) return;
    setProcessing(true);
    // Pago SIMULADO: los datos de tarjeta no se envían ni se validan.
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const res = await apiFetch(`${apiBaseUrl}/orders/subscription/checkout/`, {
        method: "POST",
        body: JSON.stringify({ plan_id: selected.id }),
      });
      if (res.ok) {
        alert(`¡Listo! Te suscribiste al plan "${selected.name}".`);
        onSuccess();
        onClose();
      } else {
        const e = await res.json();
        alert(`No se pudo completar: ${e.error || "error"}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1a1a2e]">{selected ? "Confirmar pago" : "Elegí tu plan"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#E8612D]"><X size={20} /></button>
        </div>

        {!selected ? (
          <div className="p-5 grid gap-4 sm:grid-cols-2">
            {plans.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-xl p-4 flex flex-col">
                <p className="font-bold text-[#1a1a2e]">{p.name}</p>
                <p className="text-2xl font-bold text-[#E8612D] my-1">{money(p.price)}<span className="text-sm text-gray-400 font-normal">/{p.duration_days}d</span></p>
                {p.trial_days > 0 && <p className="text-xs text-green-600 font-medium">{p.trial_days} días de prueba gratis</p>}
                {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                <ul className="text-xs text-gray-600 mt-2 space-y-1 flex-1">
                  {(p.profile_names || []).map((n) => (
                    <li key={n} className="flex items-center gap-1"><Check size={12} className="text-green-500" /> {n}</li>
                  ))}
                </ul>
                <button onClick={() => setSelected(p)} className="mt-3 bg-[#E8612D] text-white rounded-lg py-2 text-sm font-medium">Suscribirme</button>
              </div>
            ))}
            {!plans.length && <p className="text-gray-400 text-sm col-span-2 text-center py-6">No hay planes disponibles.</p>}
          </div>
        ) : (
          <div className="p-5">
            <div className="bg-orange-50 rounded-lg p-3 mb-4 flex justify-between text-sm">
              <span>{selected.name}{selected.trial_days > 0 ? ` · ${selected.trial_days}d prueba` : ""}</span>
              <span className="font-bold text-[#E8612D]">{selected.trial_days > 0 ? "Gratis ahora" : money(selected.price)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><CreditCard size={13} /> Pago simulado — no se realiza ningún cobro real.</p>
            <div className="grid gap-2">
              <input placeholder="Nombre en la tarjeta" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Número de tarjeta" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelected(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">Volver</button>
              <button onClick={pay} disabled={processing} className="flex-1 bg-[#E8612D] text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                {processing ? <><Loader size={15} className="animate-spin" /> Procesando…</> : `Pagar ${selected.trial_days > 0 ? "(prueba gratis)" : money(selected.price)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
