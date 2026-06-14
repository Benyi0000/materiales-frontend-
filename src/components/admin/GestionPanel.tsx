"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  BarChart3, FileText, PackageX, Image as ImageIcon, Ticket, CreditCard, Users2,
  Plus, Trash2, Download, RefreshCw,
} from "lucide-react";

interface Props {
  apiBaseUrl: string;
  currentUser: any;
}

type Sub =
  | "dashboard" | "reportes" | "stock" | "banners"
  | "promociones" | "planes" | "suscripciones";

const money = (n: any) => `$${Number(n || 0).toLocaleString("es-AR")}`;

export default function GestionPanel({ apiBaseUrl, currentUser }: Props) {
  const has = (perm: string) =>
    currentUser?.is_superuser ||
    (currentUser?.active_permissions &&
      typeof currentUser.active_permissions === "object" &&
      perm in currentUser.active_permissions);

  const tabs: { key: Sub; label: string; perm: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", perm: "gestion.ver_dashboard", icon: <BarChart3 size={16} /> },
    { key: "reportes", label: "Reportes de pedidos", perm: "gestion.exportar_reportes", icon: <FileText size={16} /> },
    { key: "stock", label: "Stock bajo", perm: "gestion.ver_stock_bajo", icon: <PackageX size={16} /> },
    { key: "banners", label: "Banners", perm: "gestion.gestionar_banners", icon: <ImageIcon size={16} /> },
    { key: "promociones", label: "Promociones", perm: "gestion.gestionar_promociones", icon: <Ticket size={16} /> },
    { key: "planes", label: "Planes", perm: "gestion.gestionar_planes", icon: <CreditCard size={16} /> },
    { key: "suscripciones", label: "Suscripciones", perm: "gestion.gestionar_suscripciones", icon: <Users2 size={16} /> },
  ];
  const visible = tabs.filter((t) => has(t.perm));
  const [sub, setSub] = useState<Sub | null>(visible[0]?.key ?? null);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">Gestión Interna</h1>
      <p className="text-sm text-[#6b7280] mb-5">Administración del negocio</p>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        {visible.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              sub === t.key ? "bg-[#E8612D] text-white" : "text-[#6b7280] hover:bg-orange-50"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {sub === "dashboard" && <DashboardSub apiBaseUrl={apiBaseUrl} />}
      {sub === "reportes" && <ReportesSub apiBaseUrl={apiBaseUrl} />}
      {sub === "stock" && <StockSub apiBaseUrl={apiBaseUrl} />}
      {sub === "banners" && <BannersSub apiBaseUrl={apiBaseUrl} />}
      {sub === "promociones" && <CuponesSub apiBaseUrl={apiBaseUrl} />}
      {sub === "planes" && <PlanesSub apiBaseUrl={apiBaseUrl} />}
      {sub === "suscripciones" && <SuscripcionesSub apiBaseUrl={apiBaseUrl} />}
    </div>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4">{children}</div>
);
const ESTADOS: Record<string, string> = {
  pending: "Pendiente", preparing: "En preparación", shipped: "Enviado",
  delivered: "Entregado", cancelled: "Cancelado",
};

/* ---------------- Dashboard ---------------- */
function DashboardSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch(`${apiBaseUrl}/orders/gestion/dashboard/`)
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [apiBaseUrl]);
  if (loading) return <p className="text-gray-500">Cargando…</p>;
  if (!data) return <p className="text-red-500">No se pudo cargar.</p>;
  const maxEvol = Math.max(1, ...(data.evolucion_ventas || []).map((d: any) => Number(d.total)));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <p className="text-xs text-gray-500 uppercase">Ingresos totales</p>
        <p className="text-3xl font-bold text-[#E8612D]">{money(data.ingresos_totales)}</p>
        <p className="text-xs text-gray-400 mt-1">{data.date_from} → {data.date_to}</p>
      </Card>
      <Card>
        <p className="text-xs text-gray-500 uppercase mb-2">Pedidos por estado</p>
        {(data.pedidos_por_estado || []).map((e: any) => (
          <div key={e.status} className="flex justify-between text-sm py-0.5">
            <span>{ESTADOS[e.status] || e.status}</span><span className="font-semibold">{e.cantidad}</span>
          </div>
        ))}
      </Card>
      <Card>
        <p className="text-xs text-gray-500 uppercase mb-2">Top 10 productos</p>
        {(data.productos_mas_vendidos || []).map((p: any, i: number) => (
          <div key={i} className="flex justify-between text-sm py-0.5">
            <span className="truncate mr-2">{p.product__name}</span><span className="font-semibold">{p.cantidad}</span>
          </div>
        ))}
        {!data.productos_mas_vendidos?.length && <p className="text-sm text-gray-400">Sin datos.</p>}
      </Card>
      <Card>
        <p className="text-xs text-gray-500 uppercase mb-2">Evolución de ventas</p>
        {(data.evolucion_ventas || []).map((d: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className="w-20 text-gray-500">{d.dia}</span>
            <div className="flex-1 bg-orange-100 rounded h-3" >
              <div className="bg-[#E8612D] h-3 rounded" style={{ width: `${(Number(d.total) / maxEvol) * 100}%` }} />
            </div>
            <span className="w-20 text-right">{money(d.total)}</span>
          </div>
        ))}
        {!data.evolucion_ventas?.length && <p className="text-sm text-gray-400">Sin datos.</p>}
      </Card>
    </div>
  );
}

