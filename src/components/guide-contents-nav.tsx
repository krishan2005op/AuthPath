"use client";

import { useEffect, useState } from "react";

const sections = [
  ["overview", "Overview"],
  ["setup", "Setup steps"],
  ["permissions", "Scopes & permissions"],
  ["requirements", "Requirements"],
  ["blockers", "Potential blockers"],
  ["handoff", "Who does what"],
  ["evidence", "Evidence & sources"],
] as const;

export function GuideContentsNav() {
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    const targets = sections
      .map(([id]) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target.id) setActiveId(visible[0].target.id);
    }, { rootMargin: "-14% 0px -72% 0px", threshold: 0 });

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return <nav className="guide-contents-nav" aria-label="In this guide">
    {sections.map(([id, label]) => <a key={id} href={`#${id}`} className={activeId === id ? "is-active" : ""} aria-current={activeId === id ? "location" : undefined}>{label}</a>)}
  </nav>;
}
