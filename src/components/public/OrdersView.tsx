import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ChevronRight, Package, Search, XCircle, Store, CreditCard, CheckCircle2,
} from 'lucide-react';

interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  quantity: number;
  price_at_purchase: string;
}

interface MpPaymentData {
  payment_method?: string;
  payment_type?: string;
  installments?: number;
  card_last_four?: string | null;
  transaction_amount?: string;
}

interface Order {
  id: number;
  username: string;
  status: 'pending_payment' | 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  coupon_code: string | null;
  discount_amount: string;
  shipping_cost: string;
  checkout_payment_method: string;
  mp_payment_data: MpPaymentData | null;
  mp_paid_at: string | null;
  shipping_data: Record<string, any> | null;
  created_at: string;
  items: OrderItem[];
}

interface OrdersViewProps {
  apiBaseUrl: string;
  onBack: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mercadopago: 'MercadoPago',
  card: 'Tarjeta',
  cash: 'Efectivo',
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Esperando pago',
  pending: 'Pendiente',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

// Color del texto del estado en la tarjeta (estilo Mercado Libre: estado como título).
const STATUS_TEXT: Record<string, string> = {
  pending_payment: 'text-blue-600',
  pending: 'text-amber-600',
  preparing: 'text-blue-600',
  shipped: 'text-purple-600',
  delivered: 'text-green-600',
  cancelled: 'text-red-500',
};

// Color del borde lateral de la tarjeta de estado en el detalle.
const STATUS_BORDER: Record<string, string> = {
  pending_payment: 'border-l-blue-500',
  pending: 'border-l-amber-500',
  preparing: 'border-l-blue-500',
  shipped: 'border-l-purple-500',
  delivered: 'border-l-green-500',
  cancelled: 'border-l-red-500',
};

// Mensaje contextual bajo el estado (RN-5).
const STATUS_MESSAGE: Record<string, string> = {
  pending_payment: 'Estamos esperando la confirmación de tu pago.',
  pending: 'Tu pedido fue confirmado y está siendo gestionado.',
  preparing: 'Tu pedido está en preparación.',
  shipped: 'Tu pedido está en camino.',
  delivered: 'Tu pedido fue entregado.',
  cancelled: 'Esta compra fue cancelada.',
};

const money = (n: string | number) => `$${parseFloat(String(n || 0)).toLocaleString('es-AR')}`;

const fullDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

// Clave de agrupación por día ("15 de junio").
const dayKey = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

export default function OrdersView({ apiBaseUrl, onBack }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [period, setPeriod] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Pantalla de detalle (navegación por estado dentro del shell público).
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showItems, setShowItems] = useState(false);
  // Modal de cancelación: máquina de estados confirm → loading → success | error.
  const [cancelModal, setCancelModal] = useState<
    { stage: 'confirm' | 'loading' | 'success' | 'error'; message?: string } | null
  >(null);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  // Traduce el período seleccionado a un date_from (YYYY-MM-DD).
  const periodDateFrom = (p: string): string | null => {
    if (!p) return null;
    const now = new Date();
    if (p === '30d') now.setDate(now.getDate() - 30);
    else if (p === '6m') now.setMonth(now.getMonth() - 6);
    else if (p === 'year') return `${new Date().getFullYear()}-01-01`;
    return now.toISOString().slice(0, 10);
  };

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'compras', page: String(page) });
      if (category) params.set('category', category);
      const df = periodDateFrom(period);
      if (df) params.set('date_from', df);
      const res = await fetch(`${apiBaseUrl}/orders/orders/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.results ?? data);
        setCount(data.count ?? (Array.isArray(data) ? data.length : 0));
      }
    } catch {
      /* sin conexión */
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, page, category, period]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Cargar categorías para el filtro (aplana nivel superior + subcategorías).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/catalog/categories/`);
        if (!res.ok) return;
        const data = await res.json();
        const flat: { id: number; name: string }[] = [];
        for (const c of data) {
          flat.push({ id: c.id, name: c.name });
          for (const sub of c.subcategories ?? []) flat.push({ id: sub.id, name: `  ${sub.name}` });
        }
        setCategories(flat);
      } catch {
        /* sin categorías */
      }
    })();
  }, [apiBaseUrl]);

  const openDetail = async (order: Order) => {
    setShowItems(false);
    setSelected(order);
    // Refrescar el detalle para traer mp_payment_data / shipping_data completos.
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/orders/orders/${order.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSelected(await res.json());
    } catch {
      /* mantiene los datos del listado */
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!selected) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setCancelModal({ stage: 'loading' });
    try {
      const res = await fetch(`${apiBaseUrl}/orders/orders/${selected.id}/cancel/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCancelModal({ stage: 'success' });
        setSelected({ ...selected, status: 'cancelled' });
        fetchOrders();
        setTimeout(() => setCancelModal(null), 1900);
      } else {
        setCancelModal({ stage: 'error', message: data.error || 'No se pudo cancelar la compra.' });
      }
    } catch {
      setCancelModal({ stage: 'error', message: 'Error de conexión al cancelar la compra.' });
    }
  };

  // Subtotal de ítems (sin envío ni descuento).
  const itemsSubtotal = (order: Order) =>
    order.items.reduce((acc, it) => acc + parseFloat(it.price_at_purchase) * it.quantity, 0);

  // Línea de pago: método + cuotas + últimos 4 dígitos (RN-7).
  const paymentLine = (order: Order): { label: string; detail: string | null } => {
    const method = PAYMENT_METHOD_LABELS[order.checkout_payment_method] ?? order.checkout_payment_method ?? '—';
    const mp = order.mp_payment_data;
    if (order.checkout_payment_method === 'mercadopago' && mp) {
      const cuotas = mp.installments && mp.installments > 1 ? `${mp.installments}x ` : '';
      const last4 = mp.card_last_four ? ` ·· ${mp.card_last_four}` : '';
      const detail = (cuotas || last4) ? `${cuotas}${money(order.total)}${last4}`.trim() : null;
      return { label: method, detail };
    }
    return { label: method, detail: null };
  };

  // Miniaturas (hasta 2) de los productos de un pedido.
  const Thumbs = ({ order, size = 56 }: { order: Order; size?: number }) => {
    const imgs = order.items.filter((i) => i.product_image).slice(0, 2);
    if (imgs.length === 0) {
      return (
        <div
          className="rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 shrink-0"
          style={{ width: size, height: size }}
        >
          <Package size={size * 0.45} />
        </div>
      );
    }
    return (
      <div className="flex -space-x-3 shrink-0">
        {imgs.map((it) => (
          <img
            key={it.id}
            src={it.product_image as string}
            alt={it.product_name}
            className="rounded-lg object-cover border-2 border-white bg-white"
            style={{ width: size, height: size }}
          />
        ))}
      </div>
    );
  };

  // ===========================================================================
  // PANTALLA DE DETALLE
  // ===========================================================================
  if (selected) {
    const order = selected;
    const pay = paymentLine(order);
    const shipping = parseFloat(order.shipping_cost || '0');
    const discount = parseFloat(order.discount_amount || '0');

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 w-full animate-[fadeIn_0.3s_ease]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => setSelected(null)}
            className="hover:text-[#E8612D] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Mis Compras
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-[#1a1a2e] font-semibold">Estado de la compra</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* ---- Columna izquierda ---- */}
          <div className="flex flex-col gap-4">
            {/* Tarjeta de productos */}
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-[#1a1a2e]">
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                  </p>
                  <button
                    onClick={() => setShowItems((v) => !v)}
                    className="text-sm text-[#E8612D] font-medium hover:underline mt-0.5"
                  >
                    Ver detalle
                  </button>
                </div>
                <Thumbs order={order} />
              </div>

              {showItems && (
                <div className="divide-y divide-gray-100 mt-4 border-t border-gray-100 pt-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center gap-3 text-sm">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded object-cover bg-white shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                          <Package size={18} />
                        </div>
                      )}
                      <span className="text-gray-700 min-w-0 flex-1">
                        {item.quantity}x {item.product_name}
                        <span className="text-gray-400 text-xs ml-1">SKU: {item.product_sku}</span>
                      </span>
                      <span className="font-semibold text-[#1a1a2e] shrink-0">
                        {money(parseFloat(item.price_at_purchase) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tarjeta de estado */}
            <div className={`bg-white border border-[#e5e7eb] border-l-4 ${STATUS_BORDER[order.status]} rounded-2xl p-5 shadow-sm`}>
              <p className={`text-sm font-bold ${STATUS_TEXT[order.status]}`}>{STATUS_LABELS[order.status]}</p>
              <p className="text-[#1a1a2e] font-semibold mt-1">{STATUS_MESSAGE[order.status]}</p>
              <p className="text-gray-400 text-xs mt-2 flex items-center gap-1.5">
                <Store size={13} /> Vendido por CraftIAr
              </p>
            </div>

            {/* Acciones (RN-6: cancelar solo si pending) */}
            {order.status === 'pending' && (
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#1a1a2e] mb-3">Acciones</p>
                <button
                  onClick={() => setCancelModal({ stage: 'confirm' })}
                  className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
                >
                  <XCircle size={16} />
                  Cancelar compra
                </button>
              </div>
            )}
          </div>

          {/* ---- Columna derecha: Detalle de la compra ---- */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm h-fit lg:sticky lg:top-6">
            <h2 className="font-bold text-[#1a1a2e]">Detalle de la compra</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {fullDate(order.created_at)} · #{order.id}
            </p>

            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Productos ({order.items.length})</span>
                <span>{money(itemsSubtotal(order))}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span>-{money(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span>{shipping > 0 ? money(shipping) : <span className="text-green-600 font-medium">Gratis</span>}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-3 pt-3 text-sm">
              <div className="flex justify-between items-start text-gray-600">
                <span className="flex items-center gap-1.5"><CreditCard size={14} /> {pay.label}</span>
                {pay.detail && <span className="text-gray-500 text-right">{pay.detail}</span>}
              </div>
            </div>

            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
              <span className="font-bold text-[#1a1a2e]">Total</span>
              <span className="font-black text-lg text-[#1a1a2e]">{money(order.total)}</span>
            </div>

            {detailLoading && (
              <p className="text-xs text-gray-300 mt-3 text-center">Actualizando…</p>
            )}
          </div>
        </div>

        {/* Modal de cancelación */}
        {cancelModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 ck-fade-in"
            onClick={() => {
              if (cancelModal.stage === 'confirm' || cancelModal.stage === 'error') setCancelModal(null);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center ck-pop"
              onClick={(e) => e.stopPropagation()}
            >
              {cancelModal.stage === 'confirm' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <XCircle size={26} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1a2e]">¿Cancelar la compra?</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setCancelModal(null)}
                      className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      Volver
                    </button>
                    <button
                      onClick={confirmCancel}
                      className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-lg hover:bg-red-600 active:scale-[0.98] transition"
                    >
                      Sí, cancelar
                    </button>
                  </div>
                </>
              )}

              {cancelModal.stage === 'loading' && (
                <div className="py-6">
                  <div className="w-12 h-12 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#1a1a2e] font-semibold">Cancelando tu compra…</p>
                  <p className="text-sm text-gray-400 mt-1">Reponiendo el stock</p>
                  <div className="flex justify-center gap-1.5 mt-3">
                    <span className="ck-dot w-2 h-2 bg-red-300 rounded-full" style={{ '--d': '0ms' } as React.CSSProperties} />
                    <span className="ck-dot w-2 h-2 bg-red-300 rounded-full" style={{ '--d': '150ms', animationDelay: '150ms' } as React.CSSProperties} />
                    <span className="ck-dot w-2 h-2 bg-red-300 rounded-full" style={{ '--d': '300ms', animationDelay: '300ms' } as React.CSSProperties} />
                  </div>
                </div>
              )}

              {cancelModal.stage === 'success' && (
                <div className="py-4">
                  <div className="relative w-fit mx-auto mb-4">
                    <span className="absolute inset-0 rounded-full bg-green-400 ck-ring" />
                    <CheckCircle2 size={56} className="text-green-500 relative ck-success" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1a2e]">Compra cancelada</h3>
                  <p className="text-sm text-gray-500 mt-1">El stock fue repuesto correctamente.</p>
                </div>
              )}

              {cancelModal.stage === 'error' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <XCircle size={26} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1a2e]">No se pudo cancelar</h3>
                  <p className="text-sm text-gray-500 mt-2">{cancelModal.message}</p>
                  <button
                    onClick={() => setCancelModal(null)}
                    className="mt-6 w-full bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-lg hover:brightness-110 transition"
                  >
                    Entendido
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // PANTALLA DE LISTADO
  // ===========================================================================
  const term = search.trim().toLowerCase();
  const visible = term
    ? orders.filter(
        (o) =>
          String(o.id).includes(term) ||
          o.items.some((i) => i.product_name.toLowerCase().includes(term)),
      )
    : orders;

  // Agrupar por fecha (RN-11). Mantiene el orden descendente del backend.
  const groups: { key: string; orders: Order[] }[] = [];
  for (const o of visible) {
    const k = dayKey(o.created_at);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.orders.push(o);
    else groups.push({ key: k, orders: [o] });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease] w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={onBack} className="hover:text-[#E8612D] flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-[#1a1a2e] font-semibold">Mis Compras</span>
      </div>

      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Mis Compras</h1>

      {/* Buscador */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscá por compra, producto y más…"
          className="w-full bg-white border border-[#e5e7eb] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition"
        />
      </div>

      {/* Filtros Categoría + Fecha + contador */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D] cursor-pointer"
        >
          <option value="">Categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={period}
          onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
          className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D] cursor-pointer"
        >
          <option value="">Cualquier fecha</option>
          <option value="30d">Últimos 30 días</option>
          <option value="6m">Últimos 6 meses</option>
          <option value="year">Este año</option>
        </select>

        {(category || period) && (
          <button
            onClick={() => { setCategory(''); setPeriod(''); setPage(1); }}
            className="text-sm font-medium text-gray-500 hover:text-[#E8612D] transition-colors"
          >
            Limpiar
          </button>
        )}

        <span className="ml-auto text-sm text-gray-400 shrink-0">{count} {count === 1 ? 'compra' : 'compras'}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8612D] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e5e7eb] rounded-2xl py-16 flex flex-col items-center">
          <Package size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500">
            {term ? 'No encontramos compras que coincidan con tu búsqueda.' : 'Todavía no tenés compras.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.key}>
              {/* Encabezado de fecha */}
              <p className="text-sm font-semibold text-[#1a1a2e] capitalize mb-2 px-1">{group.key}</p>

              <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm divide-y divide-gray-100">
                {group.orders.map((order) => (
                  <div key={order.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <Thumbs order={order} size={64} />

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${STATUS_TEXT[order.status]}`}>{STATUS_LABELS[order.status]}</p>
                      <p className="text-[#1a1a2e] font-semibold truncate">{STATUS_MESSAGE[order.status]}</p>
                      <p className="text-gray-500 text-sm truncate mt-0.5">
                        {order.items[0]?.product_name}
                        {order.items.length > 1 ? ` y ${order.items.length - 1} más` : ''}
                      </p>
                      <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
                        <Store size={12} /> CraftIAr · {order.items.reduce((a, i) => a + i.quantity, 0)} u.
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="font-bold text-[#1a1a2e]">{money(order.total)}</span>
                      <button
                        onClick={() => openDetail(order)}
                        className="bg-[#E8612D] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:brightness-105 active:scale-[0.98] transition"
                      >
                        Ver compra
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && !term && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-semibold border border-[#e5e7eb] rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-semibold border border-[#e5e7eb] rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
