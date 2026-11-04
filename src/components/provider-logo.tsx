import { formatGuideName } from "@/data/guides";

export const providerLogos: Record<string, { src: string; className: string }> = {
  github: { src: "https://cdn.simpleicons.org/github/FFFFFF", className: "mark-github" },
  slack: { src: "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/slack.svg", className: "mark-slack" },
  google: { src: "https://cdn.simpleicons.org/google/4285F4", className: "mark-google" },
  hubspot: { src: "https://cdn.simpleicons.org/hubspot/FF7A59", className: "mark-hubspot" },
};

export function ProviderLogo({ slug, name, className }: { slug: string; name: string; className: string }) {
  const logo = providerLogos[slug];
  const fallback = formatGuideName(name).trim().charAt(0).toUpperCase() || "?";

  return (
    <span className={`${className} ${logo?.className ?? "mark-generic"}`} aria-hidden="true">
      {logo ? <img src={logo.src} alt="" /> : fallback}
    </span>
  );
}
