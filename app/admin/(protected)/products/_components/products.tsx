"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Translate = (
  key: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) => string;

async function readApiResponse<T = Record<string, unknown>>(
  response: Response,
  t: Translate,
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    if (response.redirected || response.url.includes("/admin/login")) {
      throw new Error(t("products.sessionExpired"));
    }

    if (response.status === 404) {
      throw new Error(t("products.apiNotFound"));
    }

    throw new Error(
      t("products.nonJsonResponse", {
        status: response.status,
        details: responseText.slice(0, 200),
      }),
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(t("products.invalidJson"));
  }
}

interface Product {
  _id?: string;
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  status: "active" | "inactive";
  sizes?: string[];
  colors?: string[];
  rating?: number;
}

export default function Products() {
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    image: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  /* ============================================================
     LOAD PRODUCTS
  ============================================================ */

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/products", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readApiResponse<{
        products?: Product[];
        error?: string;
        message?: string;
      }>(response, t);

      if (!response.ok) {
        throw new Error(data.error || data.message || t("products.loadFailed"));
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("products.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     CATEGORY TRANSLATIONS
  ============================================================ */

  const categories = [
    "All",
    ...Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter((item) => item.trim() !== ""),
      ),
    ),
  ];

  /**
   * Map database category values to translation keys.
   * Original database values are never changed.
   */
  const categoryTranslationKeys: Record<string, string> = {
    all: "categories.all",
    "all products": "categories.all",
    drinks: "categories.drinks",
    cakes: "categories.cakes",
    bakery: "categories.bakery",
    beers: "categories.beers",
    beer: "categories.beers",
  };

  const translateCategory = (value: string) => {
    const normalized = value.trim().toLowerCase();

    if (normalized === "all") {
      return t("products.allCategories");
    }

    const translationKey = categoryTranslationKeys[normalized];

    if (!translationKey) {
      return value;
    }

    const translated = t(translationKey);

    return translated === translationKey ? value : translated;
  };

  /* ============================================================
     FILTER PRODUCTS
  ============================================================ */

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      product.name.toLowerCase().includes(searchText) ||
      product.sku.toLowerCase().includes(searchText);

    const matchesCategory = category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  /* ============================================================
     TRANSLATE STATUS
  ============================================================ */

  const translateStatus = (status: string) => {
    if (status === "active") return t("products.active");
    if (status === "inactive") return t("products.inactive");

    return status;
  };

  /* ============================================================
     OPEN ADD MODAL
  ============================================================ */

  const openAddModal = () => {
    setEditingProduct(null);

    setForm({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
      image: "",
      description: "",
      status: "active",
    });

    setIsModalOpen(true);
  };

  /* ============================================================
     OPEN EDIT MODAL
  ============================================================ */

  const openEditModal = (product: Product) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || "",
      description: product.description || "",
      status: product.status,
    });

    setIsModalOpen(true);
  };

  /* ============================================================
     CLOSE MODAL
  ============================================================ */

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  /* ============================================================
     FORM CHANGE
  ============================================================ */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ============================================================
     IMAGE UPLOAD
  ============================================================ */

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("products.selectValidImage"));
      e.target.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(t("products.imageTooLarge"));
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      }
    };

    reader.onerror = () => {
      alert(t("products.imageReadFailed"));
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  /* ============================================================
     REMOVE IMAGE
  ============================================================ */

  const removeImage = () => {
    setForm((prev) => ({
      ...prev,
      image: "",
    }));
  };

  /* ============================================================
     CREATE / UPDATE PRODUCT
  ============================================================ */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      setError(t("products.completeRequired"));
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!Number.isFinite(price) || price < 0) {
      setError(t("products.validPrice"));
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError(t("products.validStock"));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category.trim(),
        price,
        stock,
        image: form.image.trim(),
        description: form.description.trim(),
        status: form.status,
        sizes: [],
        colors: [],
      };

      const response = await fetch(
        editingProduct
          ? `/api/admin/products/${editingProduct.id}`
          : "/api/admin/products",
        {
          method: editingProduct ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await readApiResponse<{
        error?: string;
        message?: string;
      }>(response, t);

      if (!response.ok) {
        throw new Error(data.error || data.message || t("products.saveFailed"));
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("products.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE PRODUCT
  ============================================================ */

  const deleteProduct = async (id: number) => {
    if (!window.confirm(t("products.confirmDelete"))) return;

    try {
      setError("");

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const data = await readApiResponse<{
        error?: string;
        message?: string;
      }>(response, t);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || t("products.deleteFailed"),
        );
      }

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("products.deleteFailed"));
    }
  };

  /* ============================================================
     IMAGE ERROR HANDLER
  ============================================================ */

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <div className="min-w-0 w-full">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* HEADER */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold sm:text-2xl">
            {t("products.title")}
          </h1>

          <p className="text-sm text-muted-foreground">
            {t("products.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t("products.addProduct")}
        </button>
      </div>

      {/* SEARCH + FILTER */}

      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("products.searchPlaceholder")}
            className="h-10 w-full min-w-0 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 sm:w-48"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {translateCategory(item)}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="mb-4 rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      )}

      {/* DESKTOP TABLE */}

      <div className="hidden w-full max-w-full overflow-x-auto rounded-xl border bg-background md:block">
        <table className="w-full min-w-[800px]">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">
                {t("products.product")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                {t("products.sku")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                {t("products.category")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                {t("common.price")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                {t("products.stock")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                {t("common.status")}
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                {t("common.actions")}
              </th>
            </tr>
          </thead>

          <tbody>
            {!loading && filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {t("products.noProducts")}
                </td>
              </tr>
            ) : loading ? null : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {product.description || t("products.noDescription")}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm">{product.sku}</td>

                  <td className="px-4 py-3 text-sm">
                    {translateCategory(product.category)}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    ${product.price.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-sm">{product.stock}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {translateStatus(product.status)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="rounded-lg p-2 hover:bg-muted"
                        aria-label={`${t("common.edit")} ${product.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label={`${t("common.delete")} ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}

      <div className="grid min-w-0 grid-cols-1 gap-3 md:hidden">
        {!loading && filteredProducts.length === 0 ? (
          <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
            {t("products.noProducts")}
          </div>
        ) : loading ? null : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="min-w-0 rounded-xl border bg-background p-4"
            >
              <div className="flex min-w-0 gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{product.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {translateStatus(product.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {t("products.category")}
                      </span>
                      <p className="truncate font-medium">
                        {translateCategory(product.category)}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        {t("common.price")}
                      </span>
                      <p className="font-medium">${product.price.toFixed(2)}</p>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        {t("products.stock")}
                      </span>
                      <p className="font-medium">{product.stock}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                    >
                      <Edit className="h-4 w-4" />
                      {t("common.edit")}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProduct(product.id)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PRODUCT DIALOG */}

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);

          if (!open) {
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden p-0 sm:w-[calc(100%-2rem)]">
          <DialogHeader className="shrink-0 border-b px-4 py-4 text-left sm:px-6">
            <DialogTitle className="truncate text-lg sm:text-xl">
              {editingProduct
                ? t("products.editProduct")
                : t("products.addProduct")}
            </DialogTitle>

            <DialogDescription className="truncate text-xs sm:text-sm">
              {editingProduct
                ? t("products.updateProductInfo")
                : t("products.createProduct")}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(100dvh-180px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
          >
            <div className="space-y-4">
              {/* NAME + SKU */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">
                    {t("products.productName")}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t("products.enterProductName")}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2"
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="sku" className="text-sm font-medium">
                    {t("products.sku")}
                  </label>
                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder={t("products.enterSku")}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2"
                  />
                </div>
              </div>

              {/* CATEGORY + PRICE */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="category" className="text-sm font-medium">
                    {t("products.category")}
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    value={form.category}
                    onChange={handleChange}
                    placeholder={t("products.enterCategory")}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2"
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="price" className="text-sm font-medium">
                    {t("common.price")}
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2"
                  />
                </div>
              </div>

              {/* STOCK + STATUS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="stock" className="text-sm font-medium">
                    {t("products.stock")}
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="0"
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2"
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="status" className="text-sm font-medium">
                    {t("common.status")}
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2"
                  >
                    <option value="active">{t("products.active")}</option>
                    <option value="inactive">{t("products.inactive")}</option>
                  </select>
                </div>
              </div>

              {/* IMAGE UPLOAD */}

              <div className="min-w-0 space-y-2">
                <label className="text-sm font-medium">
                  {t("products.image")}
                </label>

                <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {form.image ? (
                      <>
                        <img
                          src={form.image}
                          alt="Product preview"
                          className="h-full w-full object-cover"
                          onError={handleImageError}
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                          aria-label={t("products.deleteImage")}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <label
                      htmlFor="product-image-upload"
                      className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-background px-3 text-sm font-medium hover:bg-muted"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {t("products.uploadImage")}
                    </label>

                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    <input
                      id="image"
                      name="image"
                      type="url"
                      value={form.image.startsWith("data:") ? "" : form.image}
                      onChange={handleChange}
                      placeholder={t("products.pasteImageUrl")}
                      className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2"
                    />

                    <p className="text-xs text-muted-foreground">
                      {t("products.imageHelp")}
                    </p>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="min-w-0 space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium">
                  {t("common.description")}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t("products.enterDescription")}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* FOOTER */}

            <DialogFooter className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 w-full rounded-lg border px-4 text-sm font-medium hover:bg-muted sm:w-auto"
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="h-10 w-full rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving
                  ? t("products.saving")
                  : editingProduct
                    ? t("products.updateProduct")
                    : t("products.addProduct")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
