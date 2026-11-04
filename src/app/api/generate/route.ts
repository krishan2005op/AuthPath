import { NextRequest, NextResponse } from "next/server";
import { guideBySlug } from "@/data/guides";
import { getPersistedGuide, isGuideStoreConfigured, savePersistedGuide } from "@/lib/guide-store";
import { buildGuide, ResearchAgentError, stableSlug, type ResearchInput } from "@/lib/research-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the local .env file." }, { status: 503 });
  }
  if (!isGuideStoreConfigured()) {
    return NextResponse.json({ error: "Guide storage is not configured. Add the Supabase server credentials first." }, { status: 503 });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 10_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Enter an app name or website to continue." }, { status: 400 }); }

  const input = parseInput(body);
  if (!input) return NextResponse.json({ error: "Enter an app name or a valid website URL. You can provide both." }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      void (async () => {
        try {
          const slug = stableSlug(input);
          send({ type: "stage", stage: "identify", message: "Checking the requested app and its identity." });

          const existing = await getPersistedGuide(slug).catch(() => null) ?? guideBySlug(slug);
          if (existing) {
            send({ type: "stage", stage: "reuse", message: "An existing guide matches this app; reusing its saved URL." });
            send({ type: "complete", guide: existing, url: `/guides/${existing.slug}`, reused: true });
            return;
          }

          const guide = await buildGuide(input, (stage, message, detail) => send({ type: "stage", stage, message, detail }));
          send({ type: "stage", stage: "save", message: "Saving the guide and creating its shareable URL." });
          const saved = await savePersistedGuide(guide);
          send({ type: "complete", guide: saved, url: `/guides/${saved.slug}`, reused: false });
        } catch (error) {
          const message = error instanceof ResearchAgentError
            ? error.message
            : "The research could not be completed. Check the API and database configuration, then try again.";
          send({ type: "error", message });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function parseInput(value: unknown): ResearchInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim().slice(0, 120) : "";
  const rawWebsite = typeof record.website === "string" ? record.website.trim().slice(0, 300) : "";
  if (!name && !rawWebsite) return null;

  let website: string | undefined;
  if (rawWebsite) {
    try {
      const normalized = /^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`;
      const url = new URL(normalized);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.hostname === "localhost") return null;
      url.hash = "";
      website = url.toString();
    } catch { return null; }
  }
  return { name, website };
}
