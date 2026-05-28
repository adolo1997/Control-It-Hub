import { AppSidebar } from "@/components/app-sidebar";
import { requireCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCurrentSession();

  return (
    <div className="app-shell">
      <AppSidebar
        companyName={session.company.name}
        role={session.membershipRole}
        userName={session.user.name}
      />
      <main className="main">{children}</main>
    </div>
  );
}
