import React, { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, Loader, Sparkles, AlertTriangle, Check, X, RefreshCw } from "lucide-react";

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  weight_kg: number;
  image_url: string;
  category: number;
  category_name: string;
  subcategory_names?: string[];
  subcategories?: number[];
  is_active: boolean;
  created_by?: number;
  created_by_username?: string;
}

interface InventoryPanelProps {
  products: Product[];
  apiBaseUrl: string;
  currentUser: any;
  refreshCatalog: () => void;
}

export default function InventoryPanel({ products, apiBaseUrl, currentUser, refreshCatalog }: InventoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Estados de la Modal de Formulario
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Campos del Formulario
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCategory, setFormCategory] = useState<number | "">("");
  const [formSubcategories, setFormSubcategories] = useState<number[]>([]);

  // Estado para Ajuste Rápido de Stock
  const [adjustingStockId, setAdjustingStockId] = useState<number | null>(null);
  const [newStockVal, setNewStockVal] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Obtener permisos y alcances del usuario actual
  const activePerms = currentUser?.active_permissions || {};
  const isSuper = currentUser?.is_superuser || false;
  
  const canCreate = isSuper || "catalogo.crear_producto" in activePerms;
  const canEdit = isSuper || "catalogo.editar_producto" in activePerms;
  const canManageStock = isSuper || "catalogo.gestionar_stock" in activePerms;
  const canDelete = isSuper || "catalogo.eliminar_producto" in activePerms;

  const editScope = activePerms["catalogo.editar_producto"] || "propios";

  // Cargar categorías y subcategorías jerárquicas
  const fetchCategories = async () => {
    setLoadingCategories(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${apiBaseUrl}/catalog/categories/`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [apiBaseUrl]);

  // Obtener una lista plana de todas las subcategorías (segundo nivel)
  const getAllSubcategories = () => {
    const subs: any[] = [];
    categories.forEach(cat => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach((sub: any) => {
          subs.push(sub);
        });
      }
    });
    return subs;
  };

  // Filtrar productos según búsqueda
  const filteredProducts = products.filter(p => {
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormSku("");
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormStock("0");
    setFormWeight("");
    setFormImageUrl("");
    setFormCategory("");
    setFormSubcategories([]);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (p: Product) => {
    setIsEditing(true);
    setEditingId(p.id);
    setFormSku(p.sku);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormPrice(p.price.toString());
    setFormStock(p.stock.toString());
    setFormWeight(p.weight_kg.toString());
    setFormImageUrl(p.image_url || "");
    setFormCategory(p.category);
    setFormSubcategories(p.subcategories || []);
    setShowModal(true);
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image/png") && !file.type.match("image/jpeg") && !file.type.match("image/jpg")) {
      alert("Solo se permiten imágenes en formato PNG o JPG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo excede el tamaño máximo de 5 MB.");
      return;
    }

    setUploadingImage(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("No estás autenticado.");
      setUploadingImage(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${apiBaseUrl}/catalog/products/upload-image/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setFormImageUrl(data.image_url);
      } else {
        const errData = await res.json();
        alert(`Error al subir imagen: ${errData.error || "Error de red"}`);
      }
    } catch (err) {
      alert("Error de conexión al subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Alternar selección de subcategoría en el formulario
  const handleToggleSubcategory = (subId: number) => {
    setFormSubcategories(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  // Enviar Formulario de Creación/Edición
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim() || !formPrice || !formCategory) {
      alert("Por favor completa los campos requeridos (SKU, Nombre, Precio y Categoría principal).");
      return;
    }

    setModalLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("No estás autenticado.");
      setModalLoading(false);
      return;
    }

    const payload = {
      sku: formSku,
      name: formName,
      description: formDesc,
      price: parseFloat(formPrice),
      stock: parseInt(formStock, 10) || 0,
      weight_kg: parseFloat(formWeight) || 1.0,
      image_url: formImageUrl || `https://placehold.co/300?text=${formSku}`,
      category: formCategory,
      subcategories: formSubcategories.length > 0 ? formSubcategories : [formCategory]
    };

    const url = isEditing 
      ? `${apiBaseUrl}/catalog/products/${editingId}/` 
      : `${apiBaseUrl}/catalog/products/`;
    
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isEditing ? "Producto modificado con éxito." : "Producto registrado con éxito.");
        setShowModal(false);
        refreshCatalog();
      } else {
        const errData = await res.json();
        alert(`Error al guardar: ${JSON.stringify(errData)}`);
      }
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert("Error de conexión al guardar el producto.");
    } finally {
      setModalLoading(false);
    }
  };

  // Iniciar ajuste rápido de stock
  const startStockAdjustment = (p: Product) => {
    setAdjustingStockId(p.id);
    setNewStockVal(p.stock.toString());
    setAdjustReason("Ajuste manual de inventario");
  };

  // Enviar ajuste rápido de stock (PATCH)
  const handleSaveStockAdjustment = async () => {
    if (!newStockVal || adjustingStockId === null) return;
    setAdjustLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${apiBaseUrl}/catalog/products/${adjustingStockId}/stock/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          stock: parseInt(newStockVal, 10) || 0,
          reason: adjustReason
        })
      });

      if (res.ok) {
        alert("Stock actualizado con éxito (Se registró en los logs del servidor).");
        setAdjustingStockId(null);
        refreshCatalog();
      } else {
        const errData = await res.json();
        alert(`Error: ${JSON.stringify(errData)}`);
      }
    } catch (err) {
      alert("Error de conexión al actualizar stock.");
    } finally {
      setAdjustLoading(false);
    }
  };

  // Eliminar/Desactivar producto
  const handleDeleteProduct = async (p: Product) => {
    const actionMsg = p.stock > 0 
      ? `¿Estás seguro de que deseas eliminar/desactivar el producto '${p.name}'? Si tiene ventas históricas asociadas se desactivará lógicamente de forma automática.`
      : `¿Eliminar físicamente el producto '${p.name}'?`;

    if (!confirm(actionMsg)) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${apiBaseUrl}/catalog/products/${p.id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        if (res.status === 200) {
          const data = await res.json();
          alert(data.status || "El producto se ha desactivado lógicamente.");
        } else {
          alert("El producto se ha eliminado físicamente.");
        }
        refreshCatalog();
      } else {
        alert("Error al intentar eliminar el producto.");
      }
    } catch (err) {
      alert("Error de conexión al eliminar producto.");
    }
  };

  // Validar si el usuario puede editar este producto específico en base al alcance
  const checkProductOwnership = (p: Product) => {
    if (isSuper) return true;
    if (editScope === "todos") return true;
    // Si es propio, el id de creador del producto debe coincidir con el id del usuario actual
    return p.created_by === currentUser?.id;
  };

  return (
    <div className="flex-1 flex flex-col gap-6 text-left">
      {/* Header del Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Gestión de Inventario</h2>
          <p className="text-xs text-[#6b7280]">Administración de catálogo de materiales, control de stock y control de acceso por alcance.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshCatalog}
            className="bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] p-2.5 rounded-xl text-[#6b7280] hover:text-[#1a1a2e] transition-all"
            title="Refrescar catálogo"
          >
            <RefreshCw size={16} />
          </button>
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="bg-[#E8612D] hover:bg-[#d4551f] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={16} />
              <span>Registrar Producto</span>
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center bg-gray-50 border border-[#e5e7eb] rounded-xl px-4 py-3 max-w-md">
        <Search size={16} className="text-[#9ca3af] mr-2.5" />
        <input 
          type="text" 
          placeholder="Buscar producto por nombre o SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-[#1a1a2e] placeholder-gray-400 w-full"
        />
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-[#1a1a2e]">
            <thead className="bg-gray-50 text-[10px] font-bold text-[#E8612D] uppercase tracking-wider border-b border-[#e5e7eb]">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Nombre / Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Creador</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9ca3af]">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isOwner = checkProductOwnership(p);
                  const isProductActive = p.is_active !== false;

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-gray-50 transition-all ${
                        !isProductActive ? "opacity-50 bg-gray-50" : ""
                      }`}
                    >
                      {/* SKU */}
                      <td className="px-6 py-4 font-mono font-bold text-[#6b7280]">
                        {p.sku}
                      </td>

                      {/* Nombre y Categoría */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1a1a2e] text-sm">{p.name}</div>
                        <div className="text-[10px] text-[#9ca3af] mt-1 flex flex-wrap gap-1">
                          <span className="bg-blue-50 border border-blue-200 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                            {p.category_name}
                          </span>
                          {p.subcategory_names && p.subcategory_names.map((name, idx) => (
                            name !== p.category_name && (
                              <span key={idx} className="bg-gray-100 text-[#6b7280] text-[8px] font-bold px-1.5 py-0.5 rounded font-mono">
                                {name}
                              </span>
                            )
                          ))}
                        </div>
                      </td>

                      {/* Precio */}
                      <td className="px-6 py-4 font-bold text-[#1a1a2e] text-sm">
                        ${parseFloat(p.price.toString()).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                      </td>

                      {/* Stock (con ajuste rápido) */}
                      <td className="px-6 py-4">
                        {adjustingStockId === p.id ? (
                          <div className="flex flex-col gap-1.5 max-w-[140px] bg-gray-50 p-2 rounded-lg border border-[#e5e7eb]">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={newStockVal}
                                onChange={(e) => setNewStockVal(e.target.value)}
                                className="bg-white border border-[#e5e7eb] text-xs rounded px-1.5 py-1 text-[#1a1a2e] w-16"
                              />
                              <button
                                onClick={handleSaveStockAdjustment}
                                disabled={adjustLoading}
                                className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
                              >
                                {adjustLoading ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                              </button>
                              <button
                                onClick={() => setAdjustingStockId(null)}
                                className="bg-gray-100 hover:bg-gray-200 border border-[#e5e7eb] text-[#6b7280] p-1 rounded"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Motivo del cambio..."
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                              className="bg-white border border-[#e5e7eb] text-[9px] rounded px-1 py-0.5 text-[#6b7280]"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${p.stock <= 20 ? "text-red-500" : "text-[#1a1a2e]"}`}>
                              {p.stock} unidades
                            </span>
                            {canManageStock && (
                              <button
                                onClick={() => startStockAdjustment(p)}
                                className="text-[#E8612D]/80 hover:text-[#E8612D] text-[10px] font-semibold underline"
                              >
                                Ajustar
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        {isProductActive ? (
                          <span className="bg-green-50 border border-green-200 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="bg-red-50 border border-red-200 text-red-500 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Creador */}
                      <td className="px-6 py-4 text-[#6b7280]">
                        {p.created_by_username || <span className="text-[#9ca3af] italic">Sistema</span>}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              disabled={!isOwner}
                              title={isOwner ? "Editar producto" : "No tienes permisos sobre este producto ajeno"}
                              className={`p-1.5 rounded transition-all ${
                                isOwner 
                                  ? "text-blue-500 hover:bg-blue-50 hover:text-blue-600" 
                                  : "text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Eliminar o desactivar producto"
                              className="text-red-400 hover:bg-red-50 hover:text-red-500 p-1.5 rounded transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-[#e5e7eb] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden relative text-left">
            {/* Header Fijo */}
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex justify-between items-center bg-white shrink-0 z-10">
              <h3 className="text-lg font-bold text-[#E8612D] flex items-center gap-2">
                <Sparkles size={18} />
                <span>{isEditing ? `Editar Producto: ${formName}` : "Registrar Nuevo Producto"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#9ca3af] hover:text-[#1a1a2e] transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="p-6 overflow-y-auto flex-1">

            {loadingCategories ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#6b7280] text-xs">
                <Loader size={24} className="animate-spin text-[#E8612D]" />
                <span>Cargando categorías...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SKU */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b7280] font-bold uppercase">SKU (Código único)*</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Cem-004"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      disabled={isEditing}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 disabled:opacity-50"
                    />
                  </div>

                  {/* Nombre */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b7280] font-bold uppercase">Nombre del Producto*</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Cemento de Fraguado Rápido"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                    />
                  </div>

                  {/* Precio */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b7280] font-bold uppercase">Precio ($)*</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 12500"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                    />
                  </div>

                  {/* Stock Inicial */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b7280] font-bold uppercase">Stock*</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 100"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                    />
                  </div>

                  {/* Peso */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b7280] font-bold uppercase">Peso (kg)*</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ej: 50.0"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                    />
                  </div>

                  {/* URL de Imagen con carga de archivo */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b7280] font-bold uppercase">Imagen del Producto</label>
                    <div className="flex items-center gap-3">
                      {formImageUrl && (
                        <div className="w-12 h-12 rounded-lg border border-[#e5e7eb] overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                          <img 
                            src={formImageUrl} 
                            alt="Preview" 
                            className="object-cover w-full h-full"
                            onError={(e) => { e.currentTarget.src = "https://placehold.co/100?text=Error"; }}
                          />
                        </div>
                      )}
                      <div className="flex-grow flex flex-col gap-1">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleImageUpload}
                          className="text-xs text-[#6b7280] file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#fff7ed] file:text-[#E8612D] hover:file:bg-[#E8612D]/20 cursor-pointer"
                        />
                        {uploadingImage ? (
                          <span className="text-[9px] text-[#E8612D] flex items-center gap-1">
                            <Loader size={10} className="animate-spin" /> Subiendo...
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder="O pega la URL de la imagen..."
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-[10px] text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 w-full mt-1"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6b7280] font-bold uppercase">Descripción Detallada*</label>
                  <textarea
                    required
                    placeholder="Escribe el detalle técnico del producto..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 h-20 resize-none"
                  />
                </div>

                {/* Categoría Principal */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6b7280] font-bold uppercase">Categoría Principal de Venta*</label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : "";
                      setFormCategory(val);
                      if (val !== "" && !formSubcategories.includes(val)) {
                        setFormSubcategories(prev => [...prev, val]);
                      }
                    }}
                    className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
                  >
                    <option value="">Seleccione una categoría...</option>
                    {getAllSubcategories().map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Multicategorización (Subcategorías adicionales) */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-[#6b7280] font-bold uppercase">Subcategorías Adicionales (Multicategorización)</label>
                  <p className="text-[9px] text-[#9ca3af] mt-0.5">Seleccione todas las áreas donde desea que aparezca el producto:</p>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 border border-[#e5e7eb] rounded-xl p-3 max-h-[120px] overflow-y-auto">
                    {getAllSubcategories().map(sub => (
                      <label key={sub.id} className="flex items-center gap-2.5 text-xs text-[#1a1a2e] hover:text-[#E8612D] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formSubcategories.includes(sub.id)}
                          onChange={() => handleToggleSubcategory(sub.id)}
                          disabled={formCategory === sub.id} // Obligatoria la seleccionada en el dropdown
                          className="custom-checkbox shrink-0"
                        />
                        <span>{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-end gap-2 border-t border-[#e5e7eb] pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] text-[#6b7280] hover:text-[#1a1a2e] px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="bg-[#E8612D] hover:bg-[#d4551f] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {modalLoading && <Loader size={14} className="animate-spin" />}
                    <span>{isEditing ? "Guardar Cambios" : "Crear Producto"}</span>
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
