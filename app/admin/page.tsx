import { hasValidSession, isAdminConfigured } from "@/lib/admin";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isAdminConfigured();
  const authed = await hasValidSession();

  if (!configured) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-sm px-6 py-24 text-center">
          <h1 className="text-2xl font-bold tracking-tight">管理后台</h1>
          <p className="mt-3 text-sm text-text-secondary">
            服务器未配置{" "}
            <code className="font-mono text-text-brand">ADMIN_PASSWORD</code>{" "}
            环境变量,请先在 .env.local 中设置。
          </p>
        </div>
      </AdminShell>
    );
  }

  if (!authed) {
    return (
      <AdminShell>
        <AdminLogin />
      </AdminShell>
    );
  }

  const postCounts = {
    zh: getAllPosts("zh").length,
    en: getAllPosts("en").length,
  };

  return (
    <AdminShell>
      <AdminPanel postCounts={postCounts} />
    </AdminShell>
  );
}