/* ---------------- Reportes de pedidos ---------------- */
function ReportesSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ status: "", date_from: "", date_to: "" });
  const qs = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
    return p.toString();
  };
  const load = useCallback(() => {
    apiFetch(`${apiBaseUrl}/orders/gestion/reportes/pedidos/?${qs()}`)
      .then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : []));
  }, [apiBaseUrl, f]);
  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    const r = await apiFetch(`${apiBaseUrl}/orders/gestion/reportes/pedidos/?${qs()}&export=csv`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reporte_pedidos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={f.date_from} onChange={(e) => setF({ ...f, date_from: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={f.date_to} onChange={(e) => setF({ ...f, date_to: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <button onClick={exportCsv} className="flex items-center gap-1 bg-[#E8612D] text-white px-3 py-2 rounded-lg text-sm font-medium">
          <Download size={15} /> Exportar CSV
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr><th className="text-left p-3">#</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Estado</th><th className="text-right p-3">Total</th><th className="text-left p-3">Fecha</th></tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="p-3">{o.id}</td><td className="p-3">{o.username}</td>
                <td className="p-3">{ESTADOS[o.status] || o.status}</td>
                <td className="p-3 text-right">{money(o.total)}</td>
                <td className="p-3">{new Date(o.created_at).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Sin pedidos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Stock bajo ---------------- */
function StockSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [movs, setMovs] = useState<any[]>([]);
  useEffect(() => {
    apiFetch(`${apiBaseUrl}/catalog/gestion/stock-bajo/`).then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : []));
    apiFetch(`${apiBaseUrl}/catalog/gestion/stock-movimientos/`).then((r) => r.json()).then((d) => setMovs((d.results || d || []).slice(0, 30)));
  }, [apiBaseUrl]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <p className="p-3 font-semibold text-sm border-b">Productos con stock bajo</p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="text-left p-2">SKU</th><th className="text-left p-2">Producto</th><th className="text-right p-2">Stock</th><th className="text-right p-2">Mín.</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="p-2">{p.sku}</td><td className="p-2">{p.name}</td>
                <td className="p-2 text-right text-red-600 font-semibold">{p.stock}</td><td className="p-2 text-right">{p.min_stock}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Todo el stock está por encima del umbral.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <p className="p-3 font-semibold text-sm border-b">Movimientos recientes</p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="text-left p-2">Producto</th><th className="text-left p-2">Motivo</th><th className="text-right p-2">Δ</th><th className="text-right p-2">Stock</th></tr></thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="p-2">{m.product_sku}</td><td className="p-2">{m.reason_display}</td>
                <td className={`p-2 text-right font-semibold ${m.change < 0 ? "text-red-600" : "text-green-600"}`}>{m.change}</td>
                <td className="p-2 text-right">{m.resulting_stock}</td>
              </tr>
            ))}
            {!movs.length && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Sin movimientos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Banners ---------------- */
function BannersSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", image_url: "", link: "", order: 0, is_active: true });
  const load = useCallback(() => {
    apiFetch(`${apiBaseUrl}/catalog/banners/`).then((r) => r.json()).then((d) => setRows(d.results || d || []));
  }, [apiBaseUrl]);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!form.image_url) return alert("La imagen es obligatoria.");
    await apiFetch(`${apiBaseUrl}/catalog/banners/`, { method: "POST", body: JSON.stringify(form) });
    setForm({ title: "", image_url: "", link: "", order: 0, is_active: true }); load();
  };
  const del = async (id: number) => { await apiFetch(`${apiBaseUrl}/catalog/banners/${id}/`, { method: "DELETE" }); load(); };
  const toggle = async (b: any) => { await apiFetch(`${apiBaseUrl}/catalog/banners/${b.id}/`, { method: "PATCH", body: JSON.stringify({ is_active: !b.is_active }) }); load(); };
  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid gap-2 sm:grid-cols-2">
        <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="URL de imagen *" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Link (opcional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Orden" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
        <button onClick={create} className="flex items-center justify-center gap-1 bg-[#E8612D] text-white px-3 py-2 rounded-lg text-sm font-medium sm:col-span-2"><Plus size={15} /> Agregar banner</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.sort((a, b) => a.order - b.order).map((b) => (
          <div key={b.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt={b.title} className="w-full h-28 object-cover" />
            <div className="p-3">
              <p className="font-semibold text-sm truncate">{b.title || "(sin título)"}</p>
              <p className="text-xs text-gray-400">Orden: {b.order}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => toggle(b)} className={`text-xs px-2 py-1 rounded ${b.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{b.is_active ? "Activo" : "Inactivo"}</button>
                <button onClick={() => del(b.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 flex items-center gap-1"><Trash2 size={12} /> Eliminar</button>
              </div>
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-gray-400 text-sm">Sin banners.</p>}
      </div>
    </div>
  );
}

/* ---------------- Cupones / Promociones ---------------- */
function CuponesSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", discount_type: "percent", value: 10, valid_from: "", valid_until: "", max_uses: "" });
  const load = useCallback(() => {
    apiFetch(`${apiBaseUrl}/orders/coupons/`).then((r) => r.json()).then((d) => setRows(d.results || d || []));
  }, [apiBaseUrl]);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    const body: any = { ...form, max_uses: form.max_uses || null };
    const r = await apiFetch(`${apiBaseUrl}/orders/coupons/`, { method: "POST", body: JSON.stringify(body) });
    if (!r.ok) { const e = await r.json(); return alert(JSON.stringify(e)); }
    setForm({ code: "", discount_type: "percent", value: 10, valid_from: "", valid_until: "", max_uses: "" }); load();
  };
  const del = async (id: number) => { await apiFetch(`${apiBaseUrl}/orders/coupons/${id}/`, { method: "DELETE" }); load(); };
  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid gap-2 sm:grid-cols-3">
        <input placeholder="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          <option value="percent">Porcentaje</option><option value="fixed">Monto fijo</option>
        </select>
        <input type="number" placeholder="Valor" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Máx. usos (vacío = ∞)" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <button onClick={create} className="flex items-center justify-center gap-1 bg-[#E8612D] text-white px-3 py-2 rounded-lg text-sm font-medium sm:col-span-3"><Plus size={15} /> Crear cupón</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="text-left p-3">Código</th><th className="text-left p-3">Tipo</th><th className="text-right p-3">Valor</th><th className="text-right p-3">Usos</th><th className="p-3"></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.discount_type === "percent" ? "%" : "Fijo"}</td>
                <td className="p-3 text-right">{c.discount_type === "percent" ? `${c.value}%` : money(c.value)}</td>
                <td className="p-3 text-right">{c.times_used}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                <td className="p-3 text-right"><button onClick={() => del(c.id)} className="text-red-600"><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Sin cupones.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Planes ---------------- */
function PlanesSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: "", price: 0, duration_days: 30, trial_days: 0, auto_renew: true, profiles: [], is_active: true });
  const load = useCallback(() => {
    apiFetch(`${apiBaseUrl}/orders/plans/`).then((r) => r.json()).then((d) => setRows(d.results || d || []));
    apiFetch(`${apiBaseUrl}/users/admin/profiles/`).then((r) => r.json()).then((d) => setProfiles(d.results || d || []));
  }, [apiBaseUrl]);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!form.name) return alert("El nombre es obligatorio.");
    const r = await apiFetch(`${apiBaseUrl}/orders/plans/`, { method: "POST", body: JSON.stringify(form) });
    if (!r.ok) { return alert(JSON.stringify(await r.json())); }
    setForm({ name: "", price: 0, duration_days: 30, trial_days: 0, auto_renew: true, profiles: [], is_active: true }); load();
  };
  const del = async (id: number) => { await apiFetch(`${apiBaseUrl}/orders/plans/${id}/`, { method: "DELETE" }); load(); };
  const toggleProfile = (id: number) =>
    setForm((f: any) => ({ ...f, profiles: f.profiles.includes(id) ? f.profiles.filter((x: number) => x !== id) : [...f.profiles, id] }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-sm">Nuevo plan</p>
        <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Precio" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="border rounded-lg px-2 py-2 text-sm" />
          <input type="number" placeholder="Días" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} className="border rounded-lg px-2 py-2 text-sm" />
          <input type="number" placeholder="Prueba" value={form.trial_days} onChange={(e) => setForm({ ...form, trial_days: Number(e.target.value) })} className="border rounded-lg px-2 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.auto_renew} onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })} /> Auto-renovación</label>
        <p className="text-xs text-gray-500 mt-1">Perfiles que otorga:</p>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {profiles.map((p) => (
            <button key={p.id} onClick={() => toggleProfile(p.id)} className={`text-xs px-2 py-1 rounded ${form.profiles.includes(p.id) ? "bg-[#E8612D] text-white" : "bg-gray-100 text-gray-600"}`}>{p.name}</button>
          ))}
        </div>
        <button onClick={create} className="flex items-center justify-center gap-1 bg-[#E8612D] text-white px-3 py-2 rounded-lg text-sm font-medium w-full"><Plus size={15} /> Crear plan</button>
      </div>
      <div className="space-y-2">
        {rows.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">{p.name} {p.is_active ? "" : <span className="text-gray-400">(inactivo)</span>}</p>
              <p className="text-xs text-gray-500">{money(p.price)} · {p.duration_days}d · prueba {p.trial_days}d · {p.auto_renew ? "auto-renueva" : "no renueva"}</p>
              <p className="text-xs text-gray-400">Perfiles: {(p.profile_names || []).join(", ") || "—"}</p>
            </div>
            <button onClick={() => del(p.id)} className="text-red-600"><Trash2 size={15} /></button>
          </div>
        ))}
        {!rows.length && <p className="text-gray-400 text-sm">Sin planes.</p>}
      </div>
    </div>
  );
}

/* ---------------- Suscripciones (admin) ---------------- */
function SuscripcionesSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(() => {
    apiFetch(`${apiBaseUrl}/orders/admin/subscriptions/`).then((r) => r.json()).then((d) => setRows(d.results || d || []));
  }, [apiBaseUrl]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b">
        <p className="font-semibold text-sm">Suscripciones</p>
        <button onClick={load} className="text-gray-500 hover:text-[#E8612D]"><RefreshCw size={15} /></button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="text-left p-3">Usuario</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Estado</th><th className="text-left p-3">Vence</th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-gray-100">
              <td className="p-3">{s.username}</td>
              <td className="p-3">{s.current_plan_name || "—"}</td>
              <td className="p-3">{s.status}{s.cancel_at_period_end ? " (cancela)" : ""}</td>
              <td className="p-3">{s.end_date ? new Date(s.end_date).toLocaleDateString("es-AR") : "—"}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Sin suscripciones.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
