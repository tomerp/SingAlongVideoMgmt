"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard/videos", label: "Videos" },
  { href: "/dashboard/videos/new", label: "Add Video" },
  { href: "/dashboard/sync", label: "Sync" },
  { href: "/dashboard/playlists", label: "Playlists" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/setup", label: "Setup" },
];

export function DashboardNav() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
