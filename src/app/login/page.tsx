import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark" aria-hidden="true">
          <ShieldCheck size={24} />
        </div>
        <h1>Control IT Hub</h1>
        <p className="muted">
          Acceso seguro para empresas, licencias, integraciones y registros operativos.
        </p>
        <LoginForm />
      </section>
      <section className="login-aside" aria-label="Infraestructura IT" />
    </main>
  );
}
