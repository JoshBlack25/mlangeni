"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import Header from "@/app/components/dashboard/layout/Header";
import DashboardFooter from "@/app/components/dashboard/customer/home/DashboardFooter";

// TODO: swap this for the authenticated user's row from Supabase
// (e.g. via a server component fetch or a `useUser()` hook).
const MOCK_ADDRESSES = [
  { id: "home", label: "Home", line: "12 Kloof St, Cape Town" },
  { id: "work", label: "Work", line: "88 Bree St, Cape Town" },
];

const MOCK_PAYMENT_METHOD = {
  id: "pm_1",
  brand: "Visa",
  last4: "4821",
  isDefault: true,
};

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

export default function profile() {
  const router = useRouter();

  const [customerProfile, setCustomerProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

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
        router.push("/login");
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
      });
      setLoadingProfile(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleChange(field) {
    return (e) => {
      setCustomerProfile((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();

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
      <>
        {/* <Header /> */}

        <main className="mx-auto max-w-[1280px] px-grid-gutter py-12">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Loading profile...
          </p>
        </main>
        <DashboardFooter />
      </>
    );
  }

  if (profileError) {
    return (
      <>
        {/* <Header /> */}
        {/* <Hero /> */}
        <main className="mx-auto max-w-[1280px] px-grid-gutter py-12">
          <p className="font-body-md text-body-md text-error">{profileError}</p>
        </main>
        <DashboardFooter />
      </>
    );
  }

  return (
    <>
      {/* <Header /> */}
      {/* <Hero /> */}

      <main className="profile-shell mx-auto max-w-[1280px] px-grid-gutter py-16">
        {/* Profile header */}
        <header className="mb-16">
          <h1 className="profile-heading font-headline-md text-[clamp(3rem,5vw,5rem)] leading-none transition-transform duration-300 hover:-translate-y-0.5">
            {customerProfile.firstName} {customerProfile.lastName}
          </h1>
          <p className="profile-subheading mt-2 font-body-md text-body-md">
            {customerProfile.email} · Member since Jan 2025
          </p>
        </header>

        {profileSuccess && (
          <p className="mb-8 rounded-lg border border-primary/30 bg-primary-container/10 px-4 py-3 font-body-md text-body-md text-primary">
            {profileSuccess}
          </p>
        )}

        {/* Bento grid layout */}
        <div className="grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-10 lg:gap-x-14">
          {/* Column 1: Account details */}
          <section className="profile-card group md:col-span-5 rounded-xl p-8 lg:p-10">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="profile-card-title font-label-caps text-label-caps uppercase">
                Account details
              </h2>
            </div>

            <form className="space-y-7" onSubmit={handleSubmit}>
              <div className="group">
                <label className="profile-label block font-label-caps text-label-caps mb-2">
                  First name
                </label>
                <input
                  className="profile-input w-full rounded-lg px-4 py-3 font-body-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="text"
                  value={customerProfile.firstName}
                  onChange={handleChange("firstName")}
                />
              </div>

              <div className="group">
                <label className="profile-label block font-label-caps text-label-caps mb-2">
                  Last name
                </label>
                <input
                  className="profile-input w-full rounded-lg px-4 py-3 font-body-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="text"
                  value={customerProfile.lastName}
                  onChange={handleChange("lastName")}
                />
              </div>

              <div className="group">
                <label className="profile-label block font-label-caps text-label-caps mb-2">
                  Email (username)
                </label>
                <input
                  className="profile-input w-full rounded-lg px-4 py-3 font-body-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="email"
                  value={customerProfile.email}
                  onChange={handleChange("email")}
                />
              </div>

              <div className="group">
                <label className="profile-label block font-label-caps text-label-caps mb-2">
                  Phone
                </label>
                <input
                  className="profile-input w-full rounded-lg px-4 py-3 font-body-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="tel"
                  value={customerProfile.phone}
                  onChange={handleChange("phone")}
                />
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-outline-variant pt-7">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="profile-delete-action font-label-caps text-label-caps uppercase tracking-tight"
                >
                  Delete account
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-lg bg-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-tight text-on-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingProfile ? "Saving..." : "Update account"}
                </button>
              </div>
            </form>
          </section>

          {/* Column 2: Addresses & payment */}
          <div className="md:col-span-4 flex flex-col gap-grid-gutter">
            <section className="profile-card group flex-1 rounded-xl p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="profile-card-title font-label-caps text-label-caps uppercase">
                  Addresses
                </h2>
                <button
                  type="button"
                  className="profile-add-button"
                  aria-label="Add address"
                  // TODO: open add-address modal / navigate to add-address flow
                >
                  <AddAddressIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                {MOCK_ADDRESSES.map((address) => (
                  <div
                    key={address.id}
                    className="profile-address-card rounded-lg border border-outline-variant bg-surface-container-lowest/50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d4aa24] hover:bg-surface-container-lowest hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-body-md text-body-md font-bold text-on-surface">
                          {address.label}
                        </p>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                          {address.line}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="profile-icon-action profile-address-edit-action"
                          aria-label={`Edit ${address.label} address`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          className="profile-icon-action profile-address-delete-action"
                          aria-label={`Delete ${address.label} address`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-card group rounded-xl p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCardIcon className="h-6 w-6 text-[#d4aa24] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110" />
                  <div>
                    <p className="font-body-md text-body-md text-on-surface">
                      {MOCK_PAYMENT_METHOD.brand} ••••{" "}
                      {MOCK_PAYMENT_METHOD.last4}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <button
                        type="button"
                        className="profile-text-action text-[10px] font-label-caps uppercase"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="profile-text-action text-[10px] font-label-caps uppercase"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                {MOCK_PAYMENT_METHOD.isDefault && (
                  <span className="profile-badge rounded-full px-3 py-1 font-label-caps text-[10px] uppercase transition-transform duration-200 group-hover:-translate-y-0.5">
                    Default
                  </span>
                )}
              </div>
            </section>
          </div>

          {/* Column 3: Preferences & security */}
          <div className="md:col-span-3 flex flex-col gap-grid-gutter">
            <section className="profile-card group flex-1 rounded-xl p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="profile-card-title font-label-caps text-label-caps uppercase">
                  Preferences
                </h2>
                <button
                  type="button"
                  className="profile-text-action font-label-caps text-[10px] uppercase"
                >
                  Update
                </button>
              </div>

              <div className="space-y-7">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-on-surface">
                    Dietary needs
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Halal
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-on-surface">
                    Notifications
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationsOn}
                    aria-label="Toggle order notifications"
                    onClick={() => setNotificationsOn((prev) => !prev)}
                    className={`toggle-minimalist ${notificationsOn ? "on" : "off"}`}
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>
              </div>
            </section>

            <section className="profile-card group rounded-xl p-8 lg:p-10">
              <h2 className="profile-card-title mb-8 font-label-caps text-label-caps uppercase">
                Security
              </h2>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="profile-security-button group flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left font-body-md text-body-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span>Change password</span>
                  <ChevronRightIcon className="profile-security-chevron h-4 w-4 transition-all duration-200 group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  className="profile-security-button group flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left font-body-md text-body-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span>Two-factor auth</span>
                  <ChevronRightIcon className="profile-security-chevron h-4 w-4 transition-all duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <DashboardFooter />
    </>
  );
}
