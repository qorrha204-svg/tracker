"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth-actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 360, padding: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>영업조직 핵심과제 Tracker</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>사내 계정으로 로그인하세요.</p>

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            이메일
            <input name="email" type="email" required placeholder="you@wonandone.co.kr" style={inputStyle} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            비밀번호
            <input name="password" type="password" required style={inputStyle} />
          </label>

          {state?.error && <p style={{ color: "var(--status-delayed)", fontSize: 13 }}>{state.error}</p>}

          <button type="submit" disabled={pending} style={buttonStyle}>
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: "var(--muted)" }}>
          계정이 없으신가요? <Link href="/signup" style={{ color: "var(--brand)", fontWeight: 600 }}>가입하기</Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 14,
};

const buttonStyle = {
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  background: "var(--brand)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};
