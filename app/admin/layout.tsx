import AdminSidebar from "./AdminSidebar";
import AdminAuthGuard from "./AdminAuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#050505] flex">
        <AdminSidebar />
        <main className="flex-1 ml-56 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
