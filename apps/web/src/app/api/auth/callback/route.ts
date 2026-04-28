import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@repo/supabase/server";

const normalizeEmail = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? "";

type AuthorizedProfile = {
  id: string;
  name: string | null;
  avatar: string | null;
  email?: string | null;
};

async function findAuthorizedProfile(
  email: string,
): Promise<AuthorizedProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const adminClient = await createAdminClient();

  // Fast path: exact match for normalized emails.
  const { data: directMatch, error: directError } = await adminClient
    .from("profiles")
    .select("id, name, avatar, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (directError) {
    throw directError;
  }

  if (directMatch) {
    return directMatch as AuthorizedProfile;
  }

  // Fallback path: normalize whitespace/casing to handle legacy profile data.
  // Use pagination so large profile tables are fully scanned.
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data: candidates, error: candidateError } = await adminClient
      .from("profiles")
      .select("id, name, avatar, email")
      .not("email", "is", null)
      .range(from, to);

    if (candidateError) {
      throw candidateError;
    }

    if (!candidates || candidates.length === 0) {
      return null;
    }

    const match = (candidates as AuthorizedProfile[]).find(
      (profile) => normalizeEmail(profile.email) === normalizedEmail,
    );

    if (match) {
      return match;
    }

    if (candidates.length < pageSize) {
      return null;
    }

    from += pageSize;
  }
}

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

      let profile: AuthorizedProfile | null = null;
      try {
        profile = await findAuthorizedProfile(email);
      } catch (profileError) {
        console.error("Failed to resolve authorized profile for OAuth user:", profileError);
      }

      const adminClient = await createAdminClient();

      if (!profile) {
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

