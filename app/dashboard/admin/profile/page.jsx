"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

export default function AdminProfilePage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyAddress: "",
    createdAt: null,
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Address line edit state
  const addressInputRef = useRef(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);

  // Change Admin password state
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(null);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error) {
        setProfileError(error.message);
        setLoadingProfile(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const metadata = user.user_metadata ?? {};

      setAdminProfile({
        firstName:
          metadata.first_name ??
          user.user_metadata?.firstName ??
          user.email?.split("@")[0] ??
          "",
        lastName: metadata.last_name ?? user.user_metadata?.lastName ?? "",
        email: user.email ?? "",
        phone: metadata.phone_number ?? user.user_metadata?.phoneNumber ?? "",
        companyAddress: metadata.company_address ?? "4 Mauritius Street, Avondale, Parow, 7500",
        createdAt: user.created_at ?? null,
      });
      setLoadingProfile(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const displayName = useMemo(() => {
    const name = `${adminProfile.firstName} ${adminProfile.lastName}`.trim();
    return name || "Admin profile";
  }, [adminProfile.firstName, adminProfile.lastName]);

  const memberSince = useMemo(() => {
    if (!adminProfile.createdAt) return "Member since recently";
    return `Member since ${new Date(adminProfile.createdAt).toLocaleDateString("en-ZA", {
      month: "short",
      year: "numeric",
    })}`;
  }, [adminProfile.createdAt]);

  const initials = [adminProfile.firstName, adminProfile.lastName]
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "A";

  function handleChange(field) {
    return (event) => {
      setAdminProfile((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);

    const { error } = await supabase.auth.updateUser({
      email: adminProfile.email,
      data: {
        first_name: adminProfile.firstName,
        last_name: adminProfile.lastName,
        phone_number: adminProfile.phone,
      },
    });

    setSavingProfile(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    setProfileSuccess("Profile updated successfully.");
  }

  // Address handlers
  function startEditAddress() {
    setAddressDraft(adminProfile.companyAddress);
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

    const { error } = await supabase.auth.updateUser({
      data: { company_address: addressDraft.trim() },
    });

    setSavingAddress(false);

    if (error) {
      setAddressError(error.message);
      return;
    }

    setAdminProfile((prev) => ({ ...prev, companyAddress: addressDraft.trim() }));
    setEditingAddress(false);
    setAddressDraft("");
  }

  async function clearAddress() {
    setSavingAddress(true);
    setAddressError(null);

    const { error } = await supabase.auth.updateUser({
      data: { company_address: "" },
    });

    setSavingAddress(false);

    if (error) {
      setAddressError(error.message);
      return;
    }

    setAdminProfile((prev) => ({ ...prev, companyAddress: "" }));
    setEditingAddress(false);
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

  if (loadingProfile) {
    return (
      <div>
        <div role="status" className="flex flex-col gap-6">
          <span className="sr-only">Loading your profile…</span>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-16 rounded-card" />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <Skeleton className="h-72 rounded-card" />
            <Skeleton className="h-72 rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div>
        <Panel density="dense">
          <EmptyState title="Profile unavailable">{profileError}</EmptyState>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        density="dense"
        title={displayName}
        lead="Manage admin account details, notification preferences, saved addresses, and payment setup from one place."
        actions={
          <div className="flex items-center gap-3">
            <Monogram initials={initials} size={48} />
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-sm font-medium text-mgh-text">
                {adminProfile.email}
                <span className="text-label font-semibold uppercase text-mgh-dim">Admin</span>
              </p>
              <p className="mt-0.5 text-caption text-mgh-dim">{memberSince}</p>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Account summary */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-mgh-line py-4 md:grid-cols-3 md:gap-0 md:divide-x md:divide-mgh-line md:[&>*]:px-5 md:[&>*:first-child]:pl-0 md:[&>*:last-child]:pr-0">
          <SummaryItem label="Account" value={displayName} caption="Profile Identity" />
          <SummaryItem label="Addresses" value="2" caption="Saved locations" />
          <SummaryItem label="Notifications" value={notificationsEnabled ? "Enabled" : "Muted"} caption="Order notifications" />
        </dl>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          {/* Personal information form */}
          <Panel density="dense">
            <PanelHeader density="dense" title="Personal Information" description="Account Details" />

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="First Name">
                  <Input id="firstName" type="text" autoComplete="given-name" value={adminProfile.firstName} onChange={handleChange("firstName")} />
                </Field>

                <Field label="Last Name">
                  <Input id="lastName" type="text" autoComplete="family-name" value={adminProfile.lastName} onChange={handleChange("lastName")} />
                </Field>
              </div>

              <Field label="Email Address">
                <Input id="email" type="email" autoComplete="email" value={adminProfile.email} onChange={handleChange("email")} />
              </Field>

              <Field label="Phone Number">
                <Input id="phone" type="text" autoComplete="tel" value={adminProfile.phone} onChange={handleChange("phone")} />
              </Field>

              {profileSuccess && (
                <p role="status" className="flex items-center gap-2 text-sm text-mgh-ok">
                  <Check size={16} aria-hidden="true" />
                  {profileSuccess}
                </p>
              )}

              <div className="mt-1 flex flex-col-reverse gap-2 border-t border-mgh-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="danger" size="sm" className="w-full sm:w-auto">
                  <Trash2 size={16} aria-hidden="true" />
                  Delete account
                </Button>

                <Button type="submit" variant="primary" loading={savingProfile} className="w-full sm:w-auto">
                  {savingProfile ? "Saving..." : "Update account"}
                </Button>
              </div>
            </form>
          </Panel>

          <div className="flex flex-col gap-6">
            {/* Saved Places / Addresses Section */}
            <Panel density="dense">
              <PanelHeader
                density="dense"
                title="Company Address"
                description="Saved Place"
                action={
                  !editingAddress ? (
                    <Button variant="secondary" size="sm" onClick={startEditAddress} aria-label="Edit address">
                      <PencilLine size={16} aria-hidden="true" />
                      Edit
                    </Button>
                  ) : null
                }
              />

              {editingAddress ? (
                <div className="flex flex-col gap-3">
                  <Field label="Company Address" error={addressError}>
                    <Input
                      ref={addressInputRef}
                      type="text"
                      autoComplete="street-address"
                      placeholder="e.g. 4 Mauritius Street, Avondale, Parow, 7500"
                      value={addressDraft}
                      onChange={(e) => setAddressDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); saveAddress(); }
                        if (e.key === "Escape") cancelEditAddress();
                      }}
                    />
                  </Field>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={saveAddress} loading={savingAddress} className="flex-1 sm:flex-none">
                      <Check size={16} aria-hidden="true" />
                      {savingAddress ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="quiet" size="sm" onClick={cancelEditAddress} disabled={savingAddress}>
                      <X size={16} aria-hidden="true" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : adminProfile.companyAddress ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-label font-semibold uppercase text-mgh-dim">Company Address</p>
                    <p className="mt-1 text-sm text-mgh-text">{adminProfile.companyAddress}</p>
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
              {!editingAddress && !adminProfile.companyAddress && addressError && (
                <p role="alert" className="mt-3 text-caption text-mgh-danger">{addressError}</p>
              )}
            </Panel>

            {/* Preferences / Notifications */}
            <Panel density="dense">
              <PanelHeader density="dense" title="Notifications" description="Preferences" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-mgh-text">Order notifications</p>
                  <p className="mt-0.5 text-sm text-mgh-muted">Receive booking and order updates by email.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationsEnabled}
                  aria-label="Toggle order notifications"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={cn("-m-1.5 shrink-0 rounded-full p-1.5", focusRing)}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative flex h-7 w-12 items-center rounded-full border transition-colors duration-[var(--mgh-dur-fast)]",
                      notificationsEnabled ? "border-mgh-gold/40 bg-mgh-gold/20" : "border-mgh-line-strong bg-mgh-surface-3",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-1 size-5 rounded-full transition-transform duration-[var(--mgh-dur-fast)]",
                        notificationsEnabled ? "translate-x-5 bg-mgh-gold" : "translate-x-0 bg-mgh-muted",
                      )}
                    />
                  </span>
                </button>
              </div>

              <ul className="mt-4 divide-y divide-mgh-line-soft border-t border-mgh-line-soft">
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

      {/* ── Change Password Modal ── */}
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
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
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

          <Field label="New password" required>
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
            {savingPw ? "Saving..." : "Update password"}
          </Button>
        </form>
      </Dialog>

    </div>
  );
}

function SummaryItem({ label, value, caption }) {
  return (
    <div className="min-w-0">
      <dt className="text-label font-semibold uppercase text-mgh-dim">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-mgh-text">{value}</dd>
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
        "flex min-h-11 w-full items-center justify-between gap-3 rounded-control py-2.5 text-left transition-colors hover:text-mgh-text",
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
