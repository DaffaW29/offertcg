import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthWithRateLimit } from "@/lib/api/auth";
import { searchCardsWithFallback } from "@/lib/pricing";
import { DEFAULT_SEARCH_PAGE, SEARCH_PAGE_SIZE } from "@/lib/pricing/types";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  q: z.string().min(2, "Enter at least 2 characters to search.").max(80, "Search is too long. Keep it under 80 characters."),
  set: z.string().max(120).optional(),
  number: z.string().max(20).optional(),
  rarity: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).optional()
});

export async function GET(request: Request) {
  const auth = await requireAuthWithRateLimit("cards-search");
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({
    q: searchParams.get("q")?.trim(),
    set: searchParams.get("set")?.trim() || undefined,
    number: searchParams.get("number")?.trim() || undefined,
    rarity: searchParams.get("rarity")?.trim() || undefined,
    page: searchParams.get("page") || undefined
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid search parameters.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { q, set, number, rarity, page } = parsed.data;

  try {
    const result = await searchCardsWithFallback({
      query: q,
      setName: set,
      cardNumber: number,
      rarity,
      page: page ?? DEFAULT_SEARCH_PAGE,
      pageSize: SEARCH_PAGE_SIZE
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search card prices."
      },
      { status: 500 }
    );
  }
}
