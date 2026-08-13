"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CreditCard,
  Home,
  LockKeyhole,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import DashboardFooter from "@/app/components/dashboard/customer/home/DashboardFooter";

const MOCK_ADDRESSES = [
  { id: "home", label: "Home", line: "12 Kloof St, Cape Town" },
  { id: "work", label: "Work", line: "88 Bree St, Cape Town" },
];

const MOCK_PAYMENT_METHOD = {
  brand: "Visa",
  last4: "4821",
  isDefault: true,
};

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

  const [customerProfile, setCustomerProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    createdAt: null,
  });

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const displayName = useMemo(() => {
    const name =
      `${customerProfile.firstName} ${customerProfile.lastName}`.trim();

    return name || "Customer profile";
  }, [customerProfile.firstName, customerProfile.lastName]);

  const memberSince = useMemo(() => {
    if (!customerProfile.createdAt) {
      return "Member since recently";
    }

    return `Member since ${new Date(
      customerProfile.createdAt,
    ).toLocaleDateString("en-ZA", {
      month: "short",
      year: "numeric",
    })}`;
  }, [customerProfile.createdAt]);

  const initials =
    [customerProfile.firstName, customerProfile.lastName]
      .filter(Boolean)
      .map((value) => value.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "C";

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(null);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

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

      setCustomerProfile({
        firstName:
          metadata.first_name ??
          user.user_metadata?.firstName ??
          user.email?.split("@")[0] ??
          "",
        lastName: metadata.last_name ?? user.user_metadata?.lastName ?? "",
        email: user.email ?? "",
        phone: metadata.phone_number ?? user.user_metadata?.phoneNumber ?? "",
        createdAt: user.created_at ?? null,
      });
      setLoadingProfile(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleChange(field) {
    return (event) => {
      setCustomerProfile((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);

    const { error } = await supabase.auth.updateUser({
      email: customerProfile.email,
      data: {
        first_name: customerProfile.firstName,
        last_name: customerProfile.lastName,
        phone_number: customerProfile.phone,
      },
    });

    setSavingProfile(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    setProfileSuccess("Profile updated successfully.");
  }

  function handleDeleteAccount() {
    // TODO: trigger a confirmation modal, then call the delete-account flow.
    console.log("delete account requested");
  }

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-6 py-20 text-center backdrop-blur-md">
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
        <DashboardFooter />
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[28px] border border-red-400/20 bg-red-400/5 px-6 py-20 text-center backdrop-blur-md">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-400">
              Profile unavailable
            </p>
            <p className="mt-3 max-w-md text-sm text-[#A0A0A0]">
              {profileError}
            </p>
          </div>
        </div>
        <DashboardFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                <UserCircle2 size={14} />
                Profile
              </div>

              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#A0A0A0] sm:text-base">
                  Manage your account details, notification preferences, saved
                  addresses, and payment setup from one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37]">
                {initials}
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  {customerProfile.email}
                </p>
                <p className="mt-1 text-xs text-[#A0A0A0]">{memberSince}</p>
              </div>
            </div>
          </div>
        </section>

        {profileSuccess && (
          <div className="rounded-[24px] border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#D4AF37]">
            {profileSuccess}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={UserCircle2}
            label="Account"
            value={displayName}
            caption="Profile identity"
          />
          <StatCard
            icon={MapPin}
            label="Addresses"
            value={MOCK_ADDRESSES.length.toString()}
            caption="Saved locations"
          />
          <StatCard
            icon={CreditCard}
            label="Payment"
            value={`${MOCK_PAYMENT_METHOD.brand} •••• ${MOCK_PAYMENT_METHOD.last4}`}
            caption="Default card"
          />
          <StatCard
            icon={Bell}
            label="Alerts"
            value={notificationsOn ? "Enabled" : "Muted"}
            caption="Order notifications"
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                  Account details
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Personal information
                </h2>
              </div>
              <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                <ShieldCheck size={20} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClassName} htmlFor="first-name">
                    First name
                  </label>
                  <div className="relative">
                    <UserCircle2
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                    />
                    <input
                      id="first-name"
                      className={`${inputClassName} pl-10`}
                      type="text"
                      value={customerProfile.firstName}
                      onChange={handleChange("firstName")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClassName} htmlFor="last-name">
                    Last name
                  </label>
                  <div className="relative">
                    <UserCircle2
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                    />
                    <input
                      id="last-name"
                      className={`${inputClassName} pl-10`}
                      type="text"
                      value={customerProfile.lastName}
                      onChange={handleChange("lastName")}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClassName} htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                  />
                  <input
                    id="email"
                    className={`${inputClassName} pl-10`}
                    type="email"
                    value={customerProfile.email}
                    onChange={handleChange("email")}
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName} htmlFor="phone">
                  Phone number
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                  />
                  <input
                    id="phone"
                    className={`${inputClassName} pl-10`}
                    type="tel"
                    value={customerProfile.phone}
                    onChange={handleChange("phone")}
                  />
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
                  {savingProfile ? "Saving..." : "Update account"}
                </button>
              </div>
            </form>
          </section>

          <div className="flex flex-col gap-6">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Saved places
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Addresses
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Add address"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/20"
                >
                  <Home size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_ADDRESSES.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-4 transition hover:border-[#D4AF37]/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {address.label}
                        </p>
                        <p className="mt-1 text-sm text-[#A0A0A0]">
                          {address.line}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#A0A0A0] transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                          aria-label={`Edit ${address.label} address`}
                        >
                          <PencilLine size={15} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#A0A0A0] transition hover:border-red-400/30 hover:text-red-300"
                          aria-label={`Delete ${address.label} address`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                      Payments
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Card on file
                    </h2>
                  </div>
                </div>

                {MOCK_PAYMENT_METHOD.isDefault && (
                  <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
                    Default
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
                <p className="text-sm font-semibold text-white">
                  {MOCK_PAYMENT_METHOD.brand} ending in{" "}
                  {MOCK_PAYMENT_METHOD.last4}
                </p>
                <p className="mt-1 text-sm text-[#A0A0A0]">
                  Used for invoice and booking payments.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Manage payment methods
                  </p>
                  <p className="mt-1 text-sm text-[#A0A0A0]">
                    Add or replace the card used for future payments.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#D4AF37] transition hover:translate-x-0.5"
                >
                  Edit
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Preferences
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Notifications
                  </h2>
                </div>
                <Bell size={18} className="text-[#D4AF37]" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Order notifications
                    </p>
                    <p className="mt-1 text-sm text-[#A0A0A0]">
                      Receive booking and order updates by email.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationsOn}
                    aria-label="Toggle order notifications"
                    onClick={() => setNotificationsOn((prev) => !prev)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                      notificationsOn
                        ? "border-[#D4AF37]/40 bg-[#D4AF37]/20"
                        : "border-white/10 bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute left-1 h-5 w-5 rounded-full bg-white transition ${
                        notificationsOn ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-4 text-left transition hover:border-[#D4AF37]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#D4AF37]">
                      <LockKeyhole size={16} />
                    </div>
                    <span className="text-sm font-medium text-white">
                      Change password
                    </span>
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
                    <span className="text-sm font-medium text-white">
                      Two-factor authentication
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[#A0A0A0]" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

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
