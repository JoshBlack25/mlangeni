"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import DashboardFooter from "@/app/components/dashboard/customer/home/DashboardFooter";


const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

const labelClassName =
  "mb-2 block text-[11px] uppercase tracking-[0.18em] text-[#A0A0A0]";
function CreditCardIcon(props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <g>
        <path
          d="M29,7H28V6a3,3,0,0,0-3-3H3A3,3,0,0,0,0,6V22a3,3,0,0,0,3,3H4v1a3,3,0,0,0,3,3H29a3,3,0,0,0,3-3V10A3,3,0,0,0,29,7Zm1,3v1H6V10A1,1,0,0,1,7,9H29A1,1,0,0,1,30,10Zm0,7H6V13H30ZM3,23a1,1,0,0,1-1-1V6A1,1,0,0,1,3,5H25a1,1,0,0,1,1,1V7H7a3,3,0,0,0-3,3V23Zm26,4H7a1,1,0,0,1-1-1V19H30v7A1,1,0,0,1,29,27Z"
          stroke="currentColor"
          fill="currentColor"
        />
        <path
          d="M15,23H13a1,1,0,0,0,0,2h2a1,1,0,0,0,0-2Z"
          fill="currentColor"
        />
        <path
          d="M21,23H19a1,1,0,0,0,0,2h2a1,1,0,0,0,0-2Z"
          fill="currentColor"
        />
        <path
          d="M27,23H25a1,1,0,0,0,0,2h2a1,1,0,0,0,0-2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

function AddAddressIcon(props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9.5 7L14.5 12L9.5 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

  function handleDeleteAccount() {
    // TODO: trigger a confirmation, then call the delete-account flow.
    console.log("delete account requested");
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
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-6 py-20 text-center backdrop-blur-md">
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
              <UserCircle2 size={28} />
            </div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37]">Profile</p>
            <p className="mt-3 text-sm text-[#A0A0A0]">Loading your profile…</p>
          </div>
        </div>
        <DashboardFooter />
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[28px] border border-red-400/20 bg-red-400/5 px-6 py-20 text-center backdrop-blur-md">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-400">Profile unavailable</p>
            <p className="mt-3 max-w-md text-sm text-[#A0A0A0]">{profileError}</p>
          </div>
        </div>
        <DashboardFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">

        {/* Hero banner */}
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                <UserCircle2 size={14} />
                Profile
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">{displayName}</h1>
                <p className="mt-2 max-w-2xl text-sm text-[#A0A0A0] sm:text-base">
                  Manage your account details, notification preferences, saved address, and payment setup from one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37]">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{customerProfile.email}</p>
                <p className="mt-1 text-xs text-[#A0A0A0]">{memberSince}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Success banner */}
        {profileSuccess && (
          <div className="rounded-[24px] border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#D4AF37]">
            {profileSuccess}
          </div>
        )}

        {/* Stat cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={UserCircle2} label="Account" value={displayName} caption="Profile identity" />
          <StatCard icon={MapPin}      label="Address" value={customerProfile.address ? "Saved" : "Not set"} caption={customerProfile.address || "No address saved"} />
          <StatCard icon={CreditCard}  label="Payment" value="—" caption="No card on file" />
          <StatCard icon={Bell}        label="Alerts"  value={notificationsOn ? "Enabled" : "Muted"} caption="Order notifications" />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">

          {/* Personal information form */}
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">Account details</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Personal information</h2>
              </div>
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                <ShieldCheck size={20} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClassName} htmlFor="first-name">First name</label>
                  <div className="relative">
                    <UserCircle2 size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                    <input id="first-name" className={`${inputClassName} pl-10`} type="text" value={customerProfile.firstName} onChange={handleChange("firstName")} />
                  </div>
                </div>

                <div>
                  <label className={labelClassName} htmlFor="last-name">Last name</label>
                  <div className="relative">
                    <UserCircle2 size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                    <input id="last-name" className={`${inputClassName} pl-10`} type="text" value={customerProfile.lastName} onChange={handleChange("lastName")} />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClassName} htmlFor="email">Email address</label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  <input id="email" className={`${inputClassName} pl-10`} type="email" value={customerProfile.email} onChange={handleChange("email")} />
                </div>
              </div>

              <div>
                <label className={labelClassName} htmlFor="phone">Phone number</label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  <input id="phone" className={`${inputClassName} pl-10`} type="tel" value={customerProfile.phone} onChange={handleChange("phone")} />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#A0A0A0] transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
                >
                  <Trash2 size={16} />
                  Delete account
                </button>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#e3bf52] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <PencilLine size={16} />
                  {savingProfile ? "Saving…" : "Update account"}
                </button>
              </div>
            </form>
          </section>

          <div className="flex flex-col gap-6">

            {/* ── Address section ── */}
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">Saved place</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Address</h2>
                </div>

                {!editingAddress && (
                  <button
                    type="button"
                    onClick={startEditAddress}
                    aria-label="Edit address"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/20"
                  >
                    <PencilLine size={17} />
                  </button>
                )}
              </div>

              {addressError && (
                <p className="mb-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs text-red-400">
                  {addressError}
                </p>
              )}

              {editingAddress ? (
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                    <input
                      ref={addressInputRef}
                      className={`${inputClassName} pl-10`}
                      type="text"
                      placeholder="e.g. 12 Kloof St, Cape Town"
                      value={addressDraft}
                      onChange={(e) => setAddressDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); saveAddress(); }
                        if (e.key === "Escape") cancelEditAddress();
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveAddress}
                      disabled={savingAddress}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e3bf52] disabled:opacity-70"
                    >
                      <Check size={15} />
                      {savingAddress ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditAddress}
                      disabled={savingAddress}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#A0A0A0] transition hover:border-white/20"
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : customerProfile.address ? (
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">Saved address</p>
                      <p className="mt-1 text-sm text-[#A0A0A0]">{customerProfile.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearAddress}
                      disabled={savingAddress}
                      aria-label="Remove address"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#A0A0A0] transition hover:border-red-400/30 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#0A0A0A]/40 p-6 text-center">
                  <MapPin size={22} className="mx-auto mb-2 text-[#A0A0A0]" />
                  <p className="text-sm text-[#A0A0A0]">No address saved yet.</p>
                  <button
                    type="button"
                    onClick={startEditAddress}
                    className="mt-3 text-xs font-medium text-[#D4AF37] underline-offset-2 hover:underline"
                  >
                    Add an address
                  </button>
                </div>
              )}
            </section>

            {/* Payment Card for Customer */}
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">Payments</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Card on file</h2>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0A0A0A]/40 p-6 text-center">
                <CreditCard size={22} className="mx-auto mb-2 text-[#A0A0A0]" />
                <p className="text-sm text-[#A0A0A0]">No card on file.</p>
                <p className="mt-1 text-xs text-[#A0A0A0]/60">Payment methods will appear here.</p>
              </div>
            </section>

            {/* ── Notifications / Security section ── */}
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">Preferences</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Notifications</h2>
                </div>
                <Bell size={18} className="text-[#D4AF37]" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">Order notifications</p>
                    <p className="mt-1 text-sm text-[#A0A0A0]">Receive booking and order updates by email.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationsOn}
                    aria-label="Toggle order notifications"
                    onClick={() => setNotificationsOn((prev) => !prev)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                      notificationsOn ? "border-[#D4AF37]/40 bg-[#D4AF37]/20" : "border-white/10 bg-white/10"
                    }`}
                  >
                    <span className={`absolute left-1 h-5 w-5 rounded-full bg-white transition ${notificationsOn ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPwModal(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-4 text-left transition hover:border-[#D4AF37]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#D4AF37]">
                      <LockKeyhole size={16} />
                    </div>
                    <span className="text-sm font-medium text-white">Change password</span>
                  </div>
                  <ChevronRight size={16} className="text-[#A0A0A0]" />
                </button>

                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-4 text-left transition hover:border-[#D4AF37]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#D4AF37]">
                      <BadgeCheck size={16} />
                    </div>
                    <span className="text-sm font-medium text-white">Two-factor authentication</span>
                  </div>
                  <ChevronRight size={16} className="text-[#A0A0A0]" />
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/** Customer Change Password */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Change password</h2>
              <button
                type="button"
                onClick={() => {
                  setShowPwModal(false);
                  setPwError(null);
                  setPwForm({ newPassword: "", confirmPassword: "" });
                }}
                className="rounded-full p-2 text-[#A0A0A0] transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwError && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#D4AF37]">
                  {pwSuccess}
                </div>
              )}

              <div>
                <label className={labelClassName} htmlFor="new-password">New password</label>
                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  <input
                    id="new-password"
                    type="password"
                    required
                    className={`${inputClassName} pl-10`}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName} htmlFor="confirm-password">Confirm new password</label>
                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    className={`${inputClassName} pl-10`}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPw}
                  className="w-full rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37] px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e3bf52] disabled:opacity-70"
                >
                  {savingPw ? "Saving…" : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DashboardFooter />
    </main>
  );
}

function StatCard({ icon: Icon, label, value, caption }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#A0A0A0]">
            {label}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{value}</p>
          <p className="mt-1 text-sm text-[#A0A0A0]">{caption}</p>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
