"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import { ROLE_LABEL } from "@/lib/constants";
import { isAdminLevel } from "@/lib/permissions";

const NAV = [
  { href: "/", label: "개요" },
  { href: "/tasks", label: "과제" },
];

export default function AppShell({ profile, children }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <strong style={{ fontSize: 15 }}>영업조직 핵심과제 Tracker</strong>
          <nav style={{ display: "flex", gap: 4 }}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: pathname === item.href ? "var(--brand)" : "var(--muted)",
                  background: pathname === item.href ? "var(--brand-soft)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            ))}
            {isAdminLevel(profile?.role) && (
              <Link
                href="/admin/users"
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: pathname === "/admin/users" ? "var(--brand)" : "var(--muted)",
                  background: pathname === "/admin/users" ? "var(--brand-soft)" : "transparent",
                }}
              >
                권한 관리
              </Link>
            )}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>
            {profile?.name || profile?.email}
            {ROLE_LABEL[profile?.role] ? ` · ${ROLE_LABEL[profile.role]}` : ""}
          </span>
          <form action={logout}>
            <button
              type="submit"
              style={{ border: "1px solid var(--border)", background: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main style={{ flex: 1, padding: 24, maxWidth: 1200, width: "100%", margin: "0 auto" }}>{children}</main>
    </div>
  );
}
