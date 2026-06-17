import {
  Bell,
  BriefcaseBusiness,
  FileText,
  Gauge,
  Handshake,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

type AppSidebarProps = {
  companyName: string;
  userName: string;
  role: string;
};

export function AppSidebar({ companyName, userName, role }: AppSidebarProps) {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/solicitudes", label: "Solicitudes", icon: MessageSquareText },
    { href: "/presupuestos", label: "Presupuestos", icon: FileText },
    { href: "/servicios", label: "Servicios", icon: BriefcaseBusiness },
    { href: "/recordatorios", label: "Recordatorios", icon: Bell },
    { href: "/plantillas", label: "Plantillas", icon: Handshake },
    { href: "/configuracion", label: "Configuracion", icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span aria-hidden="true">
          <ShieldCheck size={20} />
        </span>
        <span>Millán Manager</span>
      </div>
      <div className="tenant-card">
        <strong>{companyName}</strong>
        <span>{userName} - {role}</span>
      </div>
      <nav className="nav" aria-label="Principal">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
        <LogoutButton />
      </nav>
    </aside>
  );
}
