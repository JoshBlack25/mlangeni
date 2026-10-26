"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, Panel, focusRing } from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

// This page rendered an empty <div> before, which made /dashboard/admin/tools a
// dead end — the menu editor and the testimonials queue were only reachable by
// typing the URL or clicking a stats card.
const tools = [
  {
    title: "Menu editor",
    description:
      "Add, edit, price and archive the dishes and drinks customers can choose from.",
    href: "/dashboard/admin/tools/menu-editor",
  },
  {
    title: "Package editor",
    description:
      "Build the pre-made menus customers can book as packages.",
    href: "/dashboard/admin/tools/premade-menu",
  },
  {
    title: "Testimonials",
    description:
      "Approve or reject customer reviews, and choose which ones appear on the homepage.",
    href: "/dashboard/admin/tools/testimonials",
  },
];

export default function ToolsOverview() {
  return (
    <div>
      <PageHeader
        density="dense"
        title="Tools"
        lead="Everything that changes what customers see on the website."
      />

      <Panel density="dense" className="py-1 md:py-1">
        <ul className="divide-y divide-mgh-line-soft">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className={cn(
                  "group -mx-2 flex min-h-14 items-center justify-between gap-4 rounded-control px-2 py-3 transition-colors hover:bg-mgh-surface-2",
                  focusRing,
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-mgh-text">
                    {tool.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-mgh-muted">
                    {tool.description}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-mgh-dim transition-colors group-hover:text-mgh-text"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
