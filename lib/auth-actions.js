"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "wonandone.co.kr";

function isCompanyEmail(email) {
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN.toLowerCase()}`);
}

export async function login(_prevState, formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "이메일 인증이 아직 완료되지 않았습니다. 받은 편지함을 확인해주세요." };
    }
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/");
}

export async function signup(_prevState, formData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (!name || !email || !password) {
    return { error: "모든 항목을 입력해주세요." };
  }
  if (!isCompanyEmail(email)) {
    return { error: `사내 이메일(@${ALLOWED_EMAIL_DOMAIN})만 가입할 수 있습니다.` };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  // Plain email/password signup doesn't need supabase-js's PKCE code path
  // (that's for OAuth/magic-link redirects) — call the REST endpoint
  // directly instead of supabase.auth.signUp().
  let res;
  try {
    res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, data: { name } }),
    });
  } catch (thrown) {
    return { error: `[FETCH THREW] ${thrown?.name}: ${thrown?.message} | cause: ${thrown?.cause?.message || thrown?.cause || "none"}` };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.msg || body.error_description || body.error || "";
    if (message.includes("already registered") || message.includes("already been registered")) {
      return { error: "이미 가입된 이메일입니다." };
    }
    return { error: message || "가입 처리 중 오류가 발생했습니다." };
  }

  return {
    success:
      "가입이 접수되었습니다. 입력하신 이메일로 발송된 인증 링크를 클릭해 인증을 완료한 뒤 로그인해주세요. 로그인 후 초기 권한은 '열람 전용'이며, 관리자가 편집 권한을 부여할 수 있습니다.",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
