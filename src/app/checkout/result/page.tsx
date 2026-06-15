"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Building2, Loader } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const money = (n: any) => `$${Number(n || 0).toLocaleString("es-AR")}`;

function CheckoutResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mpStatus = params.get("status") || params.get("collection_status");
  const orderId = params.get("order_id") || params.get("external_reference");

  const [order, setOrder] = useState<any>(null);
  const [polling, setPolling] = useState(true);

  // Pollear el estado del pedido hasta que el webhook de MP lo actualice
  useEffect(() => {
    if (!orderId) { setPolling(false); return; }

    let attempts = 0;
    const maxAttempts = 10;

    const check = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/orders/orders/${orderId}/`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          // Si ya salió de pending_payment significa que el webhook actualizó
          if (data.status !== "pending_payment" || attempts >= maxAttempts) {
            setPolling(false);
            return;
          }
        }
      } catch {}
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(check, 2000);
      } else {
        setPolling(false);
      }
    };

    check();
  }, [orderId]);

  const effectiveStatus = order?.status === "pending"
    ? "approved"
    : order?.status === "cancelled"
    ? "failure"
    : order?.status === "pending_payment"
    ? "pending"
    : mpStatus || "pending";

  const isApproved = effectiveStatus === "approved";
  const isFailure = effectiveStatus === "failure" || effectiveStatus === "rejected";
  const isPending = !isApproved && !isFailure;

  return (
    <div className="min-h-screen bg-[#ededed] flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#E8612D] p-1.5 rounded-lg text-white"><Building2 size={18} /></div>
            <span className="font-bold text-[#1a1a2e]">Craft<span className="text-[#E8612D]">IAr</span></span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center ck-fade-in">

          {polling ? (
            <>
              <Loader className="animate-spin text-[#E8612D] mx-auto mb-4" size={48} />
              <h1 className="text-xl font-semibold text-[#333]">Verificando tu pago…</h1>
              <p className="text-gray-500 text-sm mt-2">Esto puede tardar unos segundos.</p>
            </>
          ) : isApproved ? (
            <>
              <div className="relative w-fit mx-auto mb-4">
                <span className="absolute inset-0 rounded-full bg-green-400 ck-ring" />
                <CheckCircle2 size={64} className="text-green-500 relative ck-success" />
              </div>
              <h1 className="text-xl font-semibold text-[#333] ck-fade-up">¡Pago exitoso!</h1>
              {order && (
                <div className="mt-3 ck-fade-up text-sm space-y-1">
                  <p className="text-gray-500">Pedido <b>#{order.id}</b></p>
                  <div className="border border-gray-100 rounded-lg p-3 text-left space-y-1.5 mt-2 bg-gray-50">
                    {parseFloat(order.discount_amount || 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento</span><span>-{money(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                      <span>Envío</span>
                      <span>{parseFloat(order.shipping_cost || 0) > 0 ? money(order.shipping_cost) : <span className="text-green-600">Gratis</span>}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1a1a2e] pt-1 border-t border-gray-200">
                      <span>Total</span><span>{money(order.total)}</span>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-gray-400 text-xs mt-3 ck-fade-up">Te enviamos un email con el detalle de tu compra.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 w-full bg-[#E8612D] text-white rounded-lg py-2.5 text-sm font-medium transition active:scale-[0.98] hover:brightness-105"
              >
                Volver al inicio
              </button>
            </>
          ) : isFailure ? (
            <>
              <XCircle size={64} className="text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-[#333]">El pago no se procesó</h1>
              <p className="text-gray-500 text-sm mt-2">
                Tu pedido #{orderId} quedó pendiente de pago. Podés reintentar o contactarnos.
              </p>
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={() => router.push("/")}
                  className="w-full bg-[#E8612D] text-white rounded-lg py-2.5 text-sm font-medium transition active:scale-[0.98] hover:brightness-105"
                >
                  Volver al inicio
                </button>
              </div>
            </>
          ) : (
            <>
              <Clock size={64} className="text-amber-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-[#333]">Pago en proceso</h1>
              <p className="text-gray-500 text-sm mt-2">
                Tu pago está siendo procesado por MercadoPago. Te notificaremos por email cuando se confirme.
              </p>
              {order && <p className="text-gray-400 text-xs mt-1">Pedido #{order.id}</p>}
              <button
                onClick={() => router.push("/")}
                className="mt-6 w-full bg-[#1a1a2e] text-white rounded-lg py-2.5 text-sm font-medium transition active:scale-[0.98] hover:brightness-105"
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#ededed]">
        <Loader className="animate-spin text-[#E8612D]" size={32} />
      </div>
    }>
      <CheckoutResultContent />
    </Suspense>
  );
}
