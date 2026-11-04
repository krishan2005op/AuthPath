/**
 * Evidence-backed starter guide data for AuthPath.
 *
 * These are orientation guides, not provider approval guarantees. Scope choices
 * are use-case-specific, and all active-work estimates are AuthPath estimates.
 * No OAuth registration or authorization flow was executed for this research.
 */

export type EvidenceStatus = "official-docs" | "estimate" | "unknown";
export type Source = { id: string; title: string; url: string; publisher: string };
export type GuideStep = { title: string; detail: string; evidence: EvidenceStatus; sourceIds: string[] };
export type Scope = { name: string; purpose: string; selectionNote: string; sourceIds: string[] };
export type OAuthGuide = {
  slug: string;
  name: string;
  summary: string;
  difficulty: "Low" | "Moderate" | "High";
  activeEffort: { estimate: string; rationale: string };
  approval: { requirement: string; wait: string; note: string };
  managedOAuth: { available: boolean; explanation: string; sourceIds: string[] };
  prerequisites: string[];
  redirectUri: string;
  credentials: string;
  scopes: Scope[];
  steps: GuideStep[];
  blockers: { issue: string; response: string; sourceIds: string[] }[];
  agentCan: string[];
  developerMust: string[];
  sources: Source[];
  verification: { researched: string[]; tested: string[]; unknown: string[]; lastChecked: string };
};

const composio: Source = {
  id: "composio",
  title: "Managed OAuth apps directory",
  url: "https://docs.composio.dev/toolkits/managed-auth",
  publisher: "Composio",
};
const composioAuth: Source = {
  id: "composio-auth",
  title: "Managed vs custom auth",
  url: "https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app",
  publisher: "Composio",
};

