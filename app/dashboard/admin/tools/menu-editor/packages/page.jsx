import { redirect } from "next/navigation";

// Package editing now lives in the Tools section (premade-menu). This old
// placeholder route redirects there so existing links don't dead-end.
export default function PackagesPage() {
  redirect("/dashboard/admin/tools/premade-menu");
}
