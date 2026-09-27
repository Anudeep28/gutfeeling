"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "login" ? "Sign in" : "Create an account";
  const action = mode === "login" ? "Sign in" : "Create account";
  const altText = mode === "login" ? "Don't have an account?" : "Already have an account?";
  const altHref = mode === "login" ? "/register" : "/login";
  const altLabel = mode === "login" ? "Create one" : "Sign in";

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>{title}</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Please wait…" : action}</button>
        </form>
        <p className="auth-switch">{altText} <Link href={altHref}>{altLabel}</Link></p>
      </div>
    </main>
  );
}