export const guides: OAuthGuide[] = [
  {
    slug: "github",
    name: "GitHub",
    summary: "Register an OAuth App for user-authorized GitHub access. Consider a GitHub App when you need granular repository permissions or app-identity access.",
    difficulty: "Low",
    activeEffort: { estimate: "About 30–90 minutes (AuthPath estimate)", rationale: "GitHub documents a short portal registration flow; implementing and safely testing the callback and token exchange is additional application work." },
    approval: { requirement: "No general pre-approval step is stated in the OAuth App registration guide. Organization policies may still affect installation or authorization.", wait: "No provider review wait identified for basic OAuth App registration.", note: "If your product needs repository-level permissions, evaluate GitHub Apps; OAuth Apps act on behalf of a user." },
    managedOAuth: { available: true, explanation: "Composio lists GitHub among toolkits with a managed OAuth app. Use it when its branding, default scopes, and shared quota fit; otherwise bring your own app.", sourceIds: ["composio", "composio-auth"] },
    prerequisites: ["A GitHub account (or administrative access to the organization that will own the app).", "A public app homepage URL and a callback URL for your integration."],
    redirectUri: "Set the Authorization callback URL during registration (up to 10 callback URLs are supported). Use the callback your application implements.",
    credentials: "GitHub provides a client ID and client secret after registration. Keep the secret on your server; never commit or expose it in browser code.",
    scopes: [{ name: "Use only the scopes required by the chosen GitHub API actions", purpose: "OAuth App permissions are user-authorized; the necessary permissions depend on endpoints and intended actions.", selectionNote: "This guide intentionally does not prescribe a fixed scope set. Map API calls to GitHub's current permission documentation before registration.", sourceIds: ["github-create", "github-oauth"] }],
    steps: [
      { title: "Choose OAuth App versus GitHub App", detail: "OAuth Apps act on behalf of a user. GitHub Apps offer fine-grained permissions and can also act independently; select based on the integration model.", evidence: "official-docs", sourceIds: ["github-create"] },
      { title: "Register the OAuth App", detail: "Open personal or organization Settings → Developer settings → OAuth Apps → New OAuth App. Enter app name and homepage URL; add the authorization callback URL and register.", evidence: "official-docs", sourceIds: ["github-create"] },
      { title: "Implement authorization and callback handling", detail: "Use the client ID to start authorization, validate state in your callback, exchange the returned code on your server, and store tokens securely. Confirm current token behavior against the authorization guide.", evidence: "official-docs", sourceIds: ["github-oauth"] },
      { title: "Request only needed access and test", detail: "Match requested permissions to API calls, test with a least-privilege account, and confirm cancellation, denial, and callback error cases.", evidence: "official-docs", sourceIds: ["github-oauth"] },
    ],
    blockers: [{ issue: "OAuth App may be the wrong app model for repository installations or app-identity actions.", response: "Compare GitHub App permissions and installation flow before building around OAuth Apps.", sourceIds: ["github-create"] }, { issue: "Callback mismatch or mishandled authorization response.", response: "Use the registered callback and test the full authorization-code flow, including state validation.", sourceIds: ["github-oauth"] }],
    agentCan: ["Summarize official registration and authorization documentation.", "Help map desired API actions to permission documentation and draft a callback checklist."],
    developerMust: ["Choose app ownership and implement the callback and secure token handling.", "Register the app and test authorization with an account they control."],
    sources: [composio, composioAuth,
      { id: "github-create", title: "Creating an OAuth app", url: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app", publisher: "GitHub Docs" },
      { id: "github-oauth", title: "Authorizing OAuth apps", url: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps", publisher: "GitHub Docs" }],
    verification: { researched: ["Registration fields and portal path", "OAuth App versus GitHub App distinction", "Composio managed-app listing"], tested: [], unknown: ["OAuth flow not executed", "Exact scopes depend on the product's API calls", "Organization-specific policies and future provider changes"], lastChecked: "2026-11-04" },
  },
  {
    slug: "slack",
    name: "Slack",
    summary: "Create a Slack app and configure OAuth v2. Unlisted distribution can support pilots; Slack Marketplace listing is a separate, substantial review path.",
    difficulty: "Moderate",
    activeEffort: { estimate: "About 2–6 hours for a basic distributable OAuth integration (AuthPath estimate)", rationale: "Includes app setup, scope selection, HTTPS callback and code exchange, distribution checklist, and testing; Marketplace readiness adds product and policy work." },
    approval: { requirement: "Marketplace review is required to be listed in Slack Marketplace; unlisted distribution is a separate path. Workspace admins can also gate app installs.", wait: "Marketplace docs state preliminary feedback generally takes up to 1 week and functional review generally up to 8 weeks. This is a published estimate, not a guarantee; resubmissions can extend it.", note: "Marketplace listing also has readiness requirements, including 10 active workspaces and a functional, tested app. Do not conflate Marketplace listing with basic OAuth setup." },
    managedOAuth: { available: true, explanation: "Composio lists Slack as managed OAuth available. A custom Slack app is still useful for your own consent branding, scopes, or quota needs.", sourceIds: ["composio", "composio-auth"] },
    prerequisites: ["A Slack account and workspace for development/testing.", "A deployed HTTPS callback URL for distributed OAuth.", "For Marketplace review: a complete, publicly accessible app experience, policy pages, support contact, and sufficient active workspace use."],
    redirectUri: "Configure HTTPS Redirect URLs in OAuth & Permissions. If multiple are configured, send the same redirect_uri in authorization and token exchange; it must match or be a subdirectory of a configured URL.",
    credentials: "Get the client ID and client secret from app settings. Exchange the temporary code server-side and protect tokens and signing secrets.",
    scopes: [{ name: "Bot scopes and user scopes", purpose: "Bot scopes authorize the app's bot identity; user scopes allow actions on behalf of a user.", selectionNote: "Select the minimum scopes needed. Slack notes that user scopes should be reserved for cases requiring user-level action; Marketplace reviewers assess scope fit.", sourceIds: ["slack-oauth", "slack-review"] }],
    steps: [
      { title: "Create the Slack app", detail: "Create an app in Slack's app management portal and configure its OAuth & Permissions settings.", evidence: "official-docs", sourceIds: ["slack-oauth"] },
      { title: "Select scopes and configure redirect URLs", detail: "Choose the minimum bot and/or user scopes. Add an HTTPS redirect URL and implement state protection.", evidence: "official-docs", sourceIds: ["slack-oauth", "slack-guidelines"] },
      { title: "Implement OAuth v2", detail: "Send users to oauth/v2/authorize, receive the temporary code, and exchange it server-side. Keep redirect_uri consistent when supplied.", evidence: "official-docs", sourceIds: ["slack-oauth"] },
      { title: "Choose distribution path", detail: "Use unlisted distribution for pilots where appropriate. For commercial Marketplace listing, complete the checklist, test with customers, provide reviewer materials, and submit for review.", evidence: "official-docs", sourceIds: ["slack-distribution", "slack-review"] },
    ],
    blockers: [{ issue: "bad_redirect_uri during code exchange.", response: "Match the configured URL and pass the identical redirect_uri during authorization and access exchange when required.", sourceIds: ["slack-oauth"] }, { issue: "Marketplace submission returned due to missing readiness or scope issues.", response: "Meet current eligibility and quality requirements, test end-to-end, provide reviewer access/details, and minimize scopes.", sourceIds: ["slack-review", "slack-guidelines"] }, { issue: "A target workspace blocks installation.", response: "The workspace may require admin approval or allow only Marketplace-listed apps; coordinate with its administrator.", sourceIds: ["slack-distribution"] }],
    agentCan: ["Prepare scope and callback checklists from documented requirements.", "Summarize the Marketplace readiness and published review stages."],
    developerMust: ["Create app credentials, host HTTPS endpoints, and test installation/uninstallation.", "Build and operate the product, satisfy Marketplace requirements, and submit the listing if needed."],
    sources: [composio, composioAuth,
      { id: "slack-oauth", title: "Installing with OAuth", url: "https://api.slack.com/authentication/oauth-v2", publisher: "Slack API" },
      { id: "slack-distribution", title: "Distributing Slack apps", url: "https://api.slack.com/docs/slack-apps-mgmt", publisher: "Slack API" },
      { id: "slack-review", title: "Slack Marketplace review guide", url: "https://api.slack.com/directory/app-review-guide", publisher: "Slack API" },
      { id: "slack-guidelines", title: "Slack Marketplace app guidelines", url: "https://api.slack.com/docs/slack-apps-guidelines", publisher: "Slack API" }],
    verification: { researched: ["OAuth v2 scopes and HTTPS redirect requirements", "Unlisted versus Marketplace distribution", "Published Marketplace review estimates and readiness checklist", "Composio managed-app listing"], tested: [], unknown: ["OAuth flow and app portal not tested", "Whether a specific app qualifies for Marketplace listing", "Actual queue time, feedback rounds, and workspace admin decisions"], lastChecked: "2026-11-04" },
  },
  {
    slug: "google",
    name: "Google (Gmail / Google APIs)",
    summary: "Configure an OAuth consent screen and client in Google Cloud. Verification depends on audience, API, scopes, and whether the app is internal or public.",
    difficulty: "High",
    activeEffort: { estimate: "About 2–6 hours for a basic client; several additional days of preparation for verification (AuthPath estimate)", rationale: "Console configuration and callback implementation are manageable, but branding, scope justification, test setup, and verification artifacts add work. Restricted scopes may require an independent security assessment." },
    approval: { requirement: "All apps configure consent. Public apps using sensitive or restricted scopes may need Google verification; restricted scopes can require a security assessment. Internal Workspace apps and qualifying testing/personal scenarios have different requirements or exceptions.", wait: "No universal review duration stated in the cited sources. Treat queue and assessment timing as unknown and scope-dependent.", note: "Google APIs have different scopes. This guide cannot give a meaningful approval answer until the API, scope set, audience, and data handling are known." },
    managedOAuth: { available: true, explanation: "Composio's directory lists Gmail and multiple Google toolkits as managed OAuth available. Verify the specific toolkit and auth method; custom credentials may be needed for branding or scopes outside defaults.", sourceIds: ["composio", "composio-auth"] },
    prerequisites: ["A Google Cloud project and intended API enabled.", "An audience decision (internal or external) and app identity/contact details.", "A concrete minimum scope list mapped to API methods.", "For verification, privacy policy and supporting evidence may be needed; restricted access may require assessment depending on data handling."],
    redirectUri: "Create an OAuth client for the application type and register the exact authorized redirect URI(s). Confirm matching rules in the current Google client documentation before deployment.",
    credentials: "Create OAuth client credentials in the Cloud Console. Keep the client secret server-side; a browser-based client type has different credential handling.",
    scopes: [{ name: "API-specific least-privilege scopes", purpose: "Scopes determine the Google data and operations users authorize.", selectionNote: "There is no single 'Google OAuth scope'. Use the selected API's scope list and prefer non-sensitive alternatives where they meet the use case. Gmail scopes can trigger more review than basic identity scopes.", sourceIds: ["google-scopes", "google-consent"] }],
    steps: [
      { title: "Choose project, audience, and API", detail: "Select the Google Cloud project, enable the API, and decide whether the app is internal or external to a Workspace organization.", evidence: "official-docs", sourceIds: ["google-consent"] },
      { title: "Configure the consent screen", detail: "Provide app identity and contact details, configure audience, add test users when applicable, and select requested scopes.", evidence: "official-docs", sourceIds: ["google-consent"] },
      { title: "Classify every scope", detail: "Check the selected API's scope classifications. Sensitive and restricted scopes can trigger additional verification; restricted scopes may require a security assessment when data is stored or transmitted by a server.", evidence: "official-docs", sourceIds: ["google-scopes", "google-policy", "google-restricted"] },
      { title: "Create the OAuth client and test", detail: "Create credentials for the intended app type, configure redirect URI(s), and test with the intended audience before production rollout.", evidence: "official-docs", sourceIds: ["google-consent"] },
      { title: "Submit only if the use case requires it", detail: "If public production access and the scope category require verification, submit through Google Cloud with the requested evidence. Exceptions apply in some personal, testing, internal, or other documented cases.", evidence: "official-docs", sourceIds: ["google-policy", "google-restricted"] },
    ],
    blockers: [{ issue: "Unverified app warning or user cap in testing.", response: "Confirm audience and scope classification; complete the required verification before broad public use, or stay within a documented exception.", sourceIds: ["google-scopes", "google-restricted"] }, { issue: "Restricted scope triggers extra review/security work.", response: "Check if a less sensitive scope meets the feature; otherwise prepare the policy evidence and assess whether a third-party security assessment applies.", sourceIds: ["google-scopes", "google-restricted"] }, { issue: "Wrong audience or app configuration.", response: "Recheck internal/external audience, test-user setup, project, enabled API, and client type.", sourceIds: ["google-consent"] }],
    agentCan: ["Map a described use case to candidate API documentation and scope classifications.", "Draft consent-screen and verification evidence checklists."],
    developerMust: ["Choose project ownership and audience, configure credentials and redirect URIs, and perform real user-flow testing.", "Provide accurate privacy/data-use disclosures and complete any required verification or security assessment."],
    sources: [composio, composioAuth,
      { id: "google-consent", title: "Configure OAuth consent and choose scopes", url: "https://developers.google.com/workspace/guides/configure-oauth-consent", publisher: "Google for Developers" },
      { id: "google-scopes", title: "OAuth 2.0 scopes for Google APIs", url: "https://developers.google.com/identity/protocols/oauth2/scopes", publisher: "Google for Developers" },
      { id: "google-policy", title: "OAuth 2.0 policies", url: "https://developers.google.com/identity/protocols/oauth2/policies", publisher: "Google for Developers" },
      { id: "google-restricted", title: "Restricted scope verification", url: "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification", publisher: "Google for Developers" }],
    verification: { researched: ["Consent-screen and audience requirements", "Sensitive/restricted scope implications", "Documented exceptions and restricted-scope assessment conditions", "Composio Gmail/Google toolkit availability"], tested: [], unknown: ["Exact Gmail scopes and review route depend on intended features", "OAuth flow not executed", "Verification wait time and decision", "Specific API-specific policy requirements"], lastChecked: "2026-11-04" },
  },
  {
    slug: "hubspot",
    name: "HubSpot",
    summary: "Build a HubSpot app with OAuth and explicitly selected CRM scopes. Marketplace review and verified-domain status affect the install trust signals and distribution path.",
    difficulty: "Moderate",
    activeEffort: { estimate: "About 1–3 hours for a basic OAuth integration (AuthPath estimate)", rationale: "Developer-portal app setup and a narrow OAuth flow are relatively contained; API choice, account permissions, app platform type, and Marketplace preparation can add work." },
    approval: { requirement: "OAuth app creation and Marketplace listing are separate. Marketplace-listed apps pass HubSpot's app review. HubSpot documents distinct install banners for unverified-domain and verified-but-not-listed apps.", wait: "No general review duration verified in the sources gathered for this guide; treat timing as unknown and confirm in the developer portal before planning a launch.", note: "HubSpot has multiple app generations/platform paths. Confirm the correct app type and current OAuth guide before following legacy tutorials." },
    managedOAuth: { available: true, explanation: "Composio lists HubSpot as managed OAuth available. Check the specific toolkit's managed auth method and scope defaults; bring your own app if the consent identity or scopes need customization.", sourceIds: ["composio", "composio-auth"] },
    prerequisites: ["A HubSpot developer account and a HubSpot account/portal for installation and testing.", "A redirect URL and the set of CRM/API scopes required for the product's functions.", "For Marketplace distribution, a complete listing and compliance with current review requirements; verified domain improves install-screen trust signals."],
    redirectUri: "Add the callback URL in the app's OAuth/auth settings. It must match the redirect_uri used in the authorization flow; multiple URLs may have a default first URL depending on app type.",
    credentials: "The app details provide a client ID and client secret. Exchange authorization codes server-side and protect credentials and refresh tokens.",
    scopes: [{ name: "Only the required HubSpot CRM/API scopes", purpose: "Scopes control which account data and actions the app can access.", selectionNote: "Choose scopes based on the specific HubSpot APIs used. The documented quickstart/sample may use example scopes; do not copy them without matching your feature set.", sourceIds: ["hubspot-oauth", "hubspot-sample"] }],
    steps: [
      { title: "Select the right HubSpot app path", detail: "Start with the current OAuth quickstart and developer-platform docs. HubSpot documents legacy public apps alongside the newer developer platform; verify availability and requirements for your use case.", evidence: "official-docs", sourceIds: ["hubspot-oauth", "hubspot-legacy"] },
      { title: "Create the app and configure OAuth", detail: "In the developer portal, create the app, enter public-facing information, configure redirect URL(s), and select only required scopes.", evidence: "official-docs", sourceIds: ["hubspot-oauth", "hubspot-sample"] },
      { title: "Implement and test authorization", detail: "Build the authorization URL with client ID, redirect URI, and scopes; handle callback, code exchange, token refresh, errors, and account permission limits.", evidence: "official-docs", sourceIds: ["hubspot-oauth", "hubspot-blog"] },
      { title: "Decide on domain verification and Marketplace", detail: "HubSpot distinguishes an unverified domain from a verified domain and a Marketplace-listed app on the install screen. Follow the current Marketplace submission and review instructions if listing is required.", evidence: "official-docs", sourceIds: ["hubspot-legacy"] },
    ],
    blockers: [{ issue: "Requested scope is unavailable to the installing user or doesn't match API features.", response: "Check current API scope documentation and ensure the HubSpot user/account has the required permissions; request only what the app needs.", sourceIds: ["hubspot-oauth"] }, { issue: "Redirect mismatch or OAuth callback failures.", response: "Compare the exact registered redirect URL with the authorization request and callback implementation.", sourceIds: ["hubspot-oauth", "hubspot-sample"] }, { issue: "Install page warns that the app is unverified or not reviewed.", response: "Verify the domain and, if public Marketplace listing is needed, complete the current app review process; verification alone is not Marketplace approval.", sourceIds: ["hubspot-legacy"] }],
    agentCan: ["Summarize OAuth quickstart steps and identify likely scope documentation for a stated HubSpot feature.", "Prepare a redirect/token lifecycle checklist and distinguish domain verification from Marketplace review."],
    developerMust: ["Choose the app type, register credentials, implement OAuth/token security, and test against a HubSpot portal.", "Verify the domain and submit for Marketplace review if the distribution plan requires listing."],
    sources: [composio, composioAuth,
      { id: "hubspot-oauth", title: "OAuth quickstart guide", url: "https://developers.hubspot.com/docs/api/oauth-quickstart-guide", publisher: "HubSpot Developer Docs" },
      { id: "hubspot-legacy", title: "Legacy public apps overview and verified domains", url: "https://developers.hubspot.com/docs/guides/apps/public-apps/overview", publisher: "HubSpot Developer Docs" },
      { id: "hubspot-blog", title: "HubSpot OAuth token management", url: "https://developers.hubspot.com/blog/oauth-token-management-hubspot-integrations", publisher: "HubSpot Developer Blog" },
      { id: "hubspot-sample", title: "HubSpot OAuth sample application", url: "https://github.com/HubSpot/sample-apps-oauth", publisher: "HubSpot sample repository" }],
    verification: { researched: ["OAuth app/sample setup and token lifecycle", "Install trust banners for domain verification and Marketplace review", "Composio managed-app listing"], tested: [], unknown: ["Current developer-portal flow not exercised", "Exact scope, app platform, review eligibility and timing depend on product/use case", "OAuth flow not executed"], lastChecked: "2026-11-04" },
  },
];

export const guideBySlug = (slug: string): OAuthGuide | undefined => guides.find((guide) => guide.slug === slug);
