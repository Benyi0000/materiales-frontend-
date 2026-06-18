import React, { useState, useEffect, useCallback } from 'react';
import { Store, ChevronDown, ChevronUp, Package, Ticket, ArrowRight, Filter } from 'lucide-react';

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
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  coupon_code: string | null;
  discount_amount: string;
  created_at: string;
  items: OrderItem[];
}

interface SalesPanelProps {
  apiBaseUrl: string;
  currentUser: any;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

// Secuencia lineal de avance (RN4). 'cancelled' no avanza.
const STATUS_SEQUENCE = ['pending', 'preparing', 'shipped', 'delivered'];
const nextStatus = (status: string): string | null => {
  const idx = STATUS_SEQUENCE.indexOf(status);
  if (idx === -1 || idx + 1 >= STATUS_SEQUENCE.length) return null;
  return STATUS_SEQUENCE[idx + 1];
};

export default function SalesPanel({ apiBaseUrl, currentUser }: SalesPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const canChangeStatus =
    currentUser?.is_superuser ||
    (currentUser?.active_permissions &&
      typeof currentUser.active_permissions === 'object' &&
      'pedidosventas.cambiar_estado' in currentUser.active_permissions);

  const fetchSales = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'ventas', page: String(page) });
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
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
  }, [apiBaseUrl, page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleAdvanceStatus = async (order: Order) => {
    const target = nextStatus(order.status);
    if (!target) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    if (!window.confirm(`¿Avanzar el pedido #${order.id} a "${STATUS_LABELS[target]}"? Se notificará al cliente por email.`)) return;
    setUpdatingId(order.id);
    try {
      const res = await fetch(`${apiBaseUrl}/orders/orders/${order.id}/update_status/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Estado actualizado a "${STATUS_LABELS[target]}" con éxito.`);
        fetchSales();
      } else {
        alert(`Error: ${data.error || 'No se pudo actualizar el estado.'}`);
      }
    } catch {
      alert('Error de conexión al actualizar el estado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatPrice = (price: string | number) => `$${parseFloat(String(price)).toLocaleString('es-AR')}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-grow flex flex-col gap-6 text-left max-w-5xl mx-auto w-full animate-[fadeIn_0.3s_ease]">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-[#1a1a2e]">
          <div className="p-2 bg-[#E8612D]/10 rounded-xl">
            <Store className="text-[#E8612D]" size={28} />
          </div>
          <span>Ventas</span>
        </h2>
        <p className="text-sm text-[#6b7280] mt-2">
          Listado de ventas del ecommerce. Filtra por estado y fecha
          {canChangeStatus ? ', y avanza el estado de cada pedido (notifica al cliente).' : '.'}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D]"
            />
          </div>
          {(dateFrom || dateTo || statusFilter) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setPage(1); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#E8612D] px-3 py-1.5 rounded-lg transition-all"
            >
              <Filter size={14} /> Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-sm text-gray-400 self-center">{count} {count === 1 ? 'venta' : 'ventas'}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8612D] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e5e7eb] rounded-2xl py-16 flex flex-col items-center">
          <Package size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500">No hay ventas que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            const target = nextStatus(order.status);
            return (
              <div key={order.id} className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#1a1a2e]">Pedido #{order.id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(order.created_at)} · Cliente: @{order.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="font-bold text-[#1a1a2e]">{formatPrice(order.total)}</span>
                    {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

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

                    {/* Avanzar estado (RN4): solo con permiso y si hay un siguiente estado */}
                    {canChangeStatus && target && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleAdvanceStatus(order)}
                          disabled={updatingId === order.id}
                          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#E8612D] hover:bg-[#d4551f] px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
                        >
                          {updatingId === order.id ? 'Actualizando…' : <>Avanzar a "{STATUS_LABELS[target]}" <ArrowRight size={16} /></>}
                        </button>
                      </div>
                    )}
                    {canChangeStatus && !target && order.status !== 'cancelled' && (
                      <p className="mt-4 text-right text-xs text-gray-400 italic">El pedido alcanzó el estado final.</p>
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
        <div className="flex items-center justify-center gap-4 mt-2">
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
