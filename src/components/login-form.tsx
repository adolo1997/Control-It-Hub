"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    setIsLoading(false);

    if (!response.ok) {
      setError("Credenciales no validas o usuario inactivo.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {error ? <div className="error">{error}</div> : null}
      <label className="field">
        Email
        <input className="input" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        Password
        <input
          className="input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className="button" disabled={isLoading} type="submit">
        <LogIn size={18} />
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
