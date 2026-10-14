"use client";

import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { NAV, allItems } from "./navConfig";

function matchesPath(pathname, href, home) {
  if (pathname === href) return true;
  // The role home is every route's prefix, so it only lights on itself.
  return href !== home && pathname.startsWith(`${href}/`);
}

/**
 * The active nav item: longest matching href wins, so nested routes (an
 * order detail page) keep their section lit without lighting the root.
 * Items can claim routes that are not in the nav through `also`.
 */
export function useActiveItem(role) {
  const pathname = usePathname() ?? "";
  const home = NAV[role].home;
  let best = null;
  let bestLength = -1;
  for (const item of allItems(role)) {
    for (const href of [item.href, ...(item.also ?? [])]) {
      if (matchesPath(pathname, href, home) && href.length > bestLength) {
        best = item;
        bestLength = href.length;
      }
    }
  }
  return best ?? undefined;
}

export function useLogout() {
  const router = useRouter();
  return async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  };
}
