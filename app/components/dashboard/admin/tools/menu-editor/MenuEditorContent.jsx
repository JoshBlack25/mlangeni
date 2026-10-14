"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Pencil,
  Check,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { matchCategoryKey } from "@/app/components/menu/constants";
import { useMediaQuery } from "@/app/components/dashboard/shared/useMediaQuery";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogDescription,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Select,
  SkeletonRows,
  StatusBadge,
  formatCurrency,
  NOT_SET,
  SearchInput,
} from "@/app/components/dashboard/ui";

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

  // Render the table or the stacked list, never both, so the inline edit form
  // (and its dropzone) exists only once.
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
    return (id) => map.get(id) || NOT_SET;
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
        "This item had an image. Upload a replacement, or cancel to keep the original.",
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
        "This item had an image. Upload a replacement, or cancel to keep the original.",
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
        : `"${item.name}" archived and hidden from the menu.`,
      "success",
    );
  }

  const dropzoneClass =
    "rounded-control border border-dashed border-mgh-line-strong bg-mgh-surface-2/50 p-5 text-mgh-muted";

  function renderEditForm(item) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Name" required>
          <Input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
        </Field>
        <Field label="Category" required>
          <Select
            value={editForm.category_id}
            onChange={(e) => {
              const nextCategoryId = e.target.value;
              const nextIsBeverage =
                matchCategoryKey(categoryName(nextCategoryId)) === "beverages";
              setEditForm((f) => ({
                ...f,
                category_id: nextCategoryId,
                is_alcoholic: nextIsBeverage ? f.is_alcoholic : false,
              }));
            }}
          >
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id} className="bg-mgh-bg">
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Price (R)" required>
          <Input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className="tabular-nums"
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
          />
        </Field>
        <Field label="Description" required className="md:col-span-2">
          <Input
            type="text"
            value={editForm.description}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                description: e.target.value,
              })
            }
          />
        </Field>
        {isEditBeverage && (
          <label className="flex min-h-10 items-center gap-2 self-end text-sm text-mgh-muted">
            <input
              type="checkbox"
              checked={editForm.is_alcoholic}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  is_alcoholic: e.target.checked,
                })
              }
              className="size-4 accent-mgh-gold"
            />
            Alcoholic
          </label>
        )}
        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
          <span className="text-[13px] font-medium text-mgh-muted">Image</span>
          {editForm.image_url ? (
            <div className="flex items-center gap-3">
              <Image
                src={editForm.image_url}
                alt=""
                width={64}
                height={64}
                className="size-16 rounded-control border border-mgh-line object-cover"
              />
              <Button
                size="sm"
                variant="danger"
                onClick={() => setEditForm({ ...editForm, image_url: "" })}
              >
                <Trash2 size={14} aria-hidden="true" />
                Remove Image
              </Button>
            </div>
          ) : (
            <>
              <Dropzone {...editUpload} className={dropzoneClass}>
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>
              {editOriginalHadImage && (
                <p className="text-caption text-mgh-warn">
                  Upload a replacement image before saving, or cancel to keep
                  the original.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row md:col-span-2 lg:col-span-3">
          <Button variant="quiet" onClick={cancelEdit} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSaveEdit(item.item_id)}
            className="w-full sm:w-auto"
          >
            <Check size={16} aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  function renderThumb(item) {
    return item.image_url ? (
      <Image
        src={item.image_url}
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-control border border-mgh-line object-cover"
      />
    ) : (
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-control border border-mgh-line bg-mgh-surface-2 text-mgh-dim"
      >
        <UtensilsCrossed size={16} />
      </span>
    );
  }

  function renderCategory(item) {
    return (
      <span className="text-mgh-muted">
        {categoryName(item.category_id)}
        {item.is_alcoholic && " · Alcoholic"}
      </span>
    );
  }

  function renderAvailability(item) {
    return item.available ? (
      <StatusBadge status="available" label="Available" tone="ok" />
    ) : (
      <StatusBadge status="archived" label="Archived" tone="quiet" />
    );
  }

  function renderActions(item) {
    return (
      <div className="flex flex-wrap items-center gap-1 md:justify-end">
        <Button size="sm" variant="quiet" onClick={() => startEdit(item)}>
          <Pencil size={14} aria-hidden="true" />
          Edit
        </Button>
        <Button size="sm" variant="quiet" onClick={() => handleToggleArchive(item)}>
          {item.available ? (
            <>
              <Archive size={14} aria-hidden="true" />
              Archive
            </>
          ) : (
            <>
              <ArchiveRestore size={14} aria-hidden="true" />
              Restore
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="quiet"
          className="text-mgh-danger hover:bg-mgh-danger/10 hover:text-mgh-danger"
          onClick={() => requestDeleteItem(item)}
        >
          <Trash2 size={14} aria-hidden="true" />
          Remove
        </Button>
      </div>
    );
  }

  const isEditing = editingId !== null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        density="dense"
        className="mb-0 md:mb-0"
        title="Menu Editor"
        lead="Add, edit, archive, or remove dishes and drinks. Changes here apply to the live menu_item table, so they show up immediately on the customer menu and menu builder."
      />

      {error && (
        <p
          role="alert"
          className="rounded-card border border-mgh-danger/30 bg-mgh-danger/10 px-4 py-3 text-sm text-mgh-danger"
        >
          {error}
        </p>
      )}

      {/* ADD ITEM FORM */}
      <Panel density="dense">
        <PanelHeader density="dense" title="Add New Item" />
        <form
          onSubmit={handleAddItem}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Name" required>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Category" required>
            <Select
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
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id} className="bg-mgh-bg">
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Price (R)" required>
            <Input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className="tabular-nums"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </Field>

          <Field label="Description" required className="md:col-span-2">
            <Input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          {isAddBeverage && (
            <label className="flex min-h-10 items-center gap-2 self-end text-sm text-mgh-muted">
              <input
                type="checkbox"
                checked={form.is_alcoholic}
                onChange={(e) =>
                  setForm({ ...form, is_alcoholic: e.target.checked })
                }
                className="size-4 accent-mgh-gold"
              />
              Alcoholic
            </label>
          )}

          <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
            <span className="text-[13px] font-medium text-mgh-muted">Image</span>
            <Dropzone {...upload} className={dropzoneClass}>
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            {/* The page's primary action, unless an item is being edited — then
                that row's Save takes the gold. */}
            <Button
              type="submit"
              variant={isEditing ? "secondary" : "primary"}
              loading={saving}
              className="w-full sm:w-auto"
            >
              <Plus size={16} aria-hidden="true" />
              {saving ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </Panel>

      {/* ITEM LIST */}
      <Panel density="dense">
        {/* CATEGORY + SEARCH TOOLBAR */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Search items" className="sm:w-72">
            <SearchInput
              placeholder="Name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>

          <Field label="Category" className="sm:w-56">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All" className="bg-mgh-bg">
              All Categories
            </option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id} className="bg-mgh-bg">
                {c.name}
              </option>
            ))}
          </Select>
          </Field>
        </div>

        {items === null ? (
          <SkeletonRows rows={6} label="Loading menu items…" />
        ) : items.length === 0 ? (
          <EmptyState title="No menu items yet">Add one above.</EmptyState>
        ) : filteredItems.length === 0 ? (
          <EmptyState title="No matching items">
            No items match your search or category filter.
          </EmptyState>
        ) : isDesktop ? (
          <table className="w-full border-collapse text-left text-body-dense">
            <caption className="sr-only">Menu items</caption>
            <thead>
              <tr className="border-b border-mgh-line">
                {[
                  ["Image", "w-14"],
                  ["Name", ""],
                  ["Category", ""],
                  ["Price", "text-right"],
                  ["Availability", ""],
                  ["Actions", "text-right"],
                ].map(([header, cls]) => (
                  <th
                    key={header}
                    scope="col"
                    className={`h-10 px-3 text-label font-semibold uppercase text-mgh-dim first:pl-0 last:pr-0 ${cls}`}
                  >
                    {header === "Image" ? <span className="sr-only">Image</span> : header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) =>
                editingId === item.item_id ? (
                  <tr key={item.item_id} className="border-b border-mgh-line-soft">
                    <td colSpan={6} className="py-4">
                      <p className="mb-4 text-[15px] font-semibold text-mgh-text">
                        Editing {item.name}
                      </p>
                      {renderEditForm(item)}
                    </td>
                  </tr>
                ) : (
                  <tr key={item.item_id} className="border-b border-mgh-line-soft">
                    <td className="h-14 py-2 pl-0 pr-3 align-middle">{renderThumb(item)}</td>
                    <td className="px-3 py-2 align-middle">
                      <p className="font-medium text-mgh-text">{item.name}</p>
                      {item.description && (
                        <p className="line-clamp-1 max-w-md text-caption text-mgh-dim">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">{renderCategory(item)}</td>
                    <td className="px-3 py-2 text-right align-middle tabular-nums text-mgh-text">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-3 py-2 align-middle">{renderAvailability(item)}</td>
                    <td className="py-2 pl-3 pr-0 align-middle">{renderActions(item)}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        ) : (
          <ul className="divide-y divide-mgh-line-soft border-y border-mgh-line-soft">
            {filteredItems.map((item) => (
              <li key={item.item_id} className="py-4">
                {editingId === item.item_id ? (
                  <>
                    <p className="mb-4 text-[15px] font-semibold text-mgh-text">
                      Editing {item.name}
                    </p>
                    {renderEditForm(item)}
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      {renderThumb(item)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-mgh-text">{item.name}</p>
                          <span className="shrink-0 text-sm tabular-nums text-mgh-text">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm">{renderCategory(item)}</p>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-caption text-mgh-dim">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-2">{renderAvailability(item)}</div>
                      </div>
                    </div>
                    <div className="mt-3 -ml-3">{renderActions(item)}</div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* TOASTS */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-4 z-50 flex flex-col gap-2 sm:right-6"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-control border bg-mgh-surface-2 px-4 py-3 text-sm shadow-modal ${
                toast.variant === "error"
                  ? "border-mgh-danger/40 text-mgh-danger"
                  : "border-mgh-line-strong text-mgh-text"
              }`}
            >
              {toast.variant === "error" ? (
                <AlertCircle size={16} aria-hidden="true" className="shrink-0 text-mgh-danger" />
              ) : (
                <CheckCircle2 size={16} aria-hidden="true" className="shrink-0 text-mgh-ok" />
              )}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CONFIRMATION OVERLAY */}
      {confirm && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) closeConfirm();
          }}
          size="md"
          dismissible={!confirmBusy}
          showClose={false}
        >
          <DialogTitle asChild>
            <h2
              className={`flex items-center gap-2 font-serif text-title font-medium ${
                confirm.danger ? "text-mgh-danger" : "text-mgh-text"
              }`}
            >
              {confirm.danger && <AlertTriangle size={18} aria-hidden="true" />}
              {confirm.title}
            </h2>
          </DialogTitle>

          <DialogDescription asChild>
            <p className="mt-3 text-sm leading-6 text-mgh-muted">
              {confirm.message}
            </p>
          </DialogDescription>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="quiet" disabled={confirmBusy} onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant={confirm.danger ? "danger" : "primary"}
              loading={confirmBusy}
              onClick={runConfirm}
            >
              {confirmBusy ? "Working..." : confirm.confirmLabel}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
