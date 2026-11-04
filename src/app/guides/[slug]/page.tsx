import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, CircleHelp, Clock3, ExternalLink, FileCheck2, Fingerprint, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { GuideActions } from "@/components/guide-actions";
import { GuideContentsNav } from "@/components/guide-contents-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatGuideName, guideBySlug } from "@/data/guides";
import { getPersistedGuide } from "@/lib/guide-store";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return ["github", "slack", "google", "hubspot"].map((slug) => ({ slug }));
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const savedGuide = await getPersistedGuide(slug).catch(() => null);
  const guide = savedGuide ?? guideBySlug(slug);
  if (!guide) notFound();

  const sourceById = new Map(guide.sources.map((source) => [source.id, source]));
  const isEstimated = guide.activeEffort.estimate.includes("estimate");
  const reviewUncertain = guide.approval.wait.toLowerCase().includes("unknown") || guide.approval.wait.toLowerCase().includes("no provider review wait identified");

  return (
    <main className="guide-page">
      <header className="guide-topbar">
        <a className="brand" href="/"><span className="brand-icon"><Fingerprint size={17} /></span><span>authpath<span className="brand-period">.</span></span></a>
        <div className="guide-top-actions"><a href="/#directory" className="back-link"><ArrowLeft size={15} /> All guides</a><ThemeToggle /><GuideActions /></div>
      </header>

      <div className="guide-layout">
        <aside className="guide-sidebar">
          <span className="side-label">IN THIS GUIDE</span>
          <GuideContentsNav />
          <div className="sidebar-note"><ShieldCheck size={16} /><p>Claims are linked to sources. Estimates and unknowns are labeled.</p></div>
        </aside>

        <article className="guide-content">
          <div className="guide-breadcrumb"><a href="/">Directory</a><span>/</span><span>{guide.name}</span></div>
          <section className="guide-title-block" id="overview">
            <div className="guide-title-row"><span className={`guide-provider-icon guide-${guide.slug}`}>{guide.slug === "google" ? "G" : guide.slug === "github" ? "◉" : guide.slug === "slack" ? "✣" : "◈"}</span><span className={`difficulty difficulty-${guide.difficulty.toLowerCase()}`}><span />{guide.difficulty} setup</span></div>
            <h1>{formatGuideName(guide.name)} OAuth setup</h1>
            <p className="guide-lede">{guide.summary}</p>
            <div className="guide-updated"><span><FileCheck2 size={14} /> Researched from official sources</span><i /><span>Updated {guide.verification.lastChecked}</span><i /><span className="not-tested-label"><CircleHelp size={14} /> OAuth flow not tested</span></div>
          </section>

          <div className="guide-metrics">
            <div className="metric-card"><div className="metric-icon metric-green"><Clock3 size={17} /></div><div><small>ACTIVE DEVELOPER WORK</small><strong>{guide.activeEffort.estimate}</strong><p>{guide.activeEffort.rationale}</p></div>{isEstimated && <span className="metric-estimate">ESTIMATE</span>}</div>
            <div className="metric-card"><div className="metric-icon metric-amber"><ShieldCheck size={17} /></div><div><small>PROVIDER REVIEW / WAIT</small><strong>{guide.approval.wait}</strong><p>{guide.approval.requirement}</p></div>{reviewUncertain && <span className="metric-estimate metric-unknown">UNKNOWN</span>}</div>
          </div>

          <section className="guide-section managed-callout">
            <div className="managed-icon"><Sparkles size={18} /></div><div><div className="section-kicker">DO YOU NEED YOUR OWN APP?</div><h2>{guide.managedOAuth.available === null ? "Managed OAuth availability is unknown" : guide.managedOAuth.available ? "A managed OAuth option may be available" : "No managed OAuth option was found"}</h2><p>{guide.managedOAuth.explanation}</p><SourceLinks ids={guide.managedOAuth.sourceIds} sources={sourceById} /></div>
          </section>

          <section className="guide-section" id="setup">
            <SectionHeading kicker="THE PATH" title="Setup steps" caption="Follow the steps in order. Provider-specific details and caveats are linked to their sources." />
            <ol className="steps-list">{guide.steps.map((step, index) => <li key={step.title} className="step-item"><span className="step-number">{String(index + 1).padStart(2, "0")}</span><div className="step-body"><div className="step-title-row"><h3>{step.title}</h3><EvidenceBadge status={step.evidence} /></div><p>{step.detail}</p><SourceLinks ids={step.sourceIds} sources={sourceById} /></div></li>)}</ol>
          </section>

          <section className="guide-section" id="permissions">
            <SectionHeading kicker="ACCESS DESIGN" title="Scopes & permissions" caption="Request the smallest set needed for your product. Scope requirements depend on the features and API calls you build." />
            <div className="scope-list">{guide.scopes.map((scope) => <div className="scope-card" key={scope.name}><div className="scope-title"><LockKeyhole size={16} /><h3>{scope.name}</h3></div><p>{scope.purpose}</p><div className="scope-note"><strong>Selection note</strong><span>{scope.selectionNote}</span></div><SourceLinks ids={scope.sourceIds} sources={sourceById} /></div>)}</div>
          </section>

          <section className="guide-section" id="requirements">
            <SectionHeading kicker="BEFORE YOU START" title="Prerequisites &amp; configuration" caption="Have these ready before you begin app registration." />
            <div className="requirements-grid"><div className="requirement-card"><h3><Check size={16} /> Prerequisites</h3><ul>{guide.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="requirement-card"><h3><ArrowUpRight size={16} /> Redirect URI</h3><p>{guide.redirectUri}</p></div><div className="requirement-card"><h3><LockKeyhole size={16} /> Client credentials</h3><p>{guide.credentials}</p></div></div>
          </section>

          <section className="guide-section" id="blockers">
            <SectionHeading kicker="WATCH FOR THESE" title="Potential blockers" caption="Resolve these early to avoid rework or delays." />
            <div className="blocker-list">{guide.blockers.map((blocker) => <div className="blocker-card" key={blocker.issue}><span className="blocker-mark">!</span><div><h3>{blocker.issue}</h3><p>{blocker.response}</p><SourceLinks ids={blocker.sourceIds} sources={sourceById} /></div></div>)}</div>
          </section>

          <section className="guide-section" id="handoff">
            <SectionHeading kicker="HUMAN HANDOFF" title="Who does what" caption="Research and preparation can be assisted; provider accounts and production credentials stay under your control." />
            <div className="handoff-grid"><div className="handoff-card agent-card"><h3><Sparkles size={16} /> The research agent can</h3><ul>{guide.agentCan.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="handoff-card developer-card"><h3><Fingerprint size={16} /> You will need to</h3><ul>{guide.developerMust.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
          </section>

          <section className="guide-section evidence-section" id="evidence">
            <SectionHeading kicker="EVIDENCE &amp; LIMITS" title="What we checked" caption={`Last researched ${guide.verification.lastChecked}. Documentation review is not the same as testing an OAuth flow.`} />
            <div className="verification-grid"><VerificationList title="Researched from sources" items={guide.verification.researched} icon={<ShieldCheck size={15} />} /><VerificationList title="Tested directly" items={guide.verification.tested} icon={<Check size={15} />} emptyLabel="No provider setup or OAuth flow was tested for this guide." /><VerificationList title="Unknown or use-case dependent" items={guide.verification.unknown} icon={<CircleHelp size={15} />} /></div>
            {guide.evidence?.length ? <div className="claim-evidence"><h3>Claim-level evidence</h3><p className="claim-caveat">The research agent assigns these labels from cited pages. They are not provider approval or direct OAuth tests.</p>{guide.evidence.map((item, index) => <div className="claim-row" key={`${item.claim}-${index}`}><p>{item.claim}</p><div className="claim-meta"><span>{item.verificationStatus}</span><span>{item.sourceType}</span><span>{item.confidence} confidence</span></div><SourceLinks ids={item.sourceIds} sources={sourceById} /></div>)}</div> : null}
            <div className="sources-block"><h3>Sources used</h3><ol>{guide.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer"><span>{source.title}{source.type && <em className={`source-kind source-kind-${source.type}`}>{source.type === "provider-docs" ? "Provider docs · domain matched" : source.type === "integration-directory" ? "Integration directory" : source.type === "third-party" ? "Third-party source" : "Official status unconfirmed"}</em>}</span><small>{source.publisher}{source.confidence ? ` · ${source.confidence} confidence` : ""}</small><ExternalLink size={13} /></a></li>)}</ol></div>
          </section>

          <div className="guide-bottom-cta"><div><strong>Ready to take the next step?</strong><p>Use this checklist as a starting point, then confirm requirements for your exact app and scopes.</p></div><GuideActions /></div>
        </article>
      </div>
    </main>
  );
}

function SectionHeading({ kicker, title, caption }: { kicker: string; title: string; caption: string }) {
  return <div className="guide-section-heading"><div className="section-kicker">{kicker}</div><h2>{title}</h2><p>{caption}</p></div>;
}

function EvidenceBadge({ status }: { status: "official-docs" | "estimate" | "unknown" }) {
  const label = status === "official-docs" ? "Official docs" : status === "estimate" ? "Estimate" : "Unknown";
  return <span className={`evidence-badge evidence-${status}`}>{status === "official-docs" ? <ShieldCheck size={12} /> : status === "estimate" ? <Clock3 size={12} /> : <CircleHelp size={12} />}{label}</span>;
}

function SourceLinks({ ids, sources }: { ids: string[]; sources: Map<string, { id: string; title: string; url: string; publisher: string }> }) {
  const linked = ids.map((id) => sources.get(id)).filter((source): source is NonNullable<typeof source> => Boolean(source));
  if (!linked.length) return null;
  return <div className="inline-sources">{linked.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.publisher}<ExternalLink size={11} /></a>)}</div>;
}

function VerificationList({ title, items, icon, emptyLabel }: { title: string; items: string[]; icon: React.ReactNode; emptyLabel?: string }) {
  return <div className="verification-card"><h3>{icon}{title}</h3>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="verification-empty">{emptyLabel ?? "None recorded."}</p>}</div>;
}

