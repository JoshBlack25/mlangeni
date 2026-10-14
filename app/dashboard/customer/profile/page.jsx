"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  LockKeyhole,
  PencilLine,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import DashboardFooter from "@/app/components/dashboard/customer/home/DashboardFooter";
import Monogram from "@/app/components/dashboard/shared/Monogram";
import {
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
  focusRing,
  Blank,
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const addressInputRef = useRef(null);

  // ── Profile state ─────────────────────────────────────────
  const [userId, setUserId] = useState(null);
  const [customerProfile, setCustomerProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    createdAt: null,
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Change-password
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  // Address one line edit
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);

  // Notifications
  const [notificationsOn, setNotificationsOn] = useState(true);

  // Display user's name & surname
  const displayName = useMemo(() => {
    const name = `${customerProfile.firstName} ${customerProfile.lastName}`.trim();
    return name || "Customer profile";
  }, [customerProfile.firstName, customerProfile.lastName]);

  const memberSince = useMemo(() => {
    if (!customerProfile.createdAt) return "Member since recently";
    return `Member since ${new Date(customerProfile.createdAt).toLocaleDateString("en-ZA", {
      month: "short",
      year: "numeric",
    })}`;
  }, [customerProfile.createdAt]);

  const initials =
    [customerProfile.firstName, customerProfile.lastName]
      .filter(Boolean)
      .map((v) => v.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "C";

  // Load profile from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError) {
        setProfileError(authError.message);
        setLoadingProfile(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      // Read from the customer table
      const { data: row, error: dbError } = await supabase
        .from("customer")
        .select("first_name, last_name, phone_number, address")
        .eq("user_id", user.id)
        .single();

      if (!isMounted) return;

      if (dbError && dbError.code !== "PGRST116") {
        // PGRST116 = row not found — treat as empty, not a hard error
        setProfileError(dbError.message);
        setLoadingProfile(false);
        return;
      }

      const meta = user.user_metadata ?? {};

      setCustomerProfile({
        firstName: row?.first_name ?? meta.first_name ?? meta.firstName ?? user.email?.split("@")[0] ?? "",
        lastName:  row?.last_name  ?? meta.last_name  ?? meta.lastName  ?? "",
        email:     user.email ?? "",
        phone:     row?.phone_number ?? meta.phone_number ?? meta.phoneNumber ?? "",
        address:   row?.address ?? "",
        createdAt: user.created_at ?? null,
      });

      setLoadingProfile(false);
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [router]);

  // Personal info handlers
  function handleChange(field) {
    return (e) => setCustomerProfile((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);

    const { error: authErr } = await supabase.auth.updateUser({
      email: customerProfile.email,
      data: {
        first_name:   customerProfile.firstName,
        last_name:    customerProfile.lastName,
        phone_number: customerProfile.phone,
      },
    });

    if (authErr) {
      setProfileError(authErr.message);
      setSavingProfile(false);
      return;
    }

    // Update customer table on Supabase
    const { error: dbErr } = await supabase
      .from("customer")
      .update({
        first_name:   customerProfile.firstName,
        last_name:    customerProfile.lastName,
        phone_number: customerProfile.phone,
      })
      .eq("user_id", userId);

    setSavingProfile(false);

    if (dbErr) {
      setProfileError(dbErr.message);
      return;
    }

    setProfileSuccess("Profile updated successfully.");
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    if (pwForm.newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }

    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({
      password: pwForm.newPassword,
    });
    setSavingPw(false);

    if (error) {
      setPwError(error.message);
      return;
    }

    setPwSuccess("Password updated successfully.");
    setTimeout(() => {
      setShowPwModal(false);
      setPwForm({ newPassword: "", confirmPassword: "" });
      setPwSuccess(null);
    }, 2000);
  }

  // Deleting an account removes its orders, invoices and payment history, so
  // it is handled by staff on request rather than with one click here.
  function handleDeleteAccount() {
    router.push("/dashboard/customer/support");
  }

  // Address handlers
  function startEditAddress() {
    setAddressDraft(customerProfile.address);
    setAddressError(null);
    setEditingAddress(true);
    setTimeout(() => addressInputRef.current?.focus(), 0);
  }

  function cancelEditAddress() {
    setEditingAddress(false);
    setAddressDraft("");
    setAddressError(null);
  }

  async function saveAddress() {
    setSavingAddress(true);
    setAddressError(null);

    const { error } = await supabase
      .from("customer")
      .update({ address: addressDraft.trim() })
      .eq("user_id", userId);

    setSavingAddress(false);

    if (error) {
      setAddressError(error.message);
      return;
    }

    setCustomerProfile((prev) => ({ ...prev, address: addressDraft.trim() }));
    setEditingAddress(false);
    setAddressDraft("");
  }

  async function clearAddress() {
    setSavingAddress(true);
    setAddressError(null);

    const { error } = await supabase
      .from("customer")
      .update({ address: "" })
      .eq("user_id", userId);

    setSavingAddress(false);

    if (error) {
      setAddressError(error.message);
      return;
    }

    setCustomerProfile((prev) => ({ ...prev, address: "" }));
    setEditingAddress(false);
  }

  // Error screens
  if (loadingProfile) {
    return (
      <div>
        <div role="status" className="flex flex-col gap-8 md:gap-10">
          <span className="sr-only">Loading your profile…</span>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-64 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_0.95fr]">
            <Skeleton className="h-80 rounded-card" />
            <Skeleton className="h-80 rounded-card" />
          </div>
        </div>
        <DashboardFooter />
      </div>
    );
  }

  if (profileError) {
    return (
      <div>
        <Panel>
          <EmptyState title="Profile unavailable">{profileError}</EmptyState>
        </Panel>
        <DashboardFooter />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={displayName}
        lead="Manage your account details, notification preferences, saved address, and payment setup from one place."
        actions={
          <div className="flex items-center gap-4">
            <Monogram initials={initials} size={64} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-mgh-text">{customerProfile.email}</p>
              <p className="mt-1 text-caption text-mgh-dim">{memberSince}</p>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-8 md:gap-10">
        {/* Account summary */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-mgh-line py-5 md:grid-cols-4 md:gap-0 md:divide-x md:divide-mgh-line md:[&>*]:px-6 md:[&>*:first-child]:pl-0 md:[&>*:last-child]:pr-0">
          <SummaryItem label="Account" value={displayName} caption="Profile identity" />
          <SummaryItem label="Address" value={customerProfile.address ? "Saved" : "Not set"} caption={customerProfile.address || "No address saved"} />
          <SummaryItem label="Payment" value={<Blank label="No card" />} caption="No card on file" />
          <SummaryItem label="Alerts" value={notificationsOn ? "Enabled" : "Muted"} caption="Order notifications" />
        </dl>

        <div className="grid grid-cols-1 items-start gap-8 md:gap-10 xl:grid-cols-[1.25fr_0.95fr]">

          {/* Personal information form */}
          <Panel>
            <PanelHeader title="Personal information" description="Account details" />

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="First name">
                  <Input id="first-name" type="text" autoComplete="given-name" value={customerProfile.firstName} onChange={handleChange("firstName")} />
                </Field>

                <Field label="Last name">
                  <Input id="last-name" type="text" autoComplete="family-name" value={customerProfile.lastName} onChange={handleChange("lastName")} />
                </Field>
              </div>

              <Field label="Email address">
                <Input id="email" type="email" autoComplete="email" value={customerProfile.email} onChange={handleChange("email")} />
              </Field>

              <Field label="Phone number">
                <Input id="phone" type="tel" autoComplete="tel" value={customerProfile.phone} onChange={handleChange("phone")} />
              </Field>

              {profileSuccess && (
                <p role="status" className="flex items-center gap-2 text-sm text-mgh-ok">
                  <Check size={16} aria-hidden="true" />
                  {profileSuccess}
                </p>
              )}

              <div className="mt-2 flex flex-col-reverse gap-3 border-t border-mgh-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="danger" onClick={handleDeleteAccount} className="w-full sm:w-auto">
                  <Trash2 size={16} aria-hidden="true" />
                  Request account deletion
                </Button>

                <Button type="submit" variant="primary" loading={savingProfile} className="w-full sm:w-auto">
                  {savingProfile ? "Saving…" : "Update account"}
                </Button>
              </div>
            </form>
          </Panel>

          <div className="flex flex-col gap-8 md:gap-10">

            {/* ── Address section ── */}
            <Panel>
              <PanelHeader
                title="Address"
                description="Saved place"
                action={
                  !editingAddress && customerProfile.address ? (
                    <Button variant="secondary" size="sm" onClick={startEditAddress} aria-label="Edit address">
                      <PencilLine size={16} aria-hidden="true" />
                      Edit
                    </Button>
                  ) : null
                }
              />

              {editingAddress ? (
                <div className="flex flex-col gap-4">
                  <Field label="Address" error={addressError}>
                    <Input
                      ref={addressInputRef}
                      type="text"
                      autoComplete="street-address"
                      placeholder="e.g. 12 Kloof St, Cape Town"
                      value={addressDraft}
                      onChange={(e) => setAddressDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); saveAddress(); }
                        if (e.key === "Escape") cancelEditAddress();
                      }}
                    />
                  </Field>

                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={saveAddress} loading={savingAddress} className="flex-1 sm:flex-none">
                      <Check size={16} aria-hidden="true" />
                      {savingAddress ? "Saving…" : "Save"}
                    </Button>
                    <Button variant="quiet" onClick={cancelEditAddress} disabled={savingAddress}>
                      <X size={16} aria-hidden="true" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : customerProfile.address ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-label font-semibold uppercase text-mgh-dim">Saved address</p>
                    <p className="mt-1.5 text-sm text-mgh-text">{customerProfile.address}</p>
                    {addressError && (
                      <p role="alert" className="mt-2 text-caption text-mgh-danger">{addressError}</p>
                    )}
                  </div>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={clearAddress}
                    disabled={savingAddress}
                    aria-label="Remove address"
                    className="size-10 px-0"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title="No address saved yet."
                  align="start"
                  className="py-2"
                  action={
                    <Button variant="secondary" size="sm" onClick={startEditAddress}>
                      Add an address
                    </Button>
                  }
                />
              )}
              {!editingAddress && !customerProfile.address && addressError && (
                <p role="alert" className="mt-3 text-caption text-mgh-danger">{addressError}</p>
              )}
            </Panel>

            {/* Payment Card for Customer */}
            <Panel>
              <PanelHeader title="Card on file" description="Payments" />
              <EmptyState title="No card on file." align="start" className="py-2">
                Payment methods will appear here.
              </EmptyState>
            </Panel>

            {/* ── Notifications / Security section ── */}
            <Panel>
              <PanelHeader title="Notifications" description="Preferences" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p id="order-notifications-label" className="text-sm font-medium text-mgh-text">Order notifications</p>
                  <p className="mt-1 text-sm text-mgh-muted">Receive booking and order updates by email.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationsOn}
                  aria-label="Toggle order notifications"
                  onClick={() => setNotificationsOn((prev) => !prev)}
                  className={cn("-m-1.5 shrink-0 rounded-full p-1.5", focusRing)}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative flex h-7 w-12 items-center rounded-full border transition-colors duration-[var(--mgh-dur-fast)]",
                      notificationsOn ? "border-mgh-gold/40 bg-mgh-gold/20" : "border-mgh-line-strong bg-mgh-surface-3",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-1 size-5 rounded-full transition-transform duration-[var(--mgh-dur-fast)]",
                        notificationsOn ? "translate-x-5 bg-mgh-gold" : "translate-x-0 bg-mgh-muted",
                      )}
                    />
                  </span>
                </button>
              </div>

              <ul className="mt-6 divide-y divide-mgh-line-soft border-t border-mgh-line-soft">
                <li>
                  <SettingRow icon={LockKeyhole} label="Change password" onClick={() => setShowPwModal(true)} />
                </li>
                <li>
                  <SettingRow icon={BadgeCheck} label="Two-factor authentication" />
                </li>
              </ul>
            </Panel>

          </div>
        </div>
      </div>

      {/** Customer Change Password */}
      <Dialog
        open={showPwModal}
        onOpenChange={(o) => {
          if (!o) {
            setShowPwModal(false);
            setPwError(null);
            setPwForm({ newPassword: "", confirmPassword: "" });
          }
        }}
        title="Change password"
        size="md"
        dismissible={!savingPw}
      >
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
          {pwError && (
            <p role="alert" className="rounded-control border border-mgh-danger/30 bg-mgh-danger/5 px-4 py-3 text-sm text-mgh-danger">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p role="status" className="flex items-center gap-2 text-sm text-mgh-ok">
              <Check size={16} aria-hidden="true" />
              {pwSuccess}
            </p>
          )}

          <Field label="New password" hint="At least 6 characters." required>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
          </Field>

          <Field label="Confirm new password" required>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            />
          </Field>

          <Button type="submit" variant="primary" loading={savingPw} className="mt-1 w-full">
            {savingPw ? "Saving…" : "Update password"}
          </Button>
        </form>
      </Dialog>

      <DashboardFooter />
    </div>
  );
}

function SummaryItem({ label, value, caption }) {
  return (
    <div className="min-w-0">
      <dt className="text-label font-semibold uppercase text-mgh-dim">{label}</dt>
      <dd className="mt-1.5 truncate text-sm font-medium text-mgh-text">{value}</dd>
      <dd className="mt-0.5 truncate text-caption text-mgh-dim">{caption}</dd>
    </div>
  );
}

function SettingRow({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full items-center justify-between gap-3 rounded-control py-3 text-left transition-colors hover:text-mgh-text",
        focusRing,
      )}
    >
      <span className="flex items-center gap-3">
        <Icon size={16} className="text-mgh-dim" aria-hidden="true" />
        <span className="text-sm font-medium text-mgh-text">{label}</span>
      </span>
      <ChevronRight size={16} className="text-mgh-dim" aria-hidden="true" />
    </button>
  );
}
