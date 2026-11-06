"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const inputClass =
  "mt-1 w-full rounded-lg border border-mgh-line bg-mgh-surface px-3 py-2 text-mgh-text placeholder:text-mgh-faint focus:border-mgh-gold focus:outline-none";

export default function PremadeMenuPage() {
  const router = useRouter();
  const formRef = useRef(null);

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loading, setLoading] = useState(true);

  const [packages, setPackages] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // null = creating a new package, otherwise the id of the package being edited
  const [editingId, setEditingId] = useState(null);
  const [newPackageName, setNewPackageName] = useState("");
  const [newPackageDescription, setNewPackageDescription] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null); // package being retired/restored/deleted
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, orderCount }
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = editingId !== null;


  useEffect(() => {
    async function checkAdmin() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/login");
        return;
      }

      const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
      if (rpcError || !isAdmin) {
        router.replace("/dashboard/customer");
        return;
      }

      setCheckingAdmin(false);
    }

    checkAdmin();
  }, [router]);

  async function loadData() {
    setLoading(true);

    const [packagesRes, itemsRes] = await Promise.all([
      supabase
        .from("premade_menu")
        .select(
          `
          premade_menu_id,
          name,
          description,
          available,
          premade_menu_items (
            menu_item ( item_id, name, price )
          )
        `,
        )
        .order("name"),
      supabase
        .from("menu_item")
        .select(
          "item_id, name, price, is_alcoholic, available, category:category(name)",
        )
        .order("name"),
    ]);

    if (packagesRes.error) setError(packagesRes.error.message);
    if (itemsRes.error) setError(itemsRes.error.message);

    // Live packages first, retired ones after
    const sorted = [...(packagesRes.data ?? [])].sort(
      (a, b) =>
        Number(b.available) - Number(a.available) ||
        a.name.localeCompare(b.name),
    );

    setPackages(sorted);
    setMenuItems(itemsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (checkingAdmin) return;
    loadData();
  }, [checkingAdmin]);

  const itemsByCategory = useMemo(() => {
    const groups = {};
    for (const item of menuItems) {
      const key = item.category?.name ?? "Uncategorised";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [menuItems]);

  const selectedTotal = useMemo(
    () =>
      menuItems
        .filter((item) => selectedItemIds.has(item.item_id))
        .reduce((sum, item) => sum + Number(item.price ?? 0), 0),
    [menuItems, selectedItemIds],
  );

  function toggleItem(itemId) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function resetForm() {
    setEditingId(null);
    setNewPackageName("");
    setNewPackageDescription("");
    setSelectedItemIds(new Set());
  }

  function startEdit(pkg) {
    setError("");
    setSuccess("");
    setEditingId(pkg.premade_menu_id);
    setNewPackageName(pkg.name ?? "");
    setNewPackageDescription(pkg.description ?? "");
    setSelectedItemIds(
      new Set(
        (pkg.premade_menu_items ?? [])
          .map((pmi) => pmi.menu_item?.item_id)
          .filter(Boolean),
      ),
    );
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setError("");
    setSuccess("");
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = newPackageName.trim();
    const description = newPackageDescription.trim();

    if (!name || !description) {
      setError("Package name and description are both required.");
      return;
    }
    if (selectedItemIds.size === 0) {
      setError("Select at least one menu item for this package.");
      return;
    }

    setSaving(true);

    const itemIds = [...selectedItemIds];
    const { error: rpcError } = isEditing
      ? await supabase.rpc("update_premade_package", {
          p_id: editingId,
          p_name: name,
          p_description: description,
          p_item_ids: itemIds,
        })
      : await supabase.rpc("create_premade_package", {
          p_name: name,
          p_description: description,
          p_item_ids: itemIds,
        });

    setSaving(false);

    if (rpcError) {

      setError(rpcError.message);
      return;
    }

    setSuccess(
      isEditing
        ? `Package "${name}" updated.`
        : `Package "${name}" created with ${itemIds.length} items.`,
    );
    resetForm();
    loadData();
  }


  async function toggleAvailable(pkg) {
    setError("");
    setSuccess("");
    setBusyId(pkg.premade_menu_id);

    const makeAvailable = !pkg.available;

  
    const { data: updated, error: updateError } = await supabase
      .from("premade_menu")
      .update({ available: makeAvailable })
      .eq("premade_menu_id", pkg.premade_menu_id)
      .select("premade_menu_id");

    setBusyId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!updated || updated.length === 0) {
      setError(
        "Couldn't update this package. It may have been deleted, or you may not have permission.",
      );
      loadData();
      return;
    }

    setSuccess(
      makeAvailable
        ? `"${pkg.name}" is available to customers again.`
        : `"${pkg.name}" retired. Customers no longer see it.`,
    );
    loadData();
  }

  async function askDelete(pkg) {
    setError("");
    setSuccess("");
    setBusyId(pkg.premade_menu_id);

    const { count, error: countError } = await supabase
      .from("orders")
      .select("order_id", { count: "exact", head: true })
      .eq("premade_menu_id", pkg.premade_menu_id);

    setBusyId(null);

    if (countError) {
      setError(countError.message);
      return;
    }

    setDeleteTarget({
      id: pkg.premade_menu_id,
      name: pkg.name,
      orderCount: count ?? 0,
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setBusyId(deleteTarget.id);

    const { data: deleted, error: deleteError } = await supabase
      .from("premade_menu")
      .delete()
      .eq("premade_menu_id", deleteTarget.id)
      .select("premade_menu_id");

    setBusyId(null);

    if (deleteError) {
      setError(deleteError.message);
      setDeleteTarget(null);
      return;
    }
    if (!deleted || deleted.length === 0) {
      setError(
        "Couldn't delete this package. It may already be gone, or you may not have permission.",
      );
      setDeleteTarget(null);
      loadData();
      return;
    }

    if (editingId === deleteTarget.id) resetForm();
    setSuccess(`Package "${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
    loadData();
  }

  if (checkingAdmin) {
    return <p className="p-8 text-mgh-text">Checking access...</p>;
  }

  return (
    <main className="bg-mgh-bg px-6 py-10 text-mgh-text md:px-10 lg:px-14">
      <section className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-mgh-gold">
            Admin Tools
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">
            Premade Menus
          </h1>
          <div className="mt-4 h-px w-24 bg-gradient-to-r from-mgh-gold to-transparent" />
        </header>

        {/*Create / edit a package*/}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`scroll-mt-6 rounded-2xl border bg-mgh-surface p-6 sm:p-7 ${
            isEditing ? "border-mgh-gold" : "border-mgh-line"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-mgh-gold">
              {isEditing ? "Edit package" : "Create a new package"}
            </h2>

            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-semibold uppercase tracking-wider text-mgh-muted transition hover:text-mgh-text"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pkg-name"
                className="text-xs uppercase tracking-wider text-mgh-muted"
              >
                Name
              </label>
              <input
                id="pkg-name"
                type="text"
                placeholder="e.g. Corporate Classic"
                value={newPackageName}
                onChange={(e) => setNewPackageName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="pkg-desc"
                className="text-xs uppercase tracking-wider text-mgh-muted"
              >
                Description
              </label>
              <input
                id="pkg-desc"
                type="text"
                placeholder="Short summary customers will see"
                value={newPackageDescription}
                onChange={(e) => setNewPackageDescription(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <h3 className="mt-8 text-xs font-semibold uppercase tracking-widest text-mgh-gold">
            Select items for the package
          </h3>

          {loading ? (
            <p className="mt-4 text-sm text-mgh-muted">Loading menu items...</p>
          ) : menuItems.length === 0 ? (
            <p className="mt-4 text-sm text-mgh-muted">
              No menu items exist yet — add some to the catalog first.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category}>
                  <p className="text-sm font-semibold text-mgh-text">
                    {category}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {items.map((item) => {
                      const checked = selectedItemIds.has(item.item_id);
                      return (
                        <label
                          key={item.item_id}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? "border-mgh-gold bg-mgh-gold/10"
                              : "border-mgh-line hover:border-mgh-line-strong"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleItem(item.item_id)}
                            />
                            <span>
                              {item.name}
                              {item.is_alcoholic && (
                                <span className="text-mgh-muted">
                                  {" "}
                                  (alcoholic)
                                </span>
                              )}
                              {!item.available && (
                                <span className="text-mgh-danger">
                                  {" "}
                                  (unavailable)
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="text-mgh-gold">
                            {currency.format(Number(item.price ?? 0))}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-mgh-line-soft pt-6">
            <p className="text-sm text-mgh-muted">
              {selectedItemIds.size} selected · Package total{" "}
              <span className="font-semibold text-mgh-gold">
                {currency.format(selectedTotal)}
              </span>
            </p>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-mgh-gold bg-mgh-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-gold-ink transition-all hover:bg-transparent hover:text-mgh-gold disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Package"
                  : "Save Package"}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-mgh-danger">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="mt-4 text-sm text-mgh-gold">
              {success}
            </p>
          )}
        </form>

        {/*Existing packages*/}
        <h2 className="mt-12 text-xs font-semibold uppercase tracking-widest text-mgh-gold">
          Current packages
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-mgh-muted">Loading packages...</p>
        ) : packages.length === 0 ? (
          <p className="mt-4 text-sm text-mgh-muted">No packages yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {packages.map((pkg) => {
              const items = pkg.premade_menu_items ?? [];
              const total = items.reduce(
                (sum, pmi) => sum + Number(pmi.menu_item?.price ?? 0),
                0,
              );
              const beingEdited = editingId === pkg.premade_menu_id;
              const busy = busyId === pkg.premade_menu_id;
              const retired = !pkg.available;

              return (
                <article
                  key={pkg.premade_menu_id}
                  className={`flex flex-col rounded-xl border bg-mgh-surface p-5 transition-colors ${
                    beingEdited ? "border-mgh-gold" : "border-mgh-line"
                  } ${retired ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-lg font-medium">
                      {pkg.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                        retired
                          ? "border-mgh-line-strong text-mgh-muted"
                          : "border-mgh-gold/40 text-mgh-gold"
                      }`}
                    >
                      {retired ? "Retired" : "Available"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-mgh-dim">{pkg.description}</p>

                  <ul className="mt-3 flex-1 space-y-1 text-sm text-mgh-muted">
                    {items.map((pmi, i) => (
                      <li key={i}>{pmi.menu_item?.name}</li>
                    ))}
                  </ul>

                  <p className="mt-4 text-sm font-semibold text-mgh-gold">
                    {items.length} items · {currency.format(total)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-mgh-line-soft pt-4">
                    <button
                      type="button"
                      onClick={() => startEdit(pkg)}
                      disabled={saving || busy}
                      className="rounded-lg border border-mgh-gold/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-mgh-gold transition hover:border-mgh-gold hover:bg-mgh-gold hover:text-mgh-gold-ink disabled:opacity-50"
                    >
                      {beingEdited ? "Editing…" : "Edit"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAvailable(pkg)}
                      disabled={saving || busy}
                      className="rounded-lg border border-mgh-line-strong px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-mgh-muted transition hover:border-mgh-text hover:text-mgh-text disabled:opacity-50"
                    >
                      {retired ? "Restore" : "Retire"}
                    </button>

                    <button
                      type="button"
                      onClick={() => askDelete(pkg)}
                      disabled={saving || busy}
                      className="ml-auto rounded-lg border border-mgh-danger/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-mgh-danger transition hover:border-mgh-danger hover:bg-mgh-danger/10 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-pkg-title"
            className="w-full max-w-md rounded-2xl border border-mgh-line bg-mgh-surface p-6"
          >
            <h2
              id="delete-pkg-title"
              className="font-serif text-xl font-medium text-mgh-text"
            >
              Delete package?
            </h2>

            <p className="mt-3 text-sm text-mgh-muted">
              This permanently deletes{" "}
              <span className="font-semibold text-mgh-text">
                {deleteTarget.name}
              </span>{" "}
              and can&apos;t be undone.
            </p>

            {deleteTarget.orderCount > 0 ? (
              <p className="mt-3 rounded-lg border border-mgh-danger/30 bg-mgh-danger/10 px-3 py-2 text-sm text-mgh-danger">
                {deleteTarget.orderCount}{" "}
                {deleteTarget.orderCount === 1 ? "order uses" : "orders use"}{" "}
                this package. {deleteTarget.orderCount === 1 ? "It" : "They"}{" "}
                will be kept, but will no longer be linked to a package. Retire
                it instead if you only want to hide it from customers.
              </p>
            ) : (
              <p className="mt-3 text-sm text-mgh-dim">
                No orders use this package.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busyId === deleteTarget.id}
                className="rounded-lg border border-mgh-line-strong px-5 py-2 text-xs font-semibold uppercase tracking-wider text-mgh-muted transition hover:border-mgh-text hover:text-mgh-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deleteTarget.id}
                className="rounded-lg border border-mgh-danger bg-mgh-danger px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-transparent hover:text-mgh-danger disabled:opacity-50"
              >
                {busyId === deleteTarget.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}