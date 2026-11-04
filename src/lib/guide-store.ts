import type { OAuthGuide } from "@/data/guides";

type SupabaseGuideRow = { slug: string; data: OAuthGuide };

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = secretKey || legacyServiceRoleKey;
  if (!url || !key) return null;
  return { url, key, legacy: !secretKey };
}

export function isGuideStoreConfigured() {
  return supabaseConfig() !== null;
}

function serviceHeaders(key: string, legacy: boolean, prefer?: string) {
  return {
    apikey: key,
    ...(legacy ? { Authorization: `Bearer ${key}` } : {}),
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function getPersistedGuides(): Promise<OAuthGuide[]> {
  const config = supabaseConfig();
  if (!config) return [];

  const response = await fetch(`${config.url}/rest/v1/guides?select=slug,data&limit=500`, {
    headers: serviceHeaders(config.key, config.legacy),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Guide store read failed (${response.status}).`);
  const rows = (await response.json()) as SupabaseGuideRow[];
  return rows.map((row) => row.data).filter(isOAuthGuide);
}

export async function getPersistedGuide(slug: string): Promise<OAuthGuide | null> {
  const config = supabaseConfig();
  if (!config) return null;

  const query = new URLSearchParams({ select: "slug,data", slug: `eq.${slug}`, limit: "1" });
  const response = await fetch(`${config.url}/rest/v1/guides?${query}`, {
    headers: serviceHeaders(config.key, config.legacy),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Guide store read failed (${response.status}).`);
  const rows = (await response.json()) as SupabaseGuideRow[];
  const guide = rows[0]?.data;
  return guide && isOAuthGuide(guide) ? guide : null;
}

export async function savePersistedGuide(guide: OAuthGuide) {
  const config = supabaseConfig();
  if (!config) throw new Error("Guide storage is not configured.");

  const response = await fetch(`${config.url}/rest/v1/guides?on_conflict=slug`, {
    method: "POST",
    headers: serviceHeaders(config.key, config.legacy, "resolution=merge-duplicates,return=representation"),
    body: JSON.stringify({ slug: guide.slug, name: guide.name, data: guide, origin: "generated" }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Guide store write failed (${response.status}).`);
  const rows = (await response.json()) as SupabaseGuideRow[];
  return rows[0]?.data ?? guide;
}

/** Minimal runtime validation for data coming from the public API boundary. */
export function isOAuthGuide(value: unknown): value is OAuthGuide {
  if (!isRecord(value)) return false;
  const guide = value;
  const sourceIds = Array.isArray(guide.sources) ? guide.sources.map((source) => isRecord(source) ? source.id : undefined) : [];
  const knownSourceIds = new Set(sourceIds.filter((id): id is string => typeof id === "string"));
  const refsExist = (ids: unknown) => isStringArray(ids) && ids.every((id) => knownSourceIds.has(id));

  return typeof guide.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug) && guide.slug.length <= 80
    && isShortText(guide.name, 100)
    && isShortText(guide.summary, 500)
    && (guide.difficulty === "Low" || guide.difficulty === "Moderate" || guide.difficulty === "High")
    && isRecord(guide.activeEffort) && isShortText(guide.activeEffort.estimate, 160) && isShortText(guide.activeEffort.rationale, 500)
    && isRecord(guide.approval) && isShortText(guide.approval.requirement, 500) && isShortText(guide.approval.wait, 300) && isShortText(guide.approval.note, 500)
    && isRecord(guide.managedOAuth) && typeof guide.managedOAuth.available === "boolean"
    && isShortText(guide.managedOAuth.explanation, 500) && refsExist(guide.managedOAuth.sourceIds)
    && isStringArray(guide.prerequisites) && guide.prerequisites.length <= 30
    && isShortText(guide.redirectUri, 800) && isShortText(guide.credentials, 800)
    && Array.isArray(guide.scopes) && guide.scopes.length <= 40 && guide.scopes.every((scope) => isRecord(scope)
      && isShortText(scope.name, 160) && isShortText(scope.purpose, 500) && isShortText(scope.selectionNote, 500) && refsExist(scope.sourceIds))
    && Array.isArray(guide.steps) && guide.steps.length <= 40 && guide.steps.every((step) => isRecord(step)
      && isShortText(step.title, 160) && isShortText(step.detail, 1200)
      && (step.evidence === "official-docs" || step.evidence === "estimate" || step.evidence === "unknown") && refsExist(step.sourceIds))
    && Array.isArray(guide.blockers) && guide.blockers.length <= 40 && guide.blockers.every((blocker) => isRecord(blocker)
      && isShortText(blocker.issue, 400) && isShortText(blocker.response, 800) && refsExist(blocker.sourceIds))
    && isStringArray(guide.agentCan) && isStringArray(guide.developerMust)
    && Array.isArray(guide.sources) && guide.sources.length > 0 && guide.sources.length <= 40 && guide.sources.every((source) => isRecord(source)
      && isShortText(source.id, 80) && isShortText(source.title, 200) && isShortText(source.publisher, 100)
      && typeof source.url === "string" && isHttpUrl(source.url))
    && isRecord(guide.verification) && isStringArray(guide.verification.researched)
    && isStringArray(guide.verification.tested) && isStringArray(guide.verification.unknown)
    && typeof guide.verification.lastChecked === "string" && /^\d{4}-\d{2}-\d{2}$/.test(guide.verification.lastChecked);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isShortText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === "string" && item.length <= 1200);
}

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
