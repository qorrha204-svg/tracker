"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/lib/auth-actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <main style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 360, padding: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>계정 만들기</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
          사내 이메일(@wonandone.co.kr)로만 가입할 수 있습니다.
        </p>

        {state?.success ? (
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            <p>{state.success}</p>
            <Link href="/login" style={{ color: "var(--brand)", fontWeight: 600 }}>로그인 화면으로 이동</Link>
          </div>
        ) : (
          <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              이름
              <input name="name" type="text" required style={inputStyle} />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              사내 이메일
              <input name="email" type="email" required placeholder="you@wonandone.co.kr" style={inputStyle} />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              비밀번호 (8자 이상)
              <input name="password" type="password" required minLength={8} style={inputStyle} />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              비밀번호 확인
              <input name="passwordConfirm" type="password" required minLength={8} style={inputStyle} />
            </label>

            {state?.error && <p style={{ color: "var(--status-delayed)", fontSize: 13 }}>{state.error}</p>}

            <button type="submit" disabled={pending} style={buttonStyle}>
              {pending ? "가입 처리 중..." : "가입하기"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: "var(--muted)" }}>
          이미 계정이 있으신가요? <Link href="/login" style={{ color: "var(--brand)", fontWeight: 600 }}>로그인</Link>
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
