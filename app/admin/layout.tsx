import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = ["rav.khangurra@gmail.com"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/signin?next=/admin");
    }

    const role = user.app_metadata?.role || user.user_metadata?.role;
    const isAdmin = role === "admin" || ADMIN_EMAILS.includes(user.email ?? "");

    if (!isAdmin) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
