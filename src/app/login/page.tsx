"use client";

import { AuthForm } from "@/components/AuthForm";

async function login(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Sign in failed.");
  }
}

export default function LoginPage() {
  return <AuthForm mode="login" onSubmit={login} />;
}
