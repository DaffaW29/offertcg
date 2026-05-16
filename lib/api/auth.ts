import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "./rate-limit";

type AuthResult =
  | { authenticated: true; userId: string }
  | { authenticated: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    };
  }

  return { authenticated: true, userId: user.id };
}

export async function requireAuthWithRateLimit(routeKey: string): Promise<AuthResult> {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth;

  const { success, reset } = await checkRateLimit(
    `${routeKey}:${auth.userId}`
  );

  if (!success) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000))
          }
        }
      )
    };
  }

  return auth;
}
