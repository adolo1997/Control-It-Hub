import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
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
