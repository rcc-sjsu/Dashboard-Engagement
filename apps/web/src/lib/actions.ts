"use server";
import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import type { Provider } from "@repo/supabase/types";
import { revalidatePath } from "next/cache";

export type AuthState = {
  error?: string;
  success?: string;
};

const signInWithPassword = async (
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const supabase = await createClient();
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  return redirect("/");
};

const signInWithOAuth = async (provider: Provider) => {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL;
  const redirectTo = `${baseUrl}/api/auth/callback`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) {
    redirect("/signup");
  }

  if (data?.url) {
    return redirect(data.url as any);
  }

  return redirect("/");
};

const signOut = async () => {
  const supabase = await createClient();

  await supabase.auth.signOut();

  return redirect("/signin");
};

const signUpWithPassword = async (
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const supabase = await createClient();
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { data: signUpData, error } = await supabase.auth.signUp(data);

  if (signUpData.user) {
    const message ="An account with this email already exists.";

    return { error: message };
  }
  
  if (error) {
    return { error: error.message };
  }

  if (!signUpData.session) {
    return {
      success: "Check your email to verify your account before signing in.",
    };
  }

  revalidatePath("/", "layout");
  return redirect("/");
};

export { signInWithPassword, signInWithOAuth, signUpWithPassword, signOut };
