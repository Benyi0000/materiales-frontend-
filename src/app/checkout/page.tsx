"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Building2, MapPin, Truck, ShieldCheck, ChevronLeft, Check,
  Loader, Pencil, Lock, ExternalLink,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const money = (n: any) => `$${Number(n || 0).toLocaleString("es-AR")}`;

interface CartItem { id: number; name: string; image_url: string; price: number; quantity: number; item_total?: number; }
interface Cart { items: CartItem[]; subtotal: number; discount_amount: number; total: number; coupon_code: string | null; }

type SectionKey = "shipping" | "delivery";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<SectionKey>("shipping");
  const [done, setDone] = useState<Set<SectionKey>>(new Set());
  const [redirecting, setRedirecting] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);

  const [ship, setShip] = useState({ name: "", address: "", city: "", zip: "", phone: "" });
  const [delivery, setDelivery] = useState("standard");

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.push("/auth/login");
      return;
    }
    apiFetch(`${API_BASE_URL}/orders/cart/`)
      .then((r) => r.json())
      .then((d) => setCart(d))
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [router]);

  const shippingCost = delivery === "express" ? 4000 : 0;
  const total = (cart?.total ?? 0) + shippingCost;

  const complete = (k: SectionKey, next?: SectionKey) => {
    setDone((s) => new Set(s).add(k));
    if (next) setActive(next);
  };

  const shippingValid = ship.name && ship.address && ship.city;
  const allDone = done.has("shipping") && done.has("delivery");

  const goToMercadoPago = async () => {
    setRedirecting(true);
    setMpError(null);
    try {
      const res = await apiFetch(`${API_BASE_URL}/orders/mp/create-preference/`, {
        method: "POST",
        body: JSON.stringify({
          shipping: { name: ship.name, address: ship.address, city: ship.city, zip: ship.zip, phone: ship.phone },
          delivery_type: delivery,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMpError(data.error || "No se pudo iniciar el pago. Intentá de nuevo.");
        setRedirecting(false);
        return;
      }
      // En sandbox usamos sandbox_init_point; en producción usar init_point
      const url = data.sandbox_init_point || data.init_point;
      if (!url) {
        setMpError("No se recibió el link de pago de MercadoPago.");
        setRedirecting(false);
        return;
      }
      window.location.href = url;
    } catch {
      setMpError("Error de conexión. Verificá tu internet e intentá de nuevo.");
      setRedirecting(false);
    }
  };

  /* ----------------- Estados especiales ----------------- */
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#ededed]"><Loader className="animate-spin text-[#E8612D]" /></div>;
  }
  if (!cart || !cart.items?.length) {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
          <p className="text-[#333] font-medium">Tu carrito está vacío</p>
          <button onClick={() => router.push("/")} className="mt-4 bg-[#E8612D] text-white rounded-lg py-2.5 px-6 text-sm font-medium transition active:scale-[0.98] hover:brightness-105">Ir a comprar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed] ck-fade-in">
      {/* Overlay de redirección a MercadoPago */}
      {redirecting && (
        <div className="fixed inset-0 z-[70] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center ck-fade-in">
          <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-[#E8612D] animate-spin" />
          <p className="mt-5 font-semibold text-[#333]">Redirigiendo a MercadoPago…</p>
          <p className="text-sm text-gray-400 mt-2">No cierres esta ventana</p>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2" title="Ir al inicio">
            <div className="bg-[#E8612D] p-1.5 rounded-lg text-white"><Building2 size={18} /></div>
            <span className="font-bold text-[#1a1a2e]">Craft<span className="text-[#E8612D]">IAr</span></span>
          </button>
          <div className="flex items-center gap-1 text-xs text-gray-500"><Lock size={13} /> Pago seguro con MercadoPago</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => router.push("/")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#E8612D] mb-4"><ChevronLeft size={16} /> Volver</button>
        <h1 className="text-2xl font-semibold text-[#333] mb-5">Finalizá tu compra</h1>

        <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* Columna izquierda: pasos */}
          <div className="space-y-3">
            <SectionCard n={1} index={0} title="Datos de envío" icon={<MapPin size={18} />} active={active === "shipping"} done={done.has("shipping")}
              summary={done.has("shipping") ? `${ship.name} · ${ship.address}, ${ship.city}` : ""} onEdit={() => setActive("shipping")}>
              <div className="space-y-2">
                <input placeholder="Nombre y apellido *" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[#E8612D] focus:ring-2 focus:ring-orange-100 w-full" />
                <input placeholder="Dirección y número *" value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[#E8612D] focus:ring-2 focus:ring-orange-100 w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Ciudad *" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[#E8612D] focus:ring-2 focus:ring-orange-100" />
                  <input placeholder="Código postal" value={ship.zip} onChange={(e) => setShip({ ...ship, zip: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[#E8612D] focus:ring-2 focus:ring-orange-100" />
                </div>
                <input placeholder="Teléfono de contacto" value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} className="border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:border-[#E8612D] focus:ring-2 focus:ring-orange-100 w-full" />
                <button disabled={!shippingValid} onClick={() => complete("shipping", "delivery")} className="bg-[#E8612D] text-white rounded-lg py-2.5 px-6 text-sm font-medium transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50 mt-1">Continuar</button>
              </div>
            </SectionCard>

            <SectionCard n={2} index={1} title="Forma de entrega" icon={<Truck size={18} />} active={active === "delivery"} done={done.has("delivery")}
              summary={done.has("delivery") ? (delivery === "express" ? "Express (24-48 hs)" : "Estándar (3-5 días) · Gratis") : ""} onEdit={() => setActive("delivery")}>
              <div className="space-y-2">
                {[["standard", "Envío estándar", "3 a 5 días hábiles", "Gratis"], ["express", "Envío express", "24 a 48 hs", money(4000)]].map(([v, t, d, p]) => (
                  <label key={v} className={`flex items-center justify-between border rounded-lg px-3 py-3 text-sm cursor-pointer transition-all duration-200 ${delivery === v ? "border-[#E8612D] bg-orange-50" : "border-gray-200"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="delivery" checked={delivery === v} onChange={() => setDelivery(v as string)} />
                      <div><p className="font-medium text-[#333]">{t}</p><p className="text-xs text-gray-500">{d}</p></div>
                    </div>
                    <span className={`font-semibold ${p === "Gratis" ? "text-green-600" : "text-[#333]"}`}>{p}</span>
                  </label>
                ))}
                <button onClick={() => complete("delivery")} className="bg-[#E8612D] text-white rounded-lg py-2.5 px-6 text-sm font-medium transition active:scale-[0.98] hover:brightness-105 mt-1">Confirmar entrega</button>
              </div>
            </SectionCard>

            {/* Aviso de pago con MP */}
            {allDone && (
              <div className="bg-white rounded-xl border border-[#009EE3]/30 p-4 flex items-center gap-3 ck-fade-up">
                <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadopago/logo__large@2x.png" alt="MercadoPago" className="h-6 object-contain" />
                <p className="text-sm text-gray-600">
                  Al confirmar serás redirigido a MercadoPago para completar el pago de forma segura.
                </p>
              </div>
            )}

            {mpError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {mpError}
              </div>
            )}
          </div>

          {/* Columna derecha: resumen sticky */}
          <aside className="ck-fade-up ck-stagger bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:sticky lg:top-6" style={{ "--d": "180ms" } as React.CSSProperties}>
            <h2 className="font-semibold text-[#333] mb-3">Resumen de compra</h2>
            <div className="space-y-3 max-h-56 overflow-y-auto mb-3">
              {cart.items.map((it) => (
                <div key={it.id} className="flex gap-3 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image_url || "/placeholder.png"} alt={it.name} className="w-12 h-12 rounded object-cover border border-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#333] truncate">{it.name}</p>
                    <p className="text-xs text-gray-500">Cant: {it.quantity}</p>
                  </div>
                  <span className="text-sm text-[#333]">{money(it.item_total ?? it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Productos</span><span>{money(cart.subtotal)}</span></div>
              {cart.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Descuento {cart.coupon_code ? `(${cart.coupon_code})` : ""}</span><span>-{money(cart.discount_amount)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Envío</span><span>{shippingCost ? money(shippingCost) : <span className="text-green-600">Gratis</span>}</span></div>
              <div className="flex justify-between font-bold text-lg text-[#333] pt-2"><span>Total</span><span>{money(total)}</span></div>
            </div>

            <button
              disabled={!allDone || redirecting}
              onClick={goToMercadoPago}
              className="w-full mt-4 bg-[#009EE3] hover:bg-[#007fc0] text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {redirecting
                ? <><Loader size={16} className="animate-spin" /> Redirigiendo…</>
                : <><ExternalLink size={16} /> Pagar con MercadoPago</>
              }
            </button>
            <div className="flex items-center justify-center gap-1 mt-2">
              <ShieldCheck size={13} className="text-gray-400" />
              <p className="text-[11px] text-gray-400 text-center">Pago 100% seguro. No guardamos datos de tarjeta.</p>
            </div>
            {!allDone && <p className="text-[11px] text-gray-400 text-center mt-1">Completá los pasos para continuar.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ---- Tarjeta de sección (acordeón estilo ML) ---- */
function SectionCard({ n, title, icon, active, done, summary, onEdit, index = 0, children }: {
  n: number; title: string; icon: React.ReactNode; active: boolean; done: boolean;
  summary: string; onEdit: () => void; index?: number; children: React.ReactNode;
}) {
  return (
    <div
      className={`ck-fade-up ck-stagger bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${active ? "border-[#E8612D]/30 shadow-md" : "border-gray-100"}`}
      style={{ "--d": `${index * 90}ms` } as React.CSSProperties}
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${done ? "bg-green-500 text-white" : active ? "bg-[#E8612D] text-white" : "bg-gray-200 text-gray-500"}`}>
            {done ? <Check size={15} className="ck-pop" /> : n}
          </div>
          <div className={`flex items-center gap-2 font-medium transition-colors ${active || done ? "text-[#333]" : "text-gray-400"}`}>{icon} {title}</div>
        </div>
        {done && !active && (
          <button onClick={onEdit} className="text-xs text-[#E8612D] flex items-center gap-1 transition-all hover:gap-1.5"><Pencil size={12} /> Editar</button>
        )}
      </div>
      {active && <div className="ck-fade-up px-4 pb-4 pt-1">{children}</div>}
      {done && !active && summary && <div className="ck-fade-in px-4 pb-3 pl-14 text-sm text-gray-500 -mt-1">{summary}</div>}
    </div>
  );
}
