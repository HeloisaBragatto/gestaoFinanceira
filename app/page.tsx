import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import LoginPageFeed from "@/components/feed/first/login-page-feed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/protected");
  }

  return (
    <main className="h-screen flex flex-col">
      {!hasEnvVars ? <EnvVarWarning /> : <LoginPageFeed />}
    </main>
  );
}
