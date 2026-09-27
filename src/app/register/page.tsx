"use client";

import { AuthForm } from "@/components/AuthForm";

async function register(email: string, password: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Registration failed.");
  }
}

export default function RegisterPage() {
  return <AuthForm mode="register" onSubmit={register} />;
}
