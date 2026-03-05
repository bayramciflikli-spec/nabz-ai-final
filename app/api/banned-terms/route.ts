import { NextResponse } from "next/server";
import { getBannedTerms } from "@/lib/bannedTermsStorage";

/**
 * GET: Yasaklı terim listesini döner (public, cache için)
 */
export async function GET() {
  try {
    const { terms } = await getBannedTerms();
    return NextResponse.json({ terms });
  } catch (e: unknown) {
    console.error("[banned-terms]", e);
    return NextResponse.json({ terms: [] }, { status: 500 });
  }
}
