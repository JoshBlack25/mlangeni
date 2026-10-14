"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

export function useRoleGuard(requiredRole) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function verify() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Remember the page so sign-in can return here (see app/login).
        const next = encodeURIComponent(window.location.pathname);
        router.replace(`/login?next=${next}`);
        return;
      }

      const { data: isAdmin, error } = await supabase.rpc("is_admin");

      if (error) {
        console.error("Role check failed:", error);
        router.replace("/login");
        return;
      }

      const actualRole = isAdmin ? "admin" : "customer";

      if (actualRole !== requiredRole) {
        router.replace(
          actualRole === "admin" ? "/dashboard/admin" : "/dashboard/customer",
        );
        return;
      }

      if (active) setChecking(false);
    }

    verify();
    return () => {
      active = false;
    };
  }, [router, requiredRole]);

  return checking;
}
