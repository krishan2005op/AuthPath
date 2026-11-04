"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, Command, Copy, ExternalLink, LoaderCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { formatGuideName, type OAuthGuide } from "@/data/guides";
import { ThemeToggle } from "@/components/theme-toggle";

type ProgressStage = "identify" | "sources" | "structure" | "validate" | "save";
type StageState = "waiting" | "active" | "complete" | "failed";
type Result = { guide: OAuthGuide; url: string; reused: boolean };
const stages: { id: ProgressStage; label: string }[] = [
  { id: "identify", label: "Identify the app" },
  { id: "sources", label: "Search documentation" },
  { id: "structure", label: "Prepare setup guide" },
  { id: "validate", label: "Validate claims and links" },
  { id: "save", label: "Save shareable guide" },
];

export function GuideGenerator() {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState("");
  const [states, setStates] = useState<Record<ProgressStage, StageState>>({ identify: "waiting", sources: "waiting", structure: "waiting", validate: "waiting", save: "waiting" });
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const terminalEvent = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setResult(null); setBusy(true); setMessage(""); setDetail("");
    terminalEvent.current = false;
    setStates({ identify: "waiting", sources: "waiting", structure: "waiting", validate: "waiting", save: "waiting" });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ name, website }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Could not start guide research.");
      }
      if (!response.body) throw new Error("The research stream did not start. Please try again.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? "";
        for (const frame of frames) handleFrame(frame);
      }
      buffer += decoder.decode();
      if (buffer.trim()) handleFrame(buffer);
      if (!terminalEvent.current) {
        setError("Research ended before a guide was saved. Please try again.");
        setBusy(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate the guide.");
      setBusy(false);
      markActiveStepFailed();
    }
  }

  function handleFrame(frame: string) {
    const dataLine = frame.split(/\r?\n/).find((line) => line.startsWith("data: "));
    if (!dataLine) return;
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(dataLine.slice(6)) as Record<string, unknown>; }
    catch { return; }

    if (payload.type === "stage") {
      const stage = payload.stage as string;
      setMessage(typeof payload.message === "string" ? payload.message : "Working on the guide.");
      setDetail(typeof payload.detail === "string" ? payload.detail : "");
      if (stage === "reuse") {
        setStates((previous) => ({ ...previous, identify: "complete" }));
      } else if (stages.some((item) => item.id === stage)) {
        const currentIndex = stages.findIndex((item) => item.id === stage);
        setStates(Object.fromEntries(stages.map((item, index) => [item.id, index < currentIndex ? "complete" : index === currentIndex ? "active" : "waiting"])) as Record<ProgressStage, StageState>);
      }
    } else if (payload.type === "complete" && isGuide(payload.guide) && typeof payload.url === "string") {
      terminalEvent.current = true;
      const done = { guide: payload.guide, url: payload.url, reused: payload.reused === true };
      setResult(done);
      setBusy(false);
      setError("");
      if (!done.reused) setStates({ identify: "complete", sources: "complete", structure: "complete", validate: "complete", save: "complete" });
      setMessage(done.reused ? "Existing guide found." : "Guide researched and saved.");
      setDetail(done.reused ? "No new search was run; this app already has a guide." : "The guide has a persistent URL and its research sources are listed below.");
    } else if (payload.type === "error") {
      terminalEvent.current = true;
      setError(typeof payload.message === "string" ? payload.message : "The research could not be completed.");
      setBusy(false);
      markActiveStepFailed();
    }
  }

  function markActiveStepFailed() {
    setStates((previous) => {
      const active = stages.find((stage) => previous[stage.id] === "active");
      return active ? { ...previous, [active.id]: "failed" } : previous;
    });
  }

  async function copyGuideUrl() {
    if (!result) return;
    const url = new URL(result.url, window.location.origin).toString();
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt("Copy this guide link:", url); }
  }

  return <main className="generator-page">
    <header className="topbar generator-topbar">
      <Link className="brand" href="/"><span className="brand-icon"><Command size={18} strokeWidth={2.4} /></span><span>authpath<span className="brand-period">.</span></span></Link>
      <Link className="back-link" href="/#directory"><ArrowLeft size={15} /> Back to guides</Link>
      <ThemeToggle />
    </header>
    <div className="generator-wrap">
      <div className="generator-heading"><div className="eyebrow"><span className="eyebrow-dot" /> LIVE RESEARCH</div><h1>Find your OAuth path.</h1><p>Enter an app name or website. AuthPath will search for developer docs, build a sourced checklist, and save a guide you can share.</p></div>

      <form className="generator-form" onSubmit={onSubmit}>
        <label><span>App name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="For example, Linear" maxLength={120} autoComplete="organization" /></label>
        <div className="form-divider"><span>OR</span></div>
        <label><span>App website</span><input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://example.com" maxLength={300} inputMode="url" /></label>
        <div className="form-foot"><span><ShieldCheck size={14} /> Public documentation only. No provider account actions.</span><button className="button button-primary" type="submit" disabled={busy || (!name.trim() && !website.trim())}>{busy ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}{busy ? "Researching…" : "Research this app"}<ArrowRight size={15} /></button></div>
      </form>

      {(busy || message || error) && <section className={`research-panel ${error ? "research-error" : ""}`} aria-live="polite">
        <div className="research-panel-heading"><span className="research-icon">{error ? <CircleHelp size={17} /> : busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}</span><div><strong>{error ? "Research stopped" : message || "Starting research"}</strong>{detail && <p>{detail}</p>}</div></div>
        {error && <p className="research-error-message">{error}</p>}
        {!result?.reused && <ol className="research-stages">{stages.map((stage) => <li key={stage.id} className={`research-stage stage-${states[stage.id]}`}><span className="stage-icon">{states[stage.id] === "complete" ? <Check size={13} /> : states[stage.id] === "active" ? <LoaderCircle className="spin" size={13} /> : states[stage.id] === "failed" ? <CircleHelp size={12} /> : <span />}</span><span>{stage.label}</span>{states[stage.id] === "active" && <small>in progress</small>}{states[stage.id] === "failed" && <small>failed</small>}</li>)}</ol>}
        {error && <p className="retry-hint">You can edit the app details or submit the same request again.</p>}
      </section>}

      {result && <section className="generated-result"><div className="result-header"><span className="result-check"><Check size={17} /></span><div><div className="section-kicker">SHAREABLE GUIDE READY</div><h2>{formatGuideName(result.guide.name)} OAuth setup</h2><p>{result.guide.summary}</p></div></div><div className="result-url"><span>{typeof window === "undefined" ? result.url : new URL(result.url, window.location.origin).toString()}</span><button type="button" onClick={copyGuideUrl}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy link"}</button></div><div className="result-foot"><span><Clock3 size={14} /> {result.guide.steps.length} setup steps · {result.guide.sources.length} sources</span><Link className="button button-primary" href={result.url}>Open complete guide <ExternalLink size={14} /></Link></div></section>}

      <div className="generator-note"><ShieldCheck size={15} /><span>Guides cite search-grounded sources and label estimates and unknowns. Nothing is presented as tested unless it was.</span></div>
    </div>
  </main>;
}

function isGuide(value: unknown): value is OAuthGuide {
  return Boolean(value && typeof value === "object" && "slug" in value && "name" in value && "steps" in value);
}
