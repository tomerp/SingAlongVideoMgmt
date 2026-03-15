"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";

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
  const router = useRouter();
  const unsaved = useUnsavedChanges();

  const isOnEventEditPage =
    pathname.startsWith("/dashboard/events/") && pathname !== "/dashboard/events";

  function handleNavClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (
      unsaved?.hasUnsavedChanges &&
      isOnEventEditPage &&
      pathname !== href
    ) {
      e.preventDefault();
      if (confirm("You have unsaved changes. Leave without saving?")) {
        unsaved.setHasUnsavedChanges(false);
        router.push(href);
      }
    }
  }

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
              onClick={(e) => handleNavClick(e, href)}
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
