"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { matchCategoryKey } from "@/app/components/menu/constants";

const ITEM_COLUMNS =
  "item_id, category_id, name, description, price, is_alcoholic, image_url, available";

const emptyAddForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  is_alcoholic: false,
};

const emptyEditForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  is_alcoholic: false,
  image_url: "",
};

export default function MenuEditorContent() {
  const [items, setItems] = useState(null); // null = loading
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(emptyAddForm);
  const [saving, setSaving] = useState(false);

  const upload = useSupabaseUpload({
    bucketName: "menu-images",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 5 * 1000 * 1000,
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editOriginalHadImage, setEditOriginalHadImage] = useState(false);

  const editUpload = useSupabaseUpload({
    bucketName: "menu-images",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 5 * 1000 * 1000,
  });

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [categoryRes, itemRes] = await Promise.all([
        supabase.from("category").select("category_id, name").order("name"),
        supabase.from("menu_item").select(ITEM_COLUMNS).order("name"),
      ]);

      if (!mounted) return;

      if (categoryRes.error) setError(categoryRes.error.message);
      if (itemRes.error) setError(itemRes.error.message);

      setCategories(categoryRes.data ?? []);
      setItems(itemRes.data ?? []);

      if (categoryRes.data?.length) {
        setForm((f) => (f.category_id ? f : { ...f, category_id: categoryRes.data[0].category_id }));
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const uploadedImageUrl = useMemo(() => {
    if (!upload.isSuccess || upload.successes.length === 0) return null;
    return supabase.storage
      .from("menu-images")
      .getPublicUrl(upload.successes[0]).data.publicUrl;
  }, [upload.isSuccess, upload.successes]);

  const editUploadedImageUrl = useMemo(() => {
    if (!editUpload.isSuccess || editUpload.successes.length === 0) return null;
    return supabase.storage
      .from("menu-images")
      .getPublicUrl(editUpload.successes[0]).data.publicUrl;
  }, [editUpload.isSuccess, editUpload.successes]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.category_id, c.name]));
    return (id) => map.get(id) || "—";
  }, [categories]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      const matchesCategory =
        filterCategory === "All" || item.category_id === filterCategory;
      const matchesSearch =
        !term || item.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, filterCategory]);

  const isAddBeverage =
    matchCategoryKey(categoryName(form.category_id)) === "beverages";
  const isEditBeverage =
    matchCategoryKey(categoryName(editForm.category_id)) === "beverages";

  function pushToast(message, variant = "success") {
    const id = toastIdRef.current++;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 3500);
  }

  function closeConfirm() {
    if (confirmBusy) return;
    setConfirm(null);
  }

  async function runConfirm() {
    if (!confirm) return;
    setConfirmBusy(true);
    const ok = await confirm.onConfirm();
    setConfirmBusy(false);
    if (ok) setConfirm(null);
  }

  async function performAddItem() {
    setSaving(true);
    setError(null);

    try {
      let imageUrl = uploadedImageUrl;

      if (!imageUrl && upload.files.length > 0 && !upload.isSuccess) {
        const result = await upload.onUpload();
        if (result?.errors?.length > 0) {
          throw new Error(result.errors[0].message || "Image upload failed.");
        }
        if (result?.successes?.length > 0) {
          imageUrl = supabase.storage
            .from("menu-images")
            .getPublicUrl(result.successes[result.successes.length - 1])
            .data.publicUrl;
        }
      }

      const { data, error: insertError } = await supabase
        .from("menu_item")
        .insert({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category_id: form.category_id,
          is_alcoholic: isAddBeverage ? form.is_alcoholic : false,
          image_url: imageUrl,
          available: true,
        })
        .select(ITEM_COLUMNS)
        .single();

      if (insertError) throw insertError;

      setItems((current) =>
        [...(current ?? []), data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      pushToast(`"${data.name}" added to the menu.`, "success");

      setForm({ ...emptyAddForm, category_id: form.category_id });
      upload.setFiles([]);
      return true;
    } catch (err) {
      setError(err.message);
      pushToast(err.message || "Failed to add item.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleAddItem(e) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.category_id ||
      form.price === "" ||
      !form.description.trim()
    ) {
      pushToast(
        "Name, category, price, and description are all required.",
        "error",
      );
      return;
    }

    setConfirm({
      title: "Confirm New Item",
      message: `Add "${form.name.trim()}" to the menu for R${Number(form.price).toFixed(2)}?`,
      confirmLabel: "Add Item",
      danger: false,
      onConfirm: performAddItem,
    });
  }

  async function performDeleteItem(item) {
    setError(null);
    const previous = items;
    setItems((current) => (current ?? []).filter((i) => i.item_id !== item.item_id));

    const { error: deleteError } = await supabase
      .from("menu_item")
      .delete()
      .eq("item_id", item.item_id);

    if (deleteError) {
      setError(deleteError.message);
      setItems(previous);
      pushToast(deleteError.message || "Failed to remove item.", "error");
      return false;
    }

    pushToast(`"${item.name}" removed from the menu.`, "success");
    return true;
  }

  function requestDeleteItem(item) {
    setConfirm({
      title: "Delete Menu Item",
      message: `Delete "${item.name}" permanently? This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => performDeleteItem(item),
    });
  }

  function startEdit(item) {
    setEditingId(item.item_id);
    setEditForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category_id: item.category_id,
      is_alcoholic: item.is_alcoholic,
      image_url: item.image_url || "",
    });
    setEditOriginalHadImage(!!item.image_url);
    editUpload.setFiles([]);
  }

  function cancelEdit() {
    setEditingId(null);
    editUpload.setFiles([]);
  }

  async function performSaveEdit(item_id) {
    setError(null);

    let imageUrl = editForm.image_url.trim() || editUploadedImageUrl;

    if (!imageUrl && editUpload.files.length > 0 && !editUpload.isSuccess) {
      const result = await editUpload.onUpload();
      if (result?.errors?.length > 0) {
        pushToast(result.errors[0].message || "Image upload failed.", "error");
        return false;
      }
      if (result?.successes?.length > 0) {
        imageUrl = supabase.storage
          .from("menu-images")
          .getPublicUrl(result.successes[result.successes.length - 1])
          .data.publicUrl;
      }
    }

    if (editOriginalHadImage && !imageUrl) {
      pushToast(
        "This item had an image — upload a replacement, or cancel to keep the original.",
        "error",
      );
      return false;
    }

    const { data, error: updateError } = await supabase
      .from("menu_item")
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price),
        category_id: editForm.category_id,
        is_alcoholic: isEditBeverage ? editForm.is_alcoholic : false,
        image_url: imageUrl || null,
      })
      .eq("item_id", item_id)
      .select(ITEM_COLUMNS)
      .single();

    if (updateError) {
      setError(updateError.message);
      pushToast(updateError.message || "Failed to update item.", "error");
      return false;
    }

    setItems((current) =>
      (current ?? []).map((i) => (i.item_id === item_id ? data : i)),
    );
    pushToast(`"${data.name}" updated.`, "success");
    setEditingId(null);
    editUpload.setFiles([]);
    return true;
  }

  function handleSaveEdit(item_id) {
    if (
      !editForm.name.trim() ||
      !editForm.category_id ||
      editForm.price === "" ||
      !editForm.description.trim()
    ) {
      pushToast(
        "Name, category, price, and description are all required.",
        "error",
      );
      return;
    }

    if (
      editOriginalHadImage &&
      !editForm.image_url &&
      editUpload.files.length === 0
    ) {
      pushToast(
        "This item had an image — upload a replacement, or cancel to keep the original.",
        "error",
      );
      return;
    }

    setConfirm({
      title: "Confirm Changes",
      message: `Save changes to "${editForm.name.trim()}"?`,
      confirmLabel: "Save Changes",
      danger: false,
      onConfirm: () => performSaveEdit(item_id),
    });
  }

  async function handleToggleArchive(item) {
    setError(null);
    const nextAvailable = !item.available;

    const { data, error: toggleError } = await supabase
      .from("menu_item")
      .update({ available: nextAvailable })
      .eq("item_id", item.item_id)
      .select(ITEM_COLUMNS)
      .single();

    if (toggleError) {
      setError(toggleError.message);
      pushToast(toggleError.message || "Failed to update item.", "error");
      return;
    }

    setItems((current) =>
      (current ?? []).map((i) => (i.item_id === item.item_id ? data : i)),
    );
    pushToast(
      nextAvailable
        ? `"${item.name}" is visible on the menu again.`
        : `"${item.name}" archived — hidden from the menu.`,
      "success",
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
            <UtensilsCrossed size={17} />
            <span>Tools · Menu Editor</span>
          </div>

          <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
            Menu Editor
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#A0A0A0] md:text-base">
            Add, edit, archive, or remove dishes and drinks. Changes here
            apply to the live menu_item table, so they show up immediately on
            the customer menu and menu builder.
          </p>
        </motion.div>

        {error && (
          <div className="mt-6 border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ADD ITEM FORM */}
        <form
          onSubmit={handleAddItem}
          className="mt-10 grid grid-cols-1 gap-4 border border-[#1F1F1F] bg-[#101010] p-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <div className="lg:col-span-3">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-[#D4AF37]">
              Add New Item
            </h2>
          </div>

          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#666666] focus:border-[#D4AF37] focus:outline-none"
          />

          <select
            value={form.category_id}
            onChange={(e) => {
              const nextCategoryId = e.target.value;
              const nextIsBeverage =
                matchCategoryKey(categoryName(nextCategoryId)) === "beverages";
              setForm((f) => ({
                ...f,
                category_id: nextCategoryId,
                is_alcoholic: nextIsBeverage ? f.is_alcoholic : false,
              }));
            }}
            required
            className="rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id} className="bg-[#0A0A0A]">
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Price (R)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            className="rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#666666] focus:border-[#D4AF37] focus:outline-none"
          />

          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            className="lg:col-span-2 rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#666666] focus:border-[#D4AF37] focus:outline-none"
          />

          {isAddBeverage && (
            <label className="flex items-center gap-2 text-sm text-[#A0A0A0]">
              <input
                type="checkbox"
                checked={form.is_alcoholic}
                onChange={(e) =>
                  setForm({ ...form, is_alcoholic: e.target.checked })
                }
                className="accent-[#D4AF37]"
              />
              Alcoholic
            </label>
          )}

          <div className="flex flex-col gap-2 lg:col-span-3">
            <span className="text-xs uppercase tracking-wider text-[#666666]">
              Image
            </span>
            <Dropzone {...upload} className="border-[#333333] bg-white/5">
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#D4AF37] bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-50 lg:col-span-3"
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add Item"}
          </button>
        </form>

        {/* CATEGORY + SEARCH TOOLBAR */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 border border-[#1F1F1F] bg-white/5 px-4 py-2 sm:w-72">
            <Search size={15} className="text-[#666666]" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-[#666666] focus:outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none sm:w-56"
          >
            <option value="All" className="bg-[#0A0A0A]">
              All Categories
            </option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id} className="bg-[#0A0A0A]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* ITEM LIST */}
        <div className="mt-6">
          {items === null ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl border border-[#1F1F1F] bg-white/5"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="border border-[#202020] bg-[#101010] px-6 py-20 text-center">
              <p className="text-sm text-[#666666]">
                No menu items yet. Add one above.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="border border-[#202020] bg-[#101010] px-6 py-20 text-center">
              <p className="text-sm text-[#666666]">
                No items match your search or category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.item_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`border border-[#1F1F1F] bg-[#101010] ${
                      editingId === item.item_id
                        ? "p-5 sm:col-span-2 xl:col-span-3"
                        : "flex flex-col"
                    }`}
                  >
                    {editingId === item.item_id ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                        <select
                          value={editForm.category_id}
                          onChange={(e) => {
                            const nextCategoryId = e.target.value;
                            const nextIsBeverage =
                              matchCategoryKey(categoryName(nextCategoryId)) ===
                              "beverages";
                            setEditForm((f) => ({
                              ...f,
                              category_id: nextCategoryId,
                              is_alcoholic: nextIsBeverage ? f.is_alcoholic : false,
                            }));
                          }}
                          className="rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                        >
                          {categories.map((c) => (
                            <option
                              key={c.category_id}
                              value={c.category_id}
                              className="bg-[#0A0A0A]"
                            >
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({ ...editForm, price: e.target.value })
                          }
                          className="rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          className="lg:col-span-2 rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                        <div className="flex flex-col gap-2 lg:col-span-3">
                          <span className="text-xs uppercase tracking-wider text-[#666666]">
                            Image
                          </span>
                          {editForm.image_url ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={editForm.image_url}
                                alt=""
                                className="h-16 w-16 rounded-lg border border-[#1F1F1F] object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm({ ...editForm, image_url: "" })
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs uppercase tracking-wider text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 size={13} />
                                Remove Image
                              </button>
                            </div>
                          ) : (
                            <>
                              <Dropzone
                                {...editUpload}
                                className="border-[#333333] bg-white/5"
                              >
                                <DropzoneEmptyState />
                                <DropzoneContent />
                              </Dropzone>
                              {editOriginalHadImage && (
                                <p className="text-xs text-amber-400">
                                  Upload a replacement image before saving, or
                                  cancel to keep the original.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        {isEditBeverage && (
                          <label className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                            <input
                              type="checkbox"
                              checked={editForm.is_alcoholic}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  is_alcoholic: e.target.checked,
                                })
                              }
                              className="accent-[#D4AF37]"
                            />
                            Alcoholic
                          </label>
                        )}

                        <div className="flex gap-2 lg:col-span-3">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.item_id)}
                            className="flex items-center gap-2 rounded-lg border border-[#D4AF37] bg-[#D4AF37] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black"
                          >
                            <Check size={14} />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex items-center gap-2 rounded-lg border border-[#333333] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#A0A0A0]"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border-b border-[#1F1F1F] bg-white/5">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#555555]">
                              <UtensilsCrossed size={28} />
                            </div>
                          )}
                          {!item.available && (
                            <span className="absolute left-2 top-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-300 backdrop-blur-sm">
                              Archived
                            </span>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-serif text-lg text-white">
                              {item.name}
                            </h3>
                            <span className="shrink-0 text-sm text-[#D4AF37]">
                              R{Number(item.price).toFixed(2)}
                            </span>
                          </div>

                          <span className="mt-1 w-fit rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#888888]">
                            {categoryName(item.category_id)}
                            {item.is_alcoholic && " · Alcoholic"}
                          </span>

                          {item.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-[#888888]">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-auto flex flex-wrap gap-2 pt-4">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="flex items-center gap-1.5 rounded-lg border border-[#333333] px-3 py-2 text-xs uppercase tracking-wider text-[#A0A0A0] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(item)}
                              className="flex items-center gap-1.5 rounded-lg border border-[#333333] px-3 py-2 text-xs uppercase tracking-wider text-[#A0A0A0] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                            >
                              {item.available ? (
                                <>
                                  <Archive size={13} />
                                  Archive
                                </>
                              ) : (
                                <>
                                  <ArchiveRestore size={13} />
                                  Restore
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteItem(item)}
                              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs uppercase tracking-wider text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* TOASTS */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${
                toast.variant === "error"
                  ? "border-red-500/30 bg-red-950/80 text-red-200"
                  : "border-[#D4AF37]/30 bg-[#151515]/95 text-white"
              }`}
            >
              {toast.variant === "error" ? (
                <AlertCircle size={16} className="text-red-300" />
              ) : (
                <CheckCircle2 size={16} className="text-[#D4AF37]" />
              )}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={closeConfirm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md border border-[#1F1F1F] bg-[#101010] p-6"
            >
              <div
                className={`flex items-center gap-2 text-sm uppercase tracking-wider ${
                  confirm.danger ? "text-red-400" : "text-[#D4AF37]"
                }`}
              >
                <AlertTriangle size={16} />
                {confirm.title}
              </div>

              <p className="mt-3 text-sm leading-6 text-[#A0A0A0]">
                {confirm.message}
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={confirmBusy}
                  onClick={closeConfirm}
                  className="rounded-lg border border-[#333333] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmBusy}
                  onClick={runConfirm}
                  className={`rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 ${
                    confirm.danger
                      ? "border-red-500 bg-red-500 text-black hover:opacity-90"
                      : "border-[#D4AF37] bg-[#D4AF37] text-black hover:opacity-90"
                  }`}
                >
                  {confirmBusy ? "Working..." : confirm.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
