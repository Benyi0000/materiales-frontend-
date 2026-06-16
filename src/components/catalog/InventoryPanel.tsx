import React, { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, Loader, Sparkles, X, RefreshCw, FolderPlus, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, AlertTriangle } from "lucide-react";
import ConfirmModal from "../common/ConfirmModal";

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  min_stock?: number;
  weight_kg: number;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  unit_of_sale?: string;
  unit_of_sale_display?: string;
  brand?: string;
  material?: string;
  material_display?: string;
  image_url: string;
  category: number;
  category_name: string;
  subcategory_names?: string[];
  subcategories?: number[];
  is_active: boolean;
  created_by?: number;
  created_by_username?: string;
}

// Deben coincidir con Product.UNIT_CHOICES / Product.MATERIAL_CHOICES en el backend.
const UNIT_OPTIONS = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "m", label: "Metro" },
  { value: "m2", label: "Metro cuadrado" },
  { value: "m3", label: "Metro cúbico" },
  { value: "litro", label: "Litro" },
  { value: "bolsa", label: "Bolsa" },
  { value: "rollo", label: "Rollo" },
  { value: "par", label: "Par" },
  { value: "caja", label: "Caja" },
  { value: "pallet", label: "Pallet" },
];
const MATERIAL_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "cemento", label: "Cemento / Hormigón" },
  { value: "madera", label: "Madera" },
  { value: "metal", label: "Metal / Acero" },
  { value: "plastico", label: "Plástico / PVC" },
  { value: "ceramico", label: "Cerámico" },
  { value: "vidrio", label: "Vidrio" },
  { value: "pintura", label: "Pintura / Química" },
  { value: "electrico", label: "Eléctrico" },
  { value: "otro", label: "Otro" },
];

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
  const [formMinStock, setFormMinStock] = useState("5");
  const [formLength, setFormLength] = useState("");
  const [formWidth, setFormWidth] = useState("");
  const [formHeight, setFormHeight] = useState("");
  const [formUnit, setFormUnit] = useState("unidad");
  const [formBrand, setFormBrand] = useState("");
  const [formMaterial, setFormMaterial] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Creación de categoría
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catMode, setCatMode] = useState<"top" | "sub">("sub");
  const [catParent, setCatParent] = useState<number | "">("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [catNotice, setCatNotice] = useState("");

  // Ordenamiento de la tabla
  const [ordering, setOrdering] = useState("");

  // Errores de validación del formulario (inline)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmaciones del formulario (guardar / cancelar)
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Obtener permisos y alcances del usuario actual
  const activePerms = currentUser?.active_permissions || {};
  const isSuper = currentUser?.is_superuser || false;
  
  const canCreate = isSuper || "catalogo.crear_producto" in activePerms;
  const canEdit = isSuper || "catalogo.editar_producto" in activePerms;
  const canManageStock = isSuper || "catalogo.gestionar_stock" in activePerms;
  const canDelete = isSuper || "catalogo.eliminar_producto" in activePerms;

  const editScope = activePerms["catalogo.editar_producto"] || "propios";

  // Cargar categorías y subcategorías jerárquicas
  // silent=true evita togglear loadingCategories (que reemplaza el formulario por
  // un spinner y reinicia el scroll al recargar tras crear una categoría).
  const fetchCategories = async (silent = false) => {
    if (!silent) setLoadingCategories(true);
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
      if (!silent) setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [apiBaseUrl]);

  // Paginación y búsqueda real
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProducts = async (page: number, search: string, order = ordering) => {
    setLoadingProducts(true);
    const token = localStorage.getItem("access_token");
    try {
      const url = new URL(`${apiBaseUrl}/catalog/products/`);
      url.searchParams.append("page", page.toString());
      if (search) url.searchParams.append("search", search);
      if (order) url.searchParams.append("ordering", order);

      const res = await fetch(url.toString(), {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setLocalProducts(data.results);
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 12));
        } else {
          setLocalProducts(Array.isArray(data) ? data : []);
          setTotalPages(1);
          setTotalCount(Array.isArray(data) ? data.length : 0);
        }
      }
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, appliedSearch, ordering);
  }, [apiBaseUrl, currentPage, appliedSearch, ordering]);

  // Búsqueda en vivo con debounce de 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      setAppliedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSearchClick = () => {
    setCurrentPage(1);
    setAppliedSearch(searchQuery.trim());
  };

  const handleRefresh = () => {
    refreshCatalog();
    fetchProducts(currentPage, appliedSearch, ordering);
  };

  // Click en encabezado ordenable: alterna asc/desc/sin orden
  const toggleSort = (field: string) => {
    setCurrentPage(1);
    setOrdering((cur) => (cur === field ? `-${field}` : cur === `-${field}` ? "" : field));
  };
  const sortIcon = (field: string) => {
    if (ordering === field) return <ArrowUp size={11} className="inline" />;
    if (ordering === `-${field}`) return <ArrowDown size={11} className="inline" />;
    return <ChevronsUpDown size={11} className="inline opacity-40" />;
  };

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormSku("");
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormStock("0");
    setFormMinStock("5");
    setFormWeight("");
    setFormLength("");
    setFormWidth("");
    setFormHeight("");
    setFormUnit("unidad");
    setFormBrand("");
    setFormMaterial("");
    setFormImageUrl("");
    setFormCategory("");
    setFormSubcategories([]);
    setFormErrors({});
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
    setFormMinStock((p.min_stock ?? 5).toString());
    setFormWeight(p.weight_kg.toString());
    setFormLength(p.length_cm != null ? p.length_cm.toString() : "");
    setFormWidth(p.width_cm != null ? p.width_cm.toString() : "");
    setFormHeight(p.height_cm != null ? p.height_cm.toString() : "");
    setFormUnit(p.unit_of_sale || "unidad");
    setFormBrand(p.brand || "");
    setFormMaterial(p.material || "");
    setFormImageUrl(p.image_url || "");
    setFormCategory(p.category);
    setFormSubcategories(p.subcategories || []);
    setFormErrors({});
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
  // Valida el formulario y, si está correcto, abre la confirmación de guardado.
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación inline por campo
    const errs: Record<string, string> = {};
    if (!formSku.trim()) errs.sku = "El SKU es obligatorio.";
    if (!formName.trim()) errs.name = "El nombre es obligatorio.";
    if (!formPrice || parseFloat(formPrice) <= 0) errs.price = "Ingresá un precio mayor a 0.";
    if (formStock === "" || parseInt(formStock, 10) < 0) errs.stock = "El stock no puede ser negativo.";
    if (!formCategory) errs.category = "Elegí una categoría principal.";
    if (!formDesc.trim()) errs.description = "La descripción es obligatoria.";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setConfirmSave(true);
  };

  // Ejecuta el guardado tras confirmar.
  const doSaveProduct = async () => {
    setModalLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("No estás autenticado.");
      setModalLoading(false);
      setConfirmSave(false);
      return;
    }

    const payload = {
      sku: formSku,
      name: formName,
      description: formDesc,
      price: parseFloat(formPrice),
      stock: parseInt(formStock, 10) || 0,
      min_stock: parseInt(formMinStock, 10) || 0,
      weight_kg: parseFloat(formWeight) || 1.0,
      length_cm: formLength ? parseFloat(formLength) : null,
      width_cm: formWidth ? parseFloat(formWidth) : null,
      height_cm: formHeight ? parseFloat(formHeight) : null,
      unit_of_sale: formUnit,
      brand: formBrand,
      material: formMaterial,
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
        // Recargar la lista local de la tabla (usa fetchProducts, no el prop `products`).
        if (isEditing) {
          fetchProducts(currentPage, appliedSearch, ordering);
        } else {
          // Producto nuevo: volver a la primera página sin filtros para que se vea.
          setSearchQuery("");
          setAppliedSearch("");
          setOrdering("");
          setCurrentPage(1);
          fetchProducts(1, "", "");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        // Mapear errores de campo del backend a la validación inline del formulario
        const mapped: Record<string, string> = {};
        for (const key of ["sku", "name", "price", "stock", "category", "description"]) {
          if (errData[key]) mapped[key] = Array.isArray(errData[key]) ? errData[key][0] : String(errData[key]);
        }
        if (Object.keys(mapped).length > 0) {
          setFormErrors(mapped);
        } else {
          alert(`Error al guardar: ${errData.detail || JSON.stringify(errData)}`);
        }
      }
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert("Error de conexión al guardar el producto.");
    } finally {
      setModalLoading(false);
      setConfirmSave(false);
    }
  };

  // Crear categoría (nivel superior o subcategoría)
  const openCategoryModal = () => {
    setCatName("");
    setCatMode("sub");
    setCatParent("");
    setCatError("");
    setCatNotice("");
    setShowCatModal(true);
  };

  const handleCreateCategory = async () => {
    setCatError("");
    setCatNotice("");
    if (!catName.trim()) { setCatError("Ingresá un nombre para la categoría."); return; }
    if (catMode === "sub" && !catParent) { setCatError("Elegí la categoría padre."); return; }

    setCatLoading(true);
    const token = localStorage.getItem("access_token");
    const wasSub = catMode === "sub";
    try {
      const res = await fetch(`${apiBaseUrl}/catalog/categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name: catName.trim(),
          parent: wasSub ? catParent : null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetchCategories(true);
        if (wasSub) {
          // Subcategoría: queda seleccionada como categoría principal del producto.
          setFormCategory(created.id);
          setFormSubcategories(prev => prev.includes(created.id) ? prev : [...prev, created.id]);
          setShowCatModal(false);
        } else {
          // Categoría principal creada: una principal sola no se puede asignar a un
          // producto (los productos usan subcategorías). Ofrecemos crear una dentro.
          setCatMode("sub");
          setCatParent(created.id);
          setCatName("");
          setCatNotice(`Categoría "${created.name}" creada. Agregale una subcategoría para poder asignarla a productos, o cerrá si solo querías la categoría.`);
        }
      } else {
        const e = await res.json().catch(() => ({}));
        setCatError(e.name?.[0] || e.error || "No se pudo crear la categoría.");
      }
    } catch {
      setCatError("Error de conexión al crear la categoría.");
    } finally {
      setCatLoading(false);
    }
  };

  // Eliminar/Desactivar producto — abre el modal de confirmación.
  const handleDeleteProduct = (p: Product) => setDeleteTarget(p);

  // Ejecuta la eliminación tras confirmar en el modal.
  const doDeleteProduct = async () => {
    if (!deleteTarget) return;
    const p = deleteTarget;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setDeleteLoading(true);
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
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
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
      {!showModal && (
      <>
      {/* Header del Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Gestión de Inventario</h2>
          <p className="text-xs text-[#6b7280]">Administración de catálogo de materiales, control de stock y control de acceso por alcance.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
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
          onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
          className="bg-transparent border-none outline-none text-xs text-[#1a1a2e] placeholder-gray-400 w-full"
        />
        <button 
          onClick={handleSearchClick}
          className="ml-2 text-xs font-bold text-[#E8612D] hover:underline"
        >
          Buscar
        </button>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-[#1a1a2e]">
            <thead className="bg-gray-50 text-[11px] font-bold text-[#E8612D] uppercase tracking-wider border-b border-[#e5e7eb]">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 uppercase hover:text-[#1a1a2e] transition-colors">
                    Nombre / Categoría {sortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort('price')} className="flex items-center gap-1 uppercase hover:text-[#1a1a2e] transition-colors">
                    Precio {sortIcon('price')}
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort('stock')} className="flex items-center gap-1 uppercase hover:text-[#1a1a2e] transition-colors">
                    Stock {sortIcon('stock')}
                  </button>
                </th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Creador</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {loadingProducts ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9ca3af]">
                    <Loader size={24} className="mx-auto mb-2 animate-spin" />
                    Cargando productos...
                  </td>
                </tr>
              ) : localProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9ca3af]">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                localProducts.map(p => {
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
                        <div className="text-[10px] text-[#9ca3af] mt-1.5 flex flex-wrap gap-1">
                          <span className="bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {p.category_name}
                          </span>
                          {p.subcategory_names && p.subcategory_names.map((name, idx) => (
                            name !== p.category_name && (
                              <span key={idx} className="bg-gray-100 text-[#6b7280] text-[10px] font-semibold px-2 py-0.5 rounded-full">
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

                      {/* Stock */}
                      <td className="px-6 py-4">
                        {(() => {
                          const min = p.min_stock ?? 5;
                          const out = p.stock <= 0;
                          const low = !out && p.stock <= min;
                          return (
                            <div className="flex flex-col gap-1">
                              <span className={`font-bold text-sm ${out ? "text-red-500" : low ? "text-amber-600" : "text-[#1a1a2e]"}`}>
                                {p.stock} <span className="font-normal text-[#9ca3af] text-xs">u.</span>
                              </span>
                              {out ? (
                                <span className="w-fit bg-red-50 border border-red-200 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">Sin stock</span>
                              ) : low ? (
                                <span className="w-fit bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Stock bajo</span>
                              ) : null}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        {isProductActive ? (
                          <span className="bg-green-50 border border-green-200 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="bg-red-50 border border-red-200 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                        <div className="flex justify-end gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              disabled={!isOwner}
                              title={isOwner ? "Editar producto" : "No tenés permiso sobre este producto"}
                              className={`p-2 rounded-lg transition-all ${
                                isOwner
                                  ? "text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                  : "text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Eliminar producto"
                              className="text-red-400 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
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
        
        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-500">
              Mostrando {localProducts.length} de {totalCount} productos
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-50"
              >
                Previo
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-xs border rounded ${
                        currentPage === pageNum 
                          ? 'bg-[#E8612D] text-white border-[#E8612D]' 
                          : 'border-gray-300 hover:bg-white text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 3 ||
                  pageNum === currentPage + 3
                ) {
                  return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      </>
      )}

      {/* PANTALLA DE FORMULARIO (crear / editar producto) */}
      {showModal && (
        <div className="flex flex-col gap-5 max-w-5xl w-full mx-auto">
          {/* Barra superior */}
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#6b7280] hover:text-[#E8612D] transition-colors w-fit"
          >
            <ChevronLeft size={18} /> Volver al inventario
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e] flex items-center gap-2">
              <Sparkles size={20} className="text-[#E8612D]" />
              {isEditing ? "Editar producto" : "Registrar nuevo producto"}
            </h2>
            {isEditing && <p className="text-sm text-[#6b7280] mt-1">{formName}</p>}
          </div>

          {loadingCategories ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#6b7280] text-sm">
              <Loader size={24} className="animate-spin text-[#E8612D]" />
              <span>Cargando categorías...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveProduct} className="flex flex-col gap-5 w-full">
              {/* Sección 1: Datos del producto */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-[#1a1a2e] border-b border-gray-100 pb-3">Datos del producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SKU */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">SKU (Código único)*</label>
                    <input
                      type="text"
                      placeholder="Ej: Cem-004"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      disabled={isEditing}
                      className={`bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 disabled:opacity-50 ${formErrors.sku ? "border-red-400" : "border-[#e5e7eb]"}`}
                    />
                    {formErrors.sku && <span className="text-xs text-red-500">{formErrors.sku}</span>}
                  </div>

                  {/* Nombre */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Nombre del Producto*</label>
                    <input
                      type="text"
                      placeholder="Ej: Cemento de Fraguado Rápido"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={`bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 ${formErrors.name ? "border-red-400" : "border-[#e5e7eb]"}`}
                    />
                    {formErrors.name && <span className="text-xs text-red-500">{formErrors.name}</span>}
                  </div>

                  {/* Precio */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Precio ($)*</label>
                    <input
                      type="number"
                      placeholder="Ej: 12500"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className={`bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 ${formErrors.price ? "border-red-400" : "border-[#e5e7eb]"}`}
                    />
                    {formErrors.price && <span className="text-xs text-red-500">{formErrors.price}</span>}
                  </div>

                  {/* Stock Inicial */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Stock*</label>
                    <input
                      type="number"
                      placeholder="Ej: 100"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className={`bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 ${formErrors.stock ? "border-red-400" : "border-[#e5e7eb]"}`}
                    />
                    {formErrors.stock && <span className="text-xs text-red-500">{formErrors.stock}</span>}
                  </div>

                  {/* Stock mínimo (umbral de stock bajo) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Stock mínimo (alerta)</label>
                    <input
                      type="number"
                      placeholder="Ej: 5"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                    />
                    <span className="text-xs text-[#9ca3af]">Por debajo de este valor se marca "Stock bajo".</span>
                  </div>

                  {/* Peso */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Peso (kg)*</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ej: 50.0"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                    />
                  </div>

                  {/* Unidad de venta */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Unidad de venta</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
                    >
                      {UNIT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Marca */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Marca / Fabricante</label>
                    <input
                      type="text"
                      placeholder="Ej: Loma Negra"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                    />
                  </div>

                  {/* Material principal */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Material principal</label>
                    <select
                      value={formMaterial}
                      onChange={(e) => setFormMaterial(e.target.value)}
                      className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
                    >
                      {MATERIAL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dimensiones */}
                  <div className="flex flex-col gap-1 md:col-span-3">
                    <label className="text-xs text-[#374151] font-semibold">Dimensiones (cm)</label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Largo"
                        value={formLength}
                        onChange={(e) => setFormLength(e.target.value)}
                        className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ancho"
                        value={formWidth}
                        onChange={(e) => setFormWidth(e.target.value)}
                        className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Alto"
                        value={formHeight}
                        onChange={(e) => setFormHeight(e.target.value)}
                        className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40"
                      />
                    </div>
                  </div>

                  {/* URL de Imagen con carga de archivo */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#374151] font-semibold">Imagen del Producto</label>
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
                          className="text-xs text-[#6b7280] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#fff7ed] file:text-[#E8612D] hover:file:bg-[#E8612D]/20 cursor-pointer"
                        />
                        {uploadingImage ? (
                          <span className="text-xs text-[#E8612D] flex items-center gap-1">
                            <Loader size={12} className="animate-spin" /> Subiendo...
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder="O pega la URL de la imagen..."
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 w-full mt-1"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#374151] font-semibold">Descripción Detallada*</label>
                  <textarea
                    placeholder="Escribe el detalle técnico del producto..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className={`bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder-gray-400 outline-none focus:border-[#E8612D]/40 h-20 resize-none ${formErrors.description ? "border-red-400" : "border-[#e5e7eb]"}`}
                  />
                  {formErrors.description && <span className="text-xs text-red-500">{formErrors.description}</span>}
                </div>
              </div>

              {/* Sección 2: Categorización */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-[#1a1a2e] border-b border-gray-100 pb-3">Categorización</h3>

                {/* Categoría Principal */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#374151] font-semibold">Categoría Principal de Venta*</label>
                    {canCreate && (
                      <button
                        type="button"
                        onClick={openCategoryModal}
                        className="flex items-center gap-1 text-xs font-bold text-[#E8612D] hover:underline"
                      >
                        <FolderPlus size={13} /> Nueva categoría
                      </button>
                    )}
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : "";
                      setFormCategory(val);
                      if (val !== "" && !formSubcategories.includes(val)) {
                        setFormSubcategories(prev => [...prev, val]);
                      }
                    }}
                    className={`bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D]/40 ${formErrors.category ? "border-red-400" : "border-[#e5e7eb]"}`}
                  >
                    <option value="">Seleccione una categoría...</option>
                    {categories.map(parent => (
                      (parent.subcategories && parent.subcategories.length > 0) ? (
                        <optgroup key={parent.id} label={parent.name}>
                          {parent.subcategories.map((sub: any) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </optgroup>
                      ) : null
                    ))}
                  </select>
                  {formErrors.category && <span className="text-xs text-red-500">{formErrors.category}</span>}
                </div>

                {/* Multicategorización (Subcategorías adicionales) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#374151] font-semibold">Subcategorías Adicionales (Multicategorización)</label>
                  <p className="text-xs text-[#9ca3af] mt-0.5">Seleccione todas las áreas donde desea que aparezca el producto:</p>
                  <div className="flex flex-col gap-3 bg-gray-50 border border-[#e5e7eb] rounded-xl p-3 max-h-[180px] overflow-y-auto">
                    {categories.map(parent => (
                      (parent.subcategories && parent.subcategories.length > 0) ? (
                        <div key={parent.id} className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">{parent.name}</span>
                          <div className="grid grid-cols-2 gap-1.5 pl-1">
                            {parent.subcategories.map((sub: any) => (
                              <label key={sub.id} className="flex items-center gap-2 text-xs text-[#1a1a2e] hover:text-[#E8612D] cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={formSubcategories.includes(sub.id)}
                                  onChange={() => handleToggleSubcategory(sub.id)}
                                  disabled={formCategory === sub.id}
                                  className="custom-checkbox shrink-0"
                                />
                                <span>{sub.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>

              </div>

              {/* Acciones del formulario */}
              <div className="flex flex-col items-end gap-2 pb-2">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="bg-white hover:bg-gray-50 border border-[#e5e7eb] text-[#6b7280] hover:text-[#1a1a2e] px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="bg-[#E8612D] hover:bg-[#d4551f] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {modalLoading && <Loader size={14} className="animate-spin" />}
                    <span>{isEditing ? "Guardar cambios" : "Crear producto"}</span>
                  </button>
                </div>
                {Object.keys(formErrors).length > 0 && (
                  <p className="text-sm font-medium text-red-500 flex items-center gap-1.5 animate-[fadeIn_0.2s_ease]">
                    <AlertTriangle size={15} /> Revisá los campos marcados en rojo antes de continuar.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación (reemplaza window.confirm) */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar producto"
        message={
          deleteTarget
            ? (deleteTarget.stock > 0
                ? `¿Eliminar/desactivar el producto "${deleteTarget.name}"? Si tiene ventas históricas asociadas se desactivará lógicamente de forma automática.`
                : `¿Eliminar físicamente el producto "${deleteTarget.name}"?`)
            : ''
        }
        confirmText="Eliminar"
        tone="danger"
        loading={deleteLoading}
        onConfirm={doDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmación de guardado */}
      <ConfirmModal
        open={confirmSave}
        title={isEditing ? "Guardar cambios" : "Crear producto"}
        message={isEditing
          ? "¿Estás seguro de que querés guardar los cambios de este producto?"
          : "¿Estás seguro de que querés crear este producto?"}
        confirmText="Sí, guardar"
        cancelText="Volver"
        loading={modalLoading}
        onConfirm={doSaveProduct}
        onCancel={() => setConfirmSave(false)}
      />

      {/* Confirmación de cancelar/salir */}
      <ConfirmModal
        open={confirmCancel}
        title="Descartar cambios"
        message="¿Estás seguro de que querés salir? Se perderán los cambios que no hayas guardado."
        confirmText="Sí, salir"
        cancelText="Seguir editando"
        tone="danger"
        onConfirm={() => { setConfirmCancel(false); setShowModal(false); }}
        onCancel={() => setConfirmCancel(false)}
      />

      {/* MODAL DE NUEVA CATEGORÍA */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2">
                <FolderPlus size={18} className="text-[#E8612D]" /> Nueva categoría
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-[#9ca3af] hover:text-[#1a1a2e] p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {catNotice && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-3 py-2.5 leading-relaxed">
                  {catNotice}
                </div>
              )}
              {/* Tipo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#374151] font-semibold">¿Qué querés crear?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatMode("sub")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${catMode === "sub" ? "bg-[#fff7ed] border-[#E8612D] text-[#E8612D]" : "border-[#e5e7eb] text-[#6b7280] hover:border-gray-400"}`}
                  >
                    Subcategoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatMode("top")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${catMode === "top" ? "bg-[#fff7ed] border-[#E8612D] text-[#E8612D]" : "border-[#e5e7eb] text-[#6b7280] hover:border-gray-400"}`}
                  >
                    Categoría principal
                  </button>
                </div>
                <span className="text-xs text-[#9ca3af]">
                  {catMode === "sub"
                    ? "Se crea dentro de una categoría principal y queda disponible para asignar a productos."
                    : "Categoría de nivel superior para agrupar subcategorías."}
                </span>
              </div>

              {/* Padre (solo subcategoría) */}
              {catMode === "sub" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#374151] font-semibold">Categoría padre*</label>
                  <select
                    value={catParent}
                    onChange={(e) => setCatParent(e.target.value ? parseInt(e.target.value, 10) : "")}
                    className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
                  >
                    <option value="">Seleccione la categoría padre...</option>
                    {categories.map(parent => (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nombre */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#374151] font-semibold">Nombre*</label>
                <input
                  type="text"
                  placeholder="Ej: Cementos especiales"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  autoFocus
                  className="bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
                />
              </div>

              {catError && <p className="text-xs text-red-500">{catError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowCatModal(false)}
                  className="bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] text-[#6b7280] px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  {catNotice ? "Cerrar" : "Cancelar"}
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={catLoading}
                  className="bg-[#E8612D] hover:bg-[#d4551f] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {catLoading && <Loader size={14} className="animate-spin" />}
                  {catNotice ? "Crear subcategoría" : "Crear categoría"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
