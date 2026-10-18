"use client";

import { useEffect, useMemo, useState } from "react";
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

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loading, setLoading] = useState(true);

  const [packages, setPackages] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [newPackageName, setNewPackageName] = useState("");
  const [newPackageDescription, setNewPackageDescription] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Gate: admins only
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
          premade_menu_items (
            menu_item ( item_id, name, price )
          )
        `,
        )
        .order("name"),
      supabase
        .from("menu_item")
        .select("item_id, name, price, is_alcoholic, available, category:category(name)")
        .order("name"),
    ]);

    if (packagesRes.error) setError(packagesRes.error.message);
    if (itemsRes.error) setError(itemsRes.error.message);

    setPackages(packagesRes.data ?? []);
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

  async function addPackage(e) {
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


    const { data: created, error: createError } = await supabase
      .from("premade_menu")
      .insert({ name, description })
      .select("premade_menu_id")
      .single();

    if (createError || !created) {
      setError(createError?.message ?? "Could not create the package.");
      setSaving(false);
      return;
    }

    const rows = [...selectedItemIds].map((itemId) => ({
      premade_menu_id: created.premade_menu_id,
      item_id: itemId,
    }));

    const { error: itemsError } = await supabase
      .from("premade_menu_items")
      .insert(rows);

    if (itemsError) {
  
      await supabase
        .from("premade_menu")
        .delete()
        .eq("premade_menu_id", created.premade_menu_id);

      setError(itemsError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(`Package "${name}" created with ${rows.length} items.`);
    setNewPackageName("");
    setNewPackageDescription("");
    setSelectedItemIds(new Set());
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

        <form
          onSubmit={addPackage}
          className="rounded-2xl border border-mgh-line bg-mgh-surface p-6 sm:p-7"
        >
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mgh-gold">
            Create a new package
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="pkg-name" className="text-xs uppercase tracking-wider text-mgh-muted">
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
              <label htmlFor="pkg-desc" className="text-xs uppercase tracking-wider text-mgh-muted">
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
                  <p className="text-sm font-semibold text-mgh-text">{category}</p>
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
                                <span className="text-mgh-muted"> (alcoholic)</span>
                              )}
                              {!item.available && (
                                <span className="text-mgh-danger"> (unavailable)</span>
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
              {saving ? "Saving..." : "Save Package"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-mgh-danger">{error}</p>}
          {success && <p className="mt-4 text-sm text-mgh-gold">{success}</p>}
        </form>


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

              return (
                <article
                  key={pkg.premade_menu_id}
                  className="rounded-xl border border-mgh-line bg-mgh-surface p-5"
                >
                  <h3 className="font-serif text-lg font-medium">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-mgh-dim">{pkg.description}</p>

                  <ul className="mt-3 space-y-1 text-sm text-mgh-muted">
                    {items.map((pmi, i) => (
                      <li key={i}>{pmi.menu_item?.name}</li>
                    ))}
                  </ul>

                  <p className="mt-3 text-sm font-semibold text-mgh-gold">
                    {items.length} items · {currency.format(total)}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}