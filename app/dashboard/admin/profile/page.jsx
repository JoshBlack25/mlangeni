"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Bell, 
  Lock, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Mail, 
  Phone, 
  Settings, 
  ChevronRight,
  UserCircle2,
  X,
  LockKeyhole
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import Footer from "@/app/components/Footer";

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
  const addressInputRef = React.useRef(null);
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
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10 flex flex-col justify-between">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-6 py-20 text-center backdrop-blur-md w-full">
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
              <UserCircle2 size={28} />
            </div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              Profile
            </p>
            <p className="mt-3 text-sm text-[#A0A0A0]">Loading your profile…</p>
          </div>
        </div>
        <div className="mt-auto pt-8">
          <Footer />
        </div>
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10 flex flex-col justify-between">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[28px] border border-red-400/20 bg-red-400/5 px-6 py-20 text-center backdrop-blur-md w-full">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-400">
              Profile unavailable
            </p>
            <p className="mt-3 max-w-md text-sm text-[#A0A0A0]">
              {profileError}
            </p>
          </div>
        </div>
        <div className="mt-auto pt-8">
          <Footer />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <div className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        
        {profileSuccess && (
          <div className="rounded-[24px] border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#d4af37]">
            {profileSuccess}
          </div>
        )}

        {/* Profile Header Card */}
        <section className="bg-[#121212] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex items-center gap-2 text-[#d4af37] text-xs font-medium tracking-wider uppercase mb-3">
            <User className="w-3.5 h-3.5" />
            <span>Profile Overview</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="text-3xl font-serif text-white tracking-tight mb-1">{displayName}</h2>
              <p className="text-sm text-zinc-400">
                Manage admin account details, notification preferences, saved addresses, and payment setup from one place.
              </p>
            </div>
          </div>

          <div className="bg-[#181818] border border-[#262626] rounded-xl p-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-[#d4af37] font-semibold text-sm">
                {initials}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{adminProfile.email}</div>
                <div className="text-xs text-zinc-500">{memberSince}</div>
              </div>
            </div>
            <span className="text-[10px] bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
              Admin
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 relative z-10">
            <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Account</div>
                <div className="text-sm font-semibold text-white mt-0.5 truncate max-w-[80px]">{displayName}</div>
                <div className="text-[11px] text-zinc-400">Profile Identity</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#202020] flex items-center justify-center text-[#d4af37] shrink-0">
                <User className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Addresses</div>
                <div className="text-sm font-semibold text-white mt-0.5">2</div>
                <div className="text-[11px] text-zinc-400">Saved locations</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#202020] flex items-center justify-center text-[#d4af37] shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
            </div>


            <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Notifications</div>
                <div className="text-sm font-semibold text-white mt-0.5">{notificationsEnabled ? "Enabled" : "Muted"}</div>
                <div className="text-[11px] text-zinc-400">Order notifications</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#202020] flex items-center justify-center text-[#d4af37] shrink-0">
                <Bell className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Account Details / Personal Information Section */}
        <section className="bg-[#121212] border border-[#222] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Account Details</span>
              <h3 className="text-xl font-serif text-white">Personal Information</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#d4af37]">
              <Settings className="w-4 h-4" />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#161616] border border-[#222] rounded-xl p-3.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1" htmlFor="firstName">First Name</label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#d4af37]" />
                  <input 
                    id="firstName"
                    type="text" 
                    value={adminProfile.firstName} 
                    onChange={handleChange("firstName")}
                    className="bg-transparent text-sm text-white focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="bg-[#161616] border border-[#222] rounded-xl p-3.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1" htmlFor="lastName">Last Name</label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#d4af37]" />
                  <input 
                    id="lastName"
                    type="text" 
                    value={adminProfile.lastName} 
                    onChange={handleChange("lastName")}
                    className="bg-transparent text-sm text-white focus:outline-none w-full"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#161616] border border-[#222] rounded-xl p-3.5 mb-4">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1" htmlFor="email">Email Address</label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#d4af37]" />
                <input 
                  id="email"
                  type="email" 
                  value={adminProfile.email} 
                  onChange={handleChange("email")}
                  className="bg-transparent text-sm text-white focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="bg-[#161616] border border-[#222] rounded-xl p-3.5 mb-6">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1" htmlFor="phone">Phone Number</label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#d4af37]" />
                <input 
                  id="phone"
                  type="text" 
                  value={adminProfile.phone} 
                  onChange={handleChange("phone")}
                  className="bg-transparent text-sm text-white focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" className="bg-[#1c1414] hover:bg-[#2a1717] text-red-400 border border-red-900/30 px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                Delete account
              </button>
              <button type="submit" disabled={savingProfile} className="bg-[#d4af37] hover:bg-[#c4a133] text-black px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-[#d4af37]/10 disabled:opacity-70 disabled:cursor-not-allowed">
                <Edit3 className="w-3.5 h-3.5" />
                {savingProfile ? "Saving..." : "Update account"}
              </button>
            </div>
          </form>
        </section>

        {/* Saved Places / Addresses Section */}
        <section className="bg-[#121212] border border-[#222] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Saved Place</span>
              <h3 className="text-xl font-serif text-white">Company Address</h3>
            </div>
            {!editingAddress && (
              <button
                type="button"
                onClick={startEditAddress}
                aria-label="Edit address"
                className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#d4af37] hover:bg-[#282828] transition-all"
              >
                <Edit3 className="w-4 h-4" />
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
                <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]" />
                <input
                  ref={addressInputRef}
                  className="w-full bg-[#161616] border border-[#222] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  type="text"
                  placeholder="e.g. 4 Mauritius Street, Avondale, Parow, 7500"
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
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] hover:bg-[#c4a133] text-black px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-70 shadow-lg shadow-[#d4af37]/10"
                >
                  {savingAddress ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditAddress}
                  disabled={savingAddress}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#222] bg-[#161616] hover:bg-[#282828] px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : adminProfile.companyAddress ? (
            <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center justify-between hover:border-[#333] transition-all">
              <div>
                <div className="text-sm font-semibold text-white">Company Address</div>
                <div className="text-xs text-zinc-400 mt-0.5">{adminProfile.companyAddress}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearAddress}
                  disabled={savingAddress}
                  aria-label="Remove address"
                  className="p-2 rounded-lg bg-[#1f1f1f] text-zinc-400 hover:text-red-400 hover:bg-[#282828] transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#222] bg-[#121212]/50 p-6 text-center">
              <MapPin className="mx-auto mb-2 w-5 h-5 text-zinc-500" />
              <p className="text-sm text-zinc-400">No address saved yet.</p>
              <button
                type="button"
                onClick={startEditAddress}
                className="mt-3 text-xs font-medium text-[#d4af37] hover:text-[#c4a133] transition-all underline-offset-2 hover:underline"
              >
                Add an address
              </button>
            </div>
          )}
        </section>

        {/* Preferences / Notifications */}
        <section className="bg-[#121212] border border-[#222] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Preferences</span>
              <h3 className="text-xl font-serif text-white">Notifications</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#d4af37]">
              <Bell className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-white">Order notifications</div>
              <div className="text-xs text-zinc-400">Receive booking and order updates by email.</div>
            </div>
            <button 
              type="button"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${notificationsEnabled ? 'bg-[#d4af37]' : 'bg-[#262626]'}`}
            >
              <div className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPwModal(true)}
            className="w-full bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center justify-between hover:border-[#333] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-[#d4af37]" />
              <div className="text-sm font-medium text-white">Change password</div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex items-center justify-between hover:border-[#333] transition-all cursor-pointer mt-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <div className="text-sm font-medium text-white">Two-factor authentication</div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>
        </section>

      </div>
      
      {/* ── Change Password Modal ── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-[#222] bg-[#121212] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Change password</h2>
              <button
                type="button"
                onClick={() => {
                  setShowPwModal(false);
                  setPwError(null);
                  setPwForm({ newPassword: "", confirmPassword: "" });
                }}
                className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
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
                <div className="rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#d4af37]">
                  {pwSuccess}
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1" htmlFor="new-password">New password</label>
                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" />
                  <input
                    id="new-password"
                    type="password"
                    required
                    className="w-full bg-[#161616] border border-[#222] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1" htmlFor="confirm-password">Confirm new password</label>
                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" />
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    className="w-full bg-[#161616] border border-[#222] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPw}
                  className="w-full bg-[#d4af37] hover:bg-[#c4a133] text-black px-4 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingPw ? "Saving..." : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}