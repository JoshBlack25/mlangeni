"use client";

import Link from "next/link";
import { ArrowUpRight, MessageSquareQuote, UtensilsCrossed } from "lucide-react";

// This page rendered an empty <div> before, which made /dashboard/admin/tools a
// dead end — the menu editor and the testimonials queue were only reachable by
// typing the URL or clicking a stats card.
const tools = [
  {
    title: "Menu editor",
    description:
      "Add, edit, price and archive the dishes and drinks customers can choose from.",
    href: "/dashboard/admin/tools/menu-editor",
    icon: UtensilsCrossed,
  },
  {
    title: "Testimonials",
    description:
      "Approve or reject customer reviews, and choose which ones appear on the homepage.",
    href: "/dashboard/admin/tools/testimonials",
    icon: MessageSquareQuote,
  },
];

export default function ToolsOverview() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Tools</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A0A0A0]">
          Everything that changes what customers see on the website.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            >
              <div className="flex items-start justify-between gap-4">
                <Icon className="text-[#D4AF37]" size={24} />
                <ArrowUpRight
                  size={16}
                  className="text-[#A0A0A0] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D4AF37]"
                />
              </div>
              <h2 className="mt-4 text-base font-semibold text-white">
                {tool.title}
              </h2>
              <p className="mt-1.5 text-sm text-[#A0A0A0]">{tool.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
