"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, Clock3, Command, ExternalLink, Filter, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { formatGuideName, guides, type OAuthGuide } from "@/data/guides";
import { ThemeToggle } from "@/components/theme-toggle";

const marks: Record<string, { src: string; className: string }> = {
  github: { src: "https://cdn.simpleicons.org/github/FFFFFF", className: "mark-github" },
  slack: { src: "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/slack.svg", className: "mark-slack" },
  google: { src: "https://cdn.simpleicons.org/google/4285F4", className: "mark-google" },
  hubspot: { src: "https://cdn.simpleicons.org/hubspot/FF7A59", className: "mark-hubspot" },
};

function ProviderMark({ guide }: { guide: OAuthGuide }) {
  const mark = marks[guide.slug];
  const fallback = formatGuideName(guide.name).trim().charAt(0).toUpperCase() || "?";
  return <span className={`provider-mark ${mark?.className ?? "mark-generic"}`} aria-hidden="true">
    {mark ? <img src={mark.src} alt="" /> : fallback}
  </span>;
}

export default function Directory() {
  const [query, setQuery] = useState("");
  const [guideList, setGuideList] = useState(guides);
  const [difficulty, setDifficulty] = useState("All levels");
  const [approvalOnly, setApprovalOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/guides", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { guides?: OAuthGuide[] } | null) => {
        if (!cancelled && payload?.guides) setGuideList(payload.guides);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const visibleGuides = useMemo(() => guideList.filter((guide) => {
    const matchesText = `${guide.name} ${guide.summary}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesDifficulty = difficulty === "All levels" || guide.difficulty === difficulty;
    const matchesApproval = !approvalOnly || !guide.approval.requirement.toLowerCase().includes("no general pre-approval");
    return matchesText && matchesDifficulty && matchesApproval;
  }), [guideList, query, difficulty, approvalOnly]);
  const featuredGuide = guideList.find((guide) => guide.slug === "slack") ?? guides[1];

  async function shareDirectory() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link to share the directory:", window.location.href);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="AuthPath home"><span className="brand-icon"><Command size={18} strokeWidth={2.4} /></span><span>authpath<span className="brand-period">.</span></span></a>
        <nav className="top-nav" aria-label="Main navigation"><a className="nav-active" href="#directory">Explore guides</a><a href="#how-it-works">How it works</a></nav>
        <ThemeToggle />
        <button className="button button-small button-outline" onClick={shareDirectory}>{copied ? <Check size={15} /> : <ExternalLink size={15} />}{copied ? "Copied" : "Share directory"}</button>
      </header>

      <section className="hero" id="how-it-works">
        <div className="hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot" /> INTEGRATION READINESS / FIELD NOTES 01—04</div>
          <h1>Know the approval path <span>before you build.</span></h1>
          <p className="hero-copy">OAuth setup is more than a client ID. See the portal steps, permission choices, review waits, and handoffs each provider expects.</p>
          <a className="button button-primary hero-button" href="#directory">Browse the provider files <ArrowDown size={16} /></a>
          <div className="hero-proof"><span><ShieldCheck size={15} /> Provider sources</span><i /><span><Clock3 size={15} /> Work and wait separated</span><i /><span><Check size={15} /> Human steps made clear</span></div>
        </div>
        <div className="hero-visual">
          <div className="path-board">
            <div className="board-masthead"><span>PATH FILE / 002</span><span className="board-status"><i /> RESEARCHED</span></div>
            <div className="board-featured">
              <div><span className="board-label">FEATURED PROVIDER</span><h2>{formatGuideName(featuredGuide.name)}</h2><p>OAuth setup with a separate Marketplace review path.</p></div>
              <ProviderMark guide={featuredGuide} />
            </div>
            <div className="board-route-label"><span>THE ROUTE</span><span>3 checkpoints</span></div>
            <div className="board-route">
              <div className="board-checkpoint"><span>01</span><div><strong>Register the app</strong><small>Credentials + redirect URL</small></div></div>
              <div className="board-checkpoint"><span>02</span><div><strong>Build the connection</strong><small>Scopes + callback handling</small></div></div>
              <div className="board-checkpoint"><span>03</span><div><strong>Choose distribution</strong><small>Review applies to listing</small></div></div>
            </div>
            <div className="board-footer"><span><b>04</b> PROVIDERS IN THE DIRECTORY</span><span>Sources linked in each guide <ArrowRight size={13} /></span></div>
          </div>
        </div>
      </section>

      <section className="directory-section" id="directory">
        <div className="section-heading">
          <div><div className="eyebrow eyebrow-muted">THE PROVIDER INDEX / 01—04</div><h2>Choose your starting point</h2><p>Compare setup effort, permissions, and review paths.</p></div>
          <a className="generate-link" href="/generate"><span className="sparkle-icon"><Sparkles size={16} /></span><span><strong>Looking for another app?</strong><small>Generate a guide with AI research</small></span><ArrowRight size={17} /></a>
        </div>

        <div className="directory-controls">
          <label className="search-box"><Search size={18} /><span className="sr-only">Search apps</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search apps…" /><kbd>⌘ K</kbd>{query && <button aria-label="Clear search" className="clear-search" onClick={() => setQuery("")}><X size={15} /></button>}</label>
          <label className="filter-select"><Filter size={16} /><span className="sr-only">Filter by difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All levels</option><option>Low</option><option>Moderate</option><option>High</option></select></label>
          <button className={`approval-toggle ${approvalOnly ? "selected" : ""}`} onClick={() => setApprovalOnly(!approvalOnly)} aria-pressed={approvalOnly}><span className="toggle-check">{approvalOnly && <Check size={12} />}</span>Has review requirements</button>
          <span className="result-count">{visibleGuides.length} {visibleGuides.length === 1 ? "guide" : "guides"}</span>
        </div>

        {visibleGuides.length > 0 ? <div className="guide-grid">{visibleGuides.map((guide) => <GuideCard key={guide.slug} guide={guide} />)}</div> : <div className="empty-state"><span className="empty-icon"><Search size={21} /></span><h3>No guides match that search</h3><p>Try another app name or clear your filters.</p><button className="button button-outline" onClick={() => { setQuery(""); setDifficulty("All levels"); setApprovalOnly(false); }}>Clear filters</button></div>}

        <div className="evidence-note"><span className="evidence-check"><ShieldCheck size={17} /></span><p><strong>Built on evidence, not guesswork.</strong> Guides cite official provider documentation and clearly separate researched requirements from effort estimates and unknowns.</p><a href="#how-it-works" aria-label="Learn how guides are researched"><ArrowRight size={17} /></a></div>
      </section>

      <footer className="footer"><a className="brand footer-brand" href="/"><span className="brand-icon"><Command size={15} /></span><span>authpath<span className="brand-period">.</span></span></a><span>Make the path clear.</span><span>Guides are researched, not provider approvals.</span></footer>
    </main>
  );
}

function GuideCard({ guide }: { guide: OAuthGuide }) {
  const review = guide.approval.wait.toLowerCase().includes("up to") || guide.approval.requirement.toLowerCase().includes("marketplace") || guide.approval.requirement.toLowerCase().includes("verification");
  const effort = guide.activeEffort.estimate.replace(" (AuthPath estimate)", "");
  return (
    <a className="guide-card" href={`/guides/${guide.slug}`}>
      <div className="card-top"><ProviderMark guide={guide} /><span className={`difficulty difficulty-${guide.difficulty.toLowerCase()}`}><span />{guide.difficulty}</span></div>
      <h3>{formatGuideName(guide.name)}<ArrowRight className="card-arrow" size={17} /></h3>
      <p className="card-summary">{guide.summary}</p>
      <div className="card-meta"><span><Clock3 size={15} /><span><small>ACTIVE SETUP</small><strong>{effort}</strong></span></span><span className={`approval-pill ${review ? "approval-review" : "approval-simple"}`}><span className="approval-dot" />{review ? "Review may apply" : "No general review"}</span></div>
      <div className="card-bottom"><span><ShieldCheck size={14} /> Official documentation</span><span>{guide.sources.length} sources</span></div>
    </a>
  );
}
