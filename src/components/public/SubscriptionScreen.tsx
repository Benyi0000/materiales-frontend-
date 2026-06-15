"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Building2, ChevronLeft, Check, CreditCard, Loader, CheckCircle2,
  Sparkles, Calendar, XCircle, Lock, ShieldCheck,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const money = (n: any) => `$${Number(n || 0).toLocaleString("es-AR")}`;

export default function SubscriptionScreen({ mode }: { mode: "planes" | "mi" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);

  const reload = useCallback(() => Promise.all([
    apiFetch(`${API}/users/auth/profile/`).then((r) => r.json()),
    apiFetch(`${API}/orders/plans/`).then((r) => r.json()),
    apiFetch(`${API}/orders/subscription/`).then((r) => r.json()),
    apiFetch(`${API}/orders/payments/`).then((r) => r.json()),
  ]).then(([u, pl, s, pay]) => {
    setUser(u);
    setPlans((pl.results || pl || []).filter((p: any) => p.is_active !== false));
    setSub(s && s.id ? s : null);
    setPayments(pay.results || pay || []);
  }).catch(() => {}), []);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) { router.push("/auth/login"); return; }
    reload().finally(() => setLoading(false));
  }, [router, reload]);

  const has = (p: string) => user?.is_superuser || (user?.active_permissions && typeof user.active_permissions === "object" && p in user.active_permissions);
  const canVer = has("suscripciones.ver");
  const canSub = has("suscripciones.suscribirse");
  const isSubscribed = !!(sub && sub.current_plan);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]"><Loader className="animate-spin text-[#E8612D]" /></div>;

  if (!canVer) {
    return (
      <Shell router={router} title="">
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center max-w-md mx-auto">
          <Lock size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-[#1a1a2e] font-medium">No tenés acceso a esta sección.</p>
          <button onClick={() => router.push("/")} className="mt-4 bg-[#E8612D] text-white rounded-lg px-5 py-2 text-sm font-medium">Volver al inicio</button>
        </div>
      </Shell>
    );
  }

  if (checkoutPlan) {
    return <PagoPlanScreen plan={checkoutPlan} router={router} onCancel={() => setCheckoutPlan(null)} onDone={() => router.push("/mis-suscripciones")} />;
  }

  return (
    <Shell router={router} title={mode === "planes" ? "Planes de Tutoría IA" : "Mis suscripciones"}>
      {mode === "planes" ? (
        <>
          <p className="text-center text-gray-500 mb-8 -mt-2">Potenciá tus proyectos con el Tutor Visual IA. Elegí el plan que mejor te quede.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((p, i) => {
              const current = sub?.current_plan === p.id;
              const featured = i === 1; // resaltar el del medio
              return (
                <div key={p.id} className={`relative rounded-2xl p-6 flex flex-col bg-white border transition-all ${current ? "border-[#E8612D]" : featured ? "border-[#E8612D]/40 shadow-md" : "border-gray-200 hover:shadow-md"}`}>
                  {featured && !current && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8612D] text-white text-[10px] font-bold px-3 py-1 rounded-full">MÁS ELEGIDO</span>}
                  <div className="flex items-center gap-2 text-[#E8612D]"><Sparkles size={18} /><h3 className="font-bold text-lg text-[#1a1a2e]">{p.name}</h3></div>
                  {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                  <p className="text-3xl font-black text-[#1a1a2e] mt-4">{money(p.price)}<span className="text-sm font-normal text-gray-400">/{p.duration_days}d</span></p>
                  {p.trial_days > 0 && <p className="text-xs text-green-600 font-medium mt-1">{p.trial_days} días de prueba gratis</p>}
                  <ul className="mt-4 space-y-2 flex-1">
                    {(p.profile_names || []).map((n: string) => (
                      <li key={n} className="flex items-center gap-2 text-sm text-gray-600"><Check size={15} className="text-green-500 shrink-0" /> {n}</li>
                    ))}
                  </ul>
                  {current ? (
                    <span className="mt-5 text-center text-sm font-medium text-[#E8612D] border border-[#E8612D]/40 rounded-lg py-2.5">Tu plan actual</span>
                  ) : (
                    <button disabled={!canSub} onClick={() => setCheckoutPlan(p)} title={!canSub ? "No tenés permiso para suscribirte" : ""}
                      className="mt-5 bg-[#E8612D] text-white rounded-lg py-2.5 text-sm font-semibold transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50">Suscribirme</button>
                  )}
                </div>
              );
            })}
            {!plans.length && <p className="text-gray-400 col-span-full text-center py-10">No hay planes disponibles por ahora.</p>}
          </div>
        </>
      ) : (
        <MiSuscripcion sub={sub} payments={payments} isSubscribed={isSubscribed} canSub={canSub}
          onCancel={async () => { if (!confirm("¿Cancelar tu suscripción? Seguirá activa hasta el vencimiento.")) return; await apiFetch(`${API}/orders/subscription/cancel/`, { method: "POST" }); await reload(); }}
          onVerPlanes={() => router.push("/planes")} />
      )}

    </Shell>
  );
}

/* Layout claro consistente con el sistema */
function Shell({ router, title, children }: any) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#E8612D] p-1.5 rounded-lg text-white"><Building2 size={18} /></div>
            <span className="font-bold text-[#1a1a2e]">Craft<span className="text-[#E8612D]">IAr</span></span>
          </div>
          <button onClick={() => router.push("/")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#E8612D]"><ChevronLeft size={16} /> Volver</button>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {title && <h1 className="text-2xl font-bold text-[#1a1a2e] text-center mb-6">{title}</h1>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Mi suscripción (claro) ---------- */
function MiSuscripcion({ sub, payments, isSubscribed, canSub, onCancel, onVerPlanes }: any) {
  if (!isSubscribed) {
    return (
      <div className="max-w-xl mx-auto text-center bg-white border border-gray-200 rounded-2xl p-10">
        <ShieldCheck size={40} className="mx-auto text-gray-300" />
        <p className="mt-3 text-lg font-medium text-[#1a1a2e]">Sos usuario Free</p>
        <p className="text-gray-500 text-sm mt-1">Todavía no tenés un plan activo.</p>
        <button onClick={onVerPlanes} className="mt-5 bg-[#E8612D] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">Ver planes</button>
      </div>
    );
  }
  const estado = sub.status === "trialing" ? "En prueba" : sub.status === "cancelled" ? "Cancelada (activa hasta vencer)" : sub.status === "active" ? "Activa" : sub.status;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase">Plan actual</p>
            <h3 className="text-xl font-bold text-[#E8612D]">{sub.current_plan_name}</h3>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">{estado}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm">
          <div className="flex items-center gap-2 text-gray-600"><Calendar size={15} /> Vence: {sub.end_date ? new Date(sub.end_date).toLocaleDateString("es-AR") : "—"}</div>
          <div className="flex items-center gap-2 text-gray-600"><CreditCard size={15} /> {sub.cancel_at_period_end ? "No renueva" : "Renovación automática"}</div>
        </div>
        {!sub.cancel_at_period_end && (
          <button disabled={!canSub} onClick={onCancel} className="mt-5 flex items-center gap-2 text-sm text-red-500 hover:text-red-600 disabled:opacity-50"><XCircle size={16} /> Cancelar suscripción</button>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="font-semibold text-[#1a1a2e] mb-3">Historial de pagos</p>
        {payments.length ? (
          <div className="space-y-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2">
                <span>{p.plan_name || "—"} · {new Date(p.created_at).toLocaleDateString("es-AR")}</span>
                <span className="font-medium text-[#1a1a2e]">{money(p.amount)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">Sin pagos registrados.</p>}
      </div>
    </div>
  );
}

/* ---------- Pago en PANTALLA (estilo checkout, solo paso de pago) ---------- */
function PagoPlanScreen({ plan, router, onCancel, onDone }: any) {
  const [method, setMethod] = useState("card");
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const cardValid = method !== "card" || (card.name && card.number && card.expiry && card.cvc);
  const pay = async () => {
    setStep("processing");
    await new Promise((r) => setTimeout(r, 1600));
    const res = await apiFetch(`${API}/orders/subscription/checkout/`, { method: "POST", body: JSON.stringify({ plan_id: plan.id }) });
    if (res.ok) setStep("done");
    else { alert("No se pudo completar la suscripción."); onCancel(); }
  };

  if (step === "done") {
    return (
      <Shell router={router} title="">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center ck-fade-in">
          <div className="relative w-fit mx-auto"><span className="absolute inset-0 rounded-full bg-green-400 ck-ring" /><CheckCircle2 size={56} className="text-green-500 relative ck-success" /></div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mt-3 ck-fade-up">¡Suscripción activada!</h2>
          <p className="text-gray-500 text-sm mt-1 ck-fade-up">Ya tenés acceso a <b>{plan.name}</b>.</p>
          <button onClick={onDone} className="mt-5 bg-[#E8612D] text-white rounded-lg px-6 py-2.5 text-sm font-medium ck-fade-up">Ver mi suscripción</button>
        </div>
      </Shell>
    );
  }
  if (step === "processing") {
    return (
      <Shell router={router} title="">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full border-4 border-orange-100 border-t-[#E8612D] animate-spin" />
          <p className="text-sm text-gray-600">Procesando tu pago…</p>
          <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#E8612D] ck-progress" /></div>
          <p className="text-xs text-gray-400">No cierres esta ventana</p>
        </div>
      </Shell>
    );
  }
  return (
    <Shell router={router} title="">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#E8612D] mb-4"><ChevronLeft size={16} /> Volver a planes</button>
      <h1 className="text-2xl font-semibold text-[#1a1a2e] mb-5">Finalizá tu suscripción</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Pago */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Método de pago</p>
          <div className="space-y-2">
            {[["card", "Tarjeta de crédito/débito"], ["mp", "Mercado Pago"], ["cash", "Efectivo"]].map(([v, l]) => (
              <label key={v} className={`flex items-center gap-2 border rounded-lg px-3 py-3 text-sm cursor-pointer transition ${method === v ? "border-[#E8612D] bg-orange-50" : "border-gray-200"}`}>
                <input type="radio" name="m" checked={method === v} onChange={() => setMethod(v as string)} /> {l}
              </label>
            ))}
          </div>
          {method === "card" && (
            <div className="space-y-2 mt-3">
              <input placeholder="Nombre en la tarjeta" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm w-full" />
              <input placeholder="Número de tarjeta" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm w-full" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm" />
                <input placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm" />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-3"><Lock size={12} /> Pago simulado — no se realiza ningún cobro real.</p>
        </div>
        {/* Resumen sticky */}
        <aside className="bg-white border border-gray-200 rounded-xl p-4 lg:sticky lg:top-6">
          <h2 className="font-semibold text-[#1a1a2e] mb-3">Resumen</h2>
          <div className="flex items-center gap-2 text-[#E8612D] mb-2"><Sparkles size={16} /><span className="font-medium text-[#1a1a2e]">{plan.name}</span></div>
          {plan.description && <p className="text-xs text-gray-500 mb-3">{plan.description}</p>}
          <div className="text-sm space-y-1 border-t border-gray-100 pt-3">
            <div className="flex justify-between text-gray-600"><span>Precio</span><span>{money(plan.price)} / {plan.duration_days}d</span></div>
            {plan.trial_days > 0 && <div className="flex justify-between text-green-600"><span>Prueba</span><span>{plan.trial_days} días gratis</span></div>}
            <div className="flex justify-between font-bold text-[#1a1a2e] pt-1"><span>A pagar ahora</span><span>{plan.trial_days > 0 ? "Gratis" : money(plan.price)}</span></div>
          </div>
          <button disabled={!cardValid} onClick={pay} className="w-full mt-4 bg-[#E8612D] text-white rounded-lg py-3 text-sm font-semibold transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50">
            {plan.trial_days > 0 ? "Empezar prueba gratis" : `Pagar ${money(plan.price)}`}
          </button>
        </aside>
      </div>
    </Shell>
  );
}
