import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@repo/supabase/server";



export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";


  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const user = data.user;
      const email = user.email?.toLowerCase();
      
      if (!email) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/signin?error=not_authorized`);
      }

      const adminClient = await createAdminClient();
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("id, name, avatar")
        .ilike("email", email)
        .maybeSingle();

      if (profileError || !profile) {
        console.warn(`Unauthorized login attempt: ${email}`);
        await supabase.auth.signOut();
        await adminClient.auth.admin.deleteUser(user.id);
        return NextResponse.redirect(`${origin}/signin?error=not_authorized`);
      }

      const identityData = user.identities?.[0]?.identity_data ?? {};
      const metadata = user.user_metadata ?? {};
      const resolvedName =
        (metadata.full_name as string | undefined) ||
        (metadata.name as string | undefined) ||
        (metadata.display_name as string | undefined) ||
        (identityData.full_name as string | undefined) ||
        (identityData.name as string | undefined) ||
        profile.name ||
        email;
      const resolvedAvatar =
        (metadata.avatar_url as string | undefined) ||
        (metadata.picture as string | undefined) ||
        (identityData.avatar_url as string | undefined) ||
        (identityData.picture as string | undefined) ||
        profile.avatar ||
        "";

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          user_id: user.id,
          name: resolvedName,
          avatar: resolvedAvatar,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Failed to update profile after OAuth sign-in:", updateError);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}



