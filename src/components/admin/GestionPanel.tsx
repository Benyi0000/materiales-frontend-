"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Plus, Trash2, Download, RefreshCw, Upload, Pencil, X, Check } from "lucide-react";

export type GestionSection =
  | "dashboard" | "reportes" | "stock" | "banners"
  | "promociones" | "planes" | "suscripciones";

interface Props {
  apiBaseUrl: string;
  section: GestionSection;
}

const money = (n: any) => `$${Number(n || 0).toLocaleString("es-AR")}`;

const TITLES: Record<GestionSection, string> = {
  dashboard: "Dashboard de ventas",
  reportes: "Reportes de pedidos",
  stock: "Stock bajo",
  banners: "Gestión de banners",
  promociones: "Promociones",
  planes: "Planes de suscripción",
  suscripciones: "Suscripciones",
};

/** Renderiza UNA sub-sección de Gestión Interna (cada una es su propio módulo del sidebar). */
export default function GestionPanel({ apiBaseUrl, section }: Props) {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">{TITLES[section]}</h1>
      <p className="text-sm text-[#6b7280] mb-5">Gestión Interna</p>

      {section === "dashboard" && <DashboardSub apiBaseUrl={apiBaseUrl} />}
      {section === "reportes" && <ReportesSub apiBaseUrl={apiBaseUrl} />}
      {section === "stock" && <StockSub apiBaseUrl={apiBaseUrl} />}
      {section === "banners" && <BannersSub apiBaseUrl={apiBaseUrl} />}
      {section === "promociones" && <CuponesSub apiBaseUrl={apiBaseUrl} />}
      {section === "planes" && <PlanesSub apiBaseUrl={apiBaseUrl} />}
      {section === "suscripciones" && <SuscripcionesSub apiBaseUrl={apiBaseUrl} />}
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
const SLOTS: { value: string; label: string; res: string }[] = [
  { value: "hero", label: "Hero (imagen grande arriba)", res: "1920 × 600 px (panorámica)" },
  { value: "carousel", label: "Carrusel (franja debajo del hero)", res: "1200 × 320 px" },
];
const slotLabel = (v: string) => SLOTS.find((s) => s.value === v)?.label ?? v;
const slotRes = (v: string) => SLOTS.find((s) => s.value === v)?.res ?? "";

/** Vista previa realista de cómo se verá el banner en el catálogo, según su slot. */
function BannerPreview({ slot, image_url, title, subtitle, overlay }: { slot: string; image_url: string; title?: string; subtitle?: string; overlay?: number }) {
  if (!image_url) return null;
  return (
    <div className="sm:col-span-2">
      <p className="text-xs text-gray-500 mb-1">👁️ Vista previa en el catálogo:</p>
      {slot === "hero" ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden ck-fade-in border border-gray-200">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${image_url}')` }} />
          <div className="absolute inset-0 transition-all" style={{ backgroundColor: `rgba(0,0,0,${(overlay ?? 55) / 100})` }} />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-white font-bold text-lg sm:text-2xl leading-tight">{title || "Construye mejor con CraftIAr"}</p>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-md">{subtitle || "Materiales de construcción premium con herramientas de estimación basadas en IA."}</p>
            <span className="mt-2 bg-white text-[#1a1a2e] text-xs font-semibold px-4 py-1.5 rounded-full shadow">Ver Promociones</span>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-md ck-fade-in max-w-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image_url} alt={title} className="w-full h-32 object-cover" />
          {title && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3"><p className="text-white font-semibold">{title}</p></div>}
        </div>
      )}
    </div>
  );
}

