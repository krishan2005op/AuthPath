import { NextRequest, NextResponse } from "next/server";
import { guides as starterGuides, type OAuthGuide } from "@/data/guides";
import { getPersistedGuides, isGuideStoreConfigured, isOAuthGuide, savePersistedGuide } from "@/lib/guide-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const saved = await getPersistedGuides();
    const bySlug = new Map<string, OAuthGuide>();
    for (const guide of starterGuides) bySlug.set(guide.slug, guide);
    for (const guide of saved) bySlug.set(guide.slug, guide);

    const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const difficulty = request.nextUrl.searchParams.get("difficulty");
    const approvalOnly = request.nextUrl.searchParams.get("approval") === "required";
    const results = [...bySlug.values()].filter((guide) => {
      const matchesText = !query || `${guide.name} ${guide.summary}`.toLowerCase().includes(query);
      const matchesDifficulty = !difficulty || difficulty === "All levels" || guide.difficulty === difficulty;
      const matchesApproval = !approvalOnly || hasReviewRequirement(guide);
      return matchesText && matchesDifficulty && matchesApproval;
    });

    return NextResponse.json({ guides: results, storageConfigured: isGuideStoreConfigured(), storageStatus: isGuideStoreConfigured() ? "connected" : "not-configured" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Keep the starter directory useful during database setup or an outage.
    const storageConfigured = isGuideStoreConfigured();
    return NextResponse.json({ guides: starterGuides, storageConfigured, storageStatus: storageConfigured ? "unavailable" : "not-configured" }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  if (!isGuideStoreConfigured()) {
    return NextResponse.json({ error: "Guide storage is not configured. Add the Supabase server credentials and apply the database schema." }, { status: 503 });
  }
  const writeToken = process.env.GUIDE_WRITE_TOKEN;
  if (!writeToken || request.headers.get("authorization") !== `Bearer ${writeToken}`) {
    return NextResponse.json({ error: "Guide write authorization is required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const candidate = body && typeof body === "object" && "guide" in body ? (body as { guide: unknown }).guide : body;
  if (!isOAuthGuide(candidate)) return NextResponse.json({ error: "Guide data is missing required fields or has an invalid shape." }, { status: 400 });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.slug) || candidate.slug.length > 80) {
    return NextResponse.json({ error: "Guide slug must contain lowercase letters, numbers, and single hyphens only." }, { status: 400 });
  }
  if (JSON.stringify(candidate).length > 200_000) return NextResponse.json({ error: "Guide data exceeds the 200 KB limit." }, { status: 413 });

  try {
    const guide = await savePersistedGuide(candidate);
    return NextResponse.json({ guide, url: `/guides/${guide.slug}` }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not save the guide. Check the Supabase connection and database schema." }, { status: 502 });
  }
}

function hasReviewRequirement(guide: OAuthGuide) {
  const text = `${guide.approval.requirement} ${guide.approval.wait}`.toLowerCase();
  return !text.includes("no general pre-approval") && !text.includes("no provider review wait identified");
}
