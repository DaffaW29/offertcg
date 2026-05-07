import { NextResponse } from "next/server";
import { searchCardsWithFallback } from "@/lib/pricing";
import {
  DEFAULT_SEARCH_PAGE,
  SEARCH_PAGE_SIZE
} from "@/lib/pricing/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Enter at least 2 characters to search." },
      { status: 400 }
    );
  }

  if (query.length > 80) {
    return NextResponse.json(
      { error: "Search is too long. Keep it under 80 characters." },
      { status: 400 }
    );
  }

  const setName = cleanOptional(searchParams.get("set"));
  const cardNumber = cleanOptional(searchParams.get("number"));
  const rarity = cleanOptional(searchParams.get("rarity"));
  const page = parsePage(searchParams.get("page"));

  try {
    const result = await searchCardsWithFallback({
      query,
      setName,
      cardNumber,
      rarity,
      page,
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

function cleanOptional(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parsePage(value: string | null) {
  const page = Number(value);

  if (!Number.isFinite(page)) {
    return DEFAULT_SEARCH_PAGE;
  }

  return Math.max(DEFAULT_SEARCH_PAGE, Math.floor(page));
}
