import { NextResponse } from "next/server";
import { guideBySlug } from "@/data/guides";
import { getPersistedGuide } from "@/lib/guide-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const saved = await getPersistedGuide(slug);
    if (saved) return NextResponse.json({ guide: saved }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Starter guides remain available if the database is offline.
  }

  const starter = guideBySlug(slug);
  if (!starter) return NextResponse.json({ error: "Guide not found." }, { status: 404 });
  return NextResponse.json({ guide: starter }, { headers: { "Cache-Control": "no-store" } });
}