/** Campos de un banner (reutilizado para crear y para personalizar), con subida y preview. */
function BannerFields({ value, set, apiBaseUrl }: { value: any; set: (v: any) => void; apiBaseUrl: string }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append("image", file);
    const r = await apiFetch(`${apiBaseUrl}/catalog/banners/upload-image/`, { method: "POST", body: fd });
    setUploading(false);
    if (r.ok) { const d = await r.json(); set({ ...value, image_url: d.image_url }); }
    else { const e = await r.json().catch(() => ({})); alert(e.error || "No se pudo subir la imagen."); }
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input placeholder={value.slot === "hero" ? "Título (encabezado grande)" : "Título / texto"} value={value.title} onChange={(e) => set({ ...value, title: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
      <select value={value.slot} onChange={(e) => set({ ...value, slot: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
        {SLOTS.map((s) => <option key={s.value} value={s.value}>Ubicación: {s.label}</option>)}
      </select>
      {value.slot === "hero" && (
        <input placeholder="Subtítulo (texto debajo del título, solo Hero)" value={value.subtitle || ""} onChange={(e) => set({ ...value, subtitle: e.target.value })} className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" />
      )}
      {value.slot === "hero" && (
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">Oscurecido sobre la imagen (legibilidad del texto): <b>{value.overlay_opacity ?? 55}%</b></label>
          <input type="range" min={0} max={90} value={value.overlay_opacity ?? 55} onChange={(e) => set({ ...value, overlay_opacity: Number(e.target.value) })} className="w-full accent-[#E8612D]" />
        </div>
      )}
      <p className="text-xs text-gray-500 sm:col-span-2">📐 Resolución recomendada para <b>{slotLabel(value.slot)}</b>: <b>{slotRes(value.slot)}</b> · JPG, PNG o WEBP · máx 5 MB</p>
      <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 items-stretch">
        <input placeholder="URL de imagen" value={value.image_url} onChange={(e) => set({ ...value, image_url: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1" />
        <label className="border rounded-lg px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 flex items-center justify-center gap-2 whitespace-nowrap">
          <Upload size={14} /> {uploading ? "Subiendo…" : "Subir imagen"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>
      <div>
        <label className="text-xs text-gray-500">Link al hacer clic <span className="text-gray-400">(opcional)</span></label>
        <input placeholder="https://… a dónde lleva el banner" value={value.link} onChange={(e) => set({ ...value, link: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
      </div>
      <div>
        <label className="text-xs text-gray-500">Orden de aparición</label>
        <input type="number" min={0} value={value.order} onChange={(e) => set({ ...value, order: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm w-full" />
        <p className="text-[11px] text-gray-400 mt-0.5">Menor número = aparece primero {value.slot === "carousel" ? "en el carrusel" : ""}</p>
      </div>
      <BannerPreview slot={value.slot} image_url={value.image_url} title={value.title} subtitle={value.subtitle} overlay={value.overlay_opacity} />
    </div>
  );
}

const BLANK_BANNER = { title: "", subtitle: "", image_url: "", link: "", slot: "carousel", overlay_opacity: 55, order: 0, is_active: true };

/** Tarjeta de un banner en el listado. */
function BannerCard({ b, onEdit, onToggle, onDel }: { b: any; onEdit: () => void; onToggle: () => void; onDel: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.image_url} alt={b.title} className={`w-full h-28 object-cover ${b.is_active ? "" : "opacity-40 grayscale"}`} />
        {!b.is_active && <span className="absolute top-2 left-2 bg-gray-700/80 text-white text-[10px] px-2 py-0.5 rounded">Inactivo</span>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-sm truncate">{b.title || "(sin título)"}</p>
        <p className="text-xs text-gray-400 mb-2">Orden: {b.order}</p>
        <div className="flex gap-1.5 mt-auto">
          <button onClick={onEdit} className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-orange-50 text-[#E8612D] font-medium flex items-center justify-center gap-1 transition hover:bg-orange-100"><Pencil size={12} /> Editar</button>
          <button onClick={onToggle} title={b.is_active ? "Desactivar" : "Activar"} className={`text-xs px-2 py-1.5 rounded-lg transition ${b.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{b.is_active ? "Activo" : "Inactivo"}</button>
          <button onClick={onDel} title="Eliminar" className="text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

/** Editor de banner en modal (crear o editar), con vista previa en vivo. */
function BannerEditorModal({ apiBaseUrl, mode, initial, onClose, onSaved }: {
  apiBaseUrl: string; mode: "new" | "edit"; initial: any; onClose: () => void; onSaved: () => void;
}) {
  const [value, setValue] = useState<any>(initial);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!value.image_url) return alert("Subí o pegá la URL de una imagen.");
    setSaving(true);
    const payload = { title: value.title, subtitle: value.subtitle, image_url: value.image_url, link: value.link, slot: value.slot, overlay_opacity: value.overlay_opacity, order: value.order, is_active: value.is_active };
    const url = mode === "new" ? `${apiBaseUrl}/catalog/banners/` : `${apiBaseUrl}/catalog/banners/${value.id}/`;
    const r = await apiFetch(url, { method: mode === "new" ? "POST" : "PATCH", body: JSON.stringify(payload) });
    setSaving(false);
    if (r.ok) onSaved(); else { const e = await r.json().catch(() => ({})); alert("No se pudo guardar: " + JSON.stringify(e)); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 ck-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-[#1a1a2e]">{mode === "new" ? "Nuevo banner" : "Editar banner"} · {slotLabel(value.slot)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#E8612D]"><X size={20} /></button>
        </div>
        <div className="p-5">
          <BannerFields value={value} set={setValue} apiBaseUrl={apiBaseUrl} />
          <label className="flex items-center gap-2 text-sm mt-3"><input type="checkbox" checked={value.is_active} onChange={(e) => setValue({ ...value, is_active: e.target.checked })} /> Activo (visible en el catálogo)</label>
          <div className="flex gap-2 mt-5 justify-end">
            <button onClick={onClose} className="border border-gray-200 rounded-lg px-4 py-2 text-sm transition hover:bg-gray-50">Cancelar</button>
            <button onClick={save} disabled={saving} className="bg-[#E8612D] text-white rounded-lg px-5 py-2 text-sm font-medium transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50">{saving ? "Guardando…" : (mode === "new" ? "Crear banner" : "Guardar cambios")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BannersSub({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [editor, setEditor] = useState<{ mode: "new" | "edit"; value: any } | null>(null);
  const load = useCallback(() => {
    apiFetch(`${apiBaseUrl}/catalog/banners/`).then((r) => r.json()).then((d) => setRows(d.results || d || []));
  }, [apiBaseUrl]);
  useEffect(() => { load(); }, [load]);
  const del = async (id: number) => { if (!confirm("¿Eliminar este banner?")) return; await apiFetch(`${apiBaseUrl}/catalog/banners/${id}/`, { method: "DELETE" }); load(); };
  const toggle = async (b: any) => { await apiFetch(`${apiBaseUrl}/catalog/banners/${b.id}/`, { method: "PATCH", body: JSON.stringify({ is_active: !b.is_active }) }); load(); };

  return (
    <div className="space-y-7">
      <p className="text-sm text-[#6b7280] -mt-3">Elegí la ubicación del catálogo y personalizá la imagen, los textos y el contraste. Los cambios se ven al instante en el catálogo público.</p>
      {SLOTS.map((s) => {
        const list = rows.filter((b) => b.slot === s.value).sort((a, b) => a.order - b.order);
        return (
          <section key={s.value}>
            <div className="flex items-start justify-between mb-3 gap-3">
              <div>
                <h3 className="font-semibold text-[#1a1a2e]">{s.label}</h3>
                <p className="text-xs text-gray-400">Resolución recomendada: {s.res}{s.value === "hero" ? " · se muestra 1 a la vez" : " · rotan en orden"}</p>
              </div>
              <button onClick={() => setEditor({ mode: "new", value: { ...BLANK_BANNER, slot: s.value } })} className="shrink-0 flex items-center gap-1 bg-[#E8612D] text-white px-3 py-2 rounded-lg text-sm font-medium transition active:scale-[0.98] hover:brightness-105"><Plus size={15} /> Agregar</button>
            </div>
            {list.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-400">
                  {s.value === "hero" ? "Sin banner activo: el catálogo usa la imagen por defecto." : "Todavía no hay banners en esta ubicación."}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((b) => (
                  <BannerCard key={b.id} b={b}
                    onEdit={() => setEditor({ mode: "edit", value: { ...b } })}
                    onToggle={() => toggle(b)} onDel={() => del(b.id)} />
                ))}
              </div>
            )}
          </section>
        );
      })}
      {editor && (
        <BannerEditorModal apiBaseUrl={apiBaseUrl} mode={editor.mode} initial={editor.value}
          onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />
      )}
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
  const blank = { name: "", description: "", price: 0, duration_days: 30, trial_days: 0, auto_renew: true, profiles: [] as number[], is_active: true };
  const [form, setForm] = useState<any>(blank);
  const load = useCallback(() => {
    apiFetch(`${apiBaseUrl}/orders/plans/`).then((r) => r.json()).then((d) => setRows(d.results || d || []));
    apiFetch(`${apiBaseUrl}/users/admin/profiles/`).then((r) => r.json()).then((d) => setProfiles(d.results || d || []));
  }, [apiBaseUrl]);
  useEffect(() => { load(); }, [load]);
  // Un plan solo otorga perfiles de Chat bot (acceso al Tutor), excluyendo
  // perfiles de staff/admin (que también tienen tutor.acceder pero no son planes).
  const planProfiles = profiles.filter((p) => {
    const codes: string[] = (p.permissions_detail || []).map((pd: any) => pd.permission_code);
    const isChat = codes.includes("tutor.acceder");
    const isStaff = codes.some((cd) => cd.startsWith("admin.") || cd.startsWith("gestion.") || cd.startsWith("pedidosventas."));
    return isChat && !isStaff;
  });
  const create = async () => {
    if (!form.name) return alert("Poné un nombre al plan.");
    if (!form.profiles.length) return alert("Elegí qué acceso otorga el plan.");
    const r = await apiFetch(`${apiBaseUrl}/orders/plans/`, { method: "POST", body: JSON.stringify(form) });
    if (!r.ok) { return alert(JSON.stringify(await r.json())); }
    setForm(blank); load();
  };
  const del = async (id: number) => { if (!confirm("¿Eliminar este plan?")) return; await apiFetch(`${apiBaseUrl}/orders/plans/${id}/`, { method: "DELETE" }); load(); };
  const toggleProfile = (id: number) =>
    setForm((f: any) => ({ ...f, profiles: f.profiles.includes(id) ? f.profiles.filter((x: number) => x !== id) : [...f.profiles, id] }));

  const lbl = "text-xs font-medium text-gray-500";
  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      {/* Formulario */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="font-semibold text-sm">Nuevo plan</p>
        <div>
          <label className={lbl}>Nombre del plan</label>
          <input placeholder="Ej. Premium Tutor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className={lbl}>Descripción</label>
          <textarea placeholder="Breve descripción del plan (lo que verá el cliente)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full h-16 resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={lbl}>Precio ($)</label>
            <input type="number" min={0} value={form.price || ""} placeholder="0" onChange={(e) => setForm({ ...form, price: e.target.value === "" ? 0 : Number(e.target.value) })} className="border rounded-lg px-2 py-2 text-sm w-full" />
          </div>
          <div>
            <label className={lbl}>Duración (días)</label>
            <input type="number" min={1} value={form.duration_days || ""} placeholder="30" onChange={(e) => setForm({ ...form, duration_days: e.target.value === "" ? 0 : Number(e.target.value) })} className="border rounded-lg px-2 py-2 text-sm w-full" />
          </div>
          <div>
            <label className={lbl}>Prueba gratis (días)</label>
            <input type="number" min={0} value={form.trial_days || ""} placeholder="0" onChange={(e) => setForm({ ...form, trial_days: e.target.value === "" ? 0 : Number(e.target.value) })} className="border rounded-lg px-2 py-2 text-sm w-full" />
          </div>
        </div>
        <p className="text-[11px] text-gray-400">Se cobra <b>${form.price}</b> cada <b>{form.duration_days} días</b>{form.trial_days > 0 ? <> · primeros <b>{form.trial_days} días gratis</b></> : " · sin prueba"}.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.auto_renew} onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })} /> Renovar automáticamente al vencer</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Plan activo (visible para clientes)</label>
        <div>
          <label className={lbl}>¿Qué acceso otorga este plan?</label>
          <div className="space-y-1.5 mt-1">
            {planProfiles.map((p) => {
              const sel = form.profiles.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggleProfile(p.id)} className={`w-full text-left border rounded-lg px-3 py-2 transition ${sel ? "border-[#E8612D] bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <span className="text-sm font-medium flex items-center gap-2">{sel && <Check size={14} className="text-[#E8612D]" />}{p.name}</span>
                  {p.description && <span className="block text-xs text-gray-500 mt-0.5">{p.description}</span>}
                </button>
              );
            })}
            {!planProfiles.length && <p className="text-xs text-gray-400">No hay perfiles de Chat bot disponibles.</p>}
          </div>
        </div>
        <button onClick={create} className="flex items-center justify-center gap-1 bg-[#E8612D] text-white px-3 py-2 rounded-lg text-sm font-medium w-full transition active:scale-[0.98] hover:brightness-105"><Plus size={15} /> Crear plan</button>
      </div>

      {/* Listado */}
      <div className="space-y-2">
        {rows.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-sm">{p.name}{!p.is_active && <span className="text-gray-400 font-normal"> (inactivo)</span>}</p>
              <button onClick={() => del(p.id)} className="text-red-600"><Trash2 size={15} /></button>
            </div>
            <div className="text-xs text-gray-600 mt-1.5 space-y-0.5">
              <p>💲 {money(p.price)} cada {p.duration_days} días</p>
              <p>🎁 {p.trial_days > 0 ? `${p.trial_days} días de prueba gratis` : "Sin prueba"} · {p.auto_renew ? "renovación automática" : "no renueva"}</p>
              <p>🔑 Otorga: {(p.profile_names || []).join(", ") || "—"}</p>
            </div>
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
