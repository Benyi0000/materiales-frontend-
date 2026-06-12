import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Package, Ticket, XCircle } from 'lucide-react';

interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  price_at_purchase: string;
}

interface Order {
  id: number;
  username: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  coupon_code: string | null;
  discount_amount: string;
  created_at: string;
  items: OrderItem[];
}

interface OrdersViewProps {
  apiBaseUrl: string;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente de Pago',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function OrdersView({ apiBaseUrl, onBack }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set('status', statusFilter);
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
  }, [apiBaseUrl, page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async (orderId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    if (!window.confirm(`¿Cancelar el pedido #${orderId}? El stock será repuesto.`)) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`${apiBaseUrl}/orders/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert('Pedido cancelado con éxito. El stock fue repuesto.');
        fetchOrders();
      } else {
        alert(`Error: ${data.error || 'No se pudo cancelar el pedido.'}`);
      }
    } catch {
      alert('Error de conexión al cancelar el pedido.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatPrice = (price: string | number) => `$${parseFloat(String(price)).toLocaleString('es-AR')}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease] w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={onBack} className="hover:text-[#E8612D] flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-[#1a1a2e] font-semibold">Mis pedidos</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
          <Package className="text-[#E8612D]" size={26} /> Mis pedidos
        </h1>
        <span className="text-sm text-gray-400">{count} {count === 1 ? 'pedido' : 'pedidos'}</span>
      </div>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[['', 'Todos'], ...Object.entries(STATUS_LABELS)].map(([value, label]) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === value
                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                : 'bg-white text-gray-600 border-[#e5e7eb] hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8612D] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e5e7eb] rounded-2xl py-16 flex flex-col items-center">
          <Package size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500">No tenés pedidos {statusFilter ? `en estado "${STATUS_LABELS[statusFilter]}"` : 'todavía'}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            return (
              <div key={order.id} className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
                {/* Fila resumen */}
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div>
                      <p className="font-bold text-[#1a1a2e]">Pedido #{order.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="font-bold text-[#1a1a2e]">{formatPrice(order.total)}</span>
                    {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {/* Detalle expandible */}
                {expanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/40">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-2.5 flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.product_name}
                            <span className="text-gray-400 text-xs ml-2">SKU: {item.product_sku}</span>
                          </span>
                          <span className="font-semibold text-[#1a1a2e]">
                            {formatPrice(parseFloat(item.price_at_purchase) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {parseFloat(order.discount_amount) > 0 && (
                      <div className="flex justify-between text-sm text-green-600 font-medium pt-3 border-t border-gray-100 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Ticket size={14} /> Cupón {order.coupon_code}
                        </span>
                        <span>-{formatPrice(order.discount_amount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
                      <span className="font-bold text-[#1a1a2e]">Total</span>
                      <span className="font-black text-lg text-[#1a1a2e]">{formatPrice(order.total)}</span>
                    </div>

                    {/* RN-15: cancelación solo para pedidos pendientes */}
                    {order.status === 'pending' && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={cancellingId === order.id}
                          className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          {cancellingId === order.id ? 'Cancelando…' : 'Cancelar pedido'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
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
