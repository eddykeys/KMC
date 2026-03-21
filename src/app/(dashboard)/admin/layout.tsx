export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar + Topbar will be implemented in admin dashboard phase */}
      <main>{children}</main>
    </div>
  );
}
