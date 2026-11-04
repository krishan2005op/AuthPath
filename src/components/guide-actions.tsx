"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

export function GuideActions() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this guide link:", url);
    }
  }

  return <button className="guide-share-button" type="button" onClick={copyLink}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Link copied" : <><Link2 size={14} /> Share guide</>}</button>;
}
