import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { cn } from "@/lib/utils";

import { OAuthButton } from "@/components/oauth-button";
import SignInForm from "@/components/auth/sign-in-form";

export default async function SignInPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <div className="flex flex-col gap-6">
            <SignInForm />
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-1">
              <OAuthButton provider="google" />
            </div>
          </div>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
            and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
