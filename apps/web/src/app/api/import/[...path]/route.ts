import { proxyToBackend } from "@/lib/backend-proxy";
import { createClient } from "@repo/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function handler(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ detail: "Authentication required" }, { status: 401 });
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || profile?.role !== "admin") {
    return Response.json({ detail: "Admin access required" }, { status: 403 });
  }
  const { path = [] } = await context.params;
  const suffix = path.length > 0 ? `/${path.join("/")}` : "";
  return proxyToBackend(request, `/api/import${suffix}`);
}

export async function GET(request: Request, context: RouteContext) {
  return handler(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handler(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handler(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handler(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handler(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return handler(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return handler(request, context);
}
