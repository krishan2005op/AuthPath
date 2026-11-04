# AuthPath

AuthPath helps developers understand the work involved in connecting an app through OAuth. Browse four researched starter guides, or submit an app name or website to generate a source-linked guide that can be saved and shared.

## Run locally

Requirements: Node.js 20 or newer, npm, a Supabase project, and a Gemini API key with Google Search grounding available.

1. Clone the repository and open a terminal in its folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env` file in the project root. Add the values below. Keep the file private; it is ignored by Git.

   ```dotenv
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=your_supabase_secret_key
   GUIDE_WRITE_TOKEN=your_long_random_write_token
   ```

   `SUPABASE_SERVICE_ROLE_KEY` is also accepted for older local setups. Prefer `SUPABASE_SECRET_KEY`. Never use either database key in browser code or commit it.

4. In Supabase, open **SQL Editor**, create a query, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). The directory and four starter guides can be viewed without Gemini. Guide generation also needs working Supabase storage and Gemini Search grounding.

For a production build, run `npm run build`; to serve that build locally, run `npm start` after the build completes.

## How it works

- The Next.js app serves the directory, guide pages, and guide generator.
- `/api/guides` returns the starter guides plus saved guides from Supabase. `/api/guides/[slug]` retrieves one guide.
- `/api/generate` runs a server-side Gemini research flow using Google Search grounding, validates the returned guide and source references, and saves it to Supabase.
- Gemini and Supabase credentials are read only on the server. `GUIDE_WRITE_TOKEN` protects the guide creation API.
- A generated guide is saved under a stable slug and can be shared at `/guides/<slug>`. A later request for the same slug reuses the saved guide.

## Product decisions

- The first release focuses on GitHub, Slack, Google APIs, and HubSpot. Their guides represent different combinations of OAuth setup, scope selection, and external review.
- The generator is a research assistant, not an OAuth setup bot. It researches public documentation and prepares a guide; the developer still registers credentials, implements and tests the callback, and completes any provider review.
- Provider docs are preferred. Estimates and unknowns are labeled separately from claims supported by documentation. The guide records tested steps separately; reading docs is not treated as testing an OAuth flow.
- Managed OAuth availability is described as a separate choice from a developer-owned OAuth app and is only asserted when a source supports it.

## Validation notes

The starter guides link to provider documentation and a managed-auth directory. The project build and TypeScript checks have been run successfully. OAuth registration, token exchange, and provider approval were not executed as part of this take-home, so starter-guide `tested` lists remain empty.

During review of the live research flow, generated guides initially failed validation when required fields or source-reference labels were missing. The generator now normalizes safe missing fields, allows one correction pass, and reports a validation error if the repaired guide still fails. The app was reported working by the developer after these fixes; the live API was not reachable in the Module 6 environment for an independent Airtable/Notion replay.

Official docs checked during validation:

- [Airtable Builder Hub OAuth setup](https://support.airtable.com/articles/9362950318-using-builder-hub-in-airtable): registration is self-serve; support email, privacy policy, and terms URLs are required before other users can authorize.
- [Notion authorization guide](https://developers.notion.com/guides/authorization/overview): OAuth can be used after credentials and redirect URI are configured; Marketplace listing/review is separate.
- [Google OAuth consent configuration](https://developers.google.com/workspace/guides/configure-oauth-consent) and [restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification): review depends on audience, scopes, and use case; restricted scopes can require a security assessment.

## Deploy to Vercel

1. Push the project to a GitHub repository. Confirm `.env` is ignored and is not present in the commit history.
2. Sign in to [Vercel](https://vercel.com), choose **Add New… → Project**, and import the GitHub repository.
3. Keep the detected **Next.js** framework and default build settings.
4. In the project setup or later under **Settings → Environment Variables**, add `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `GUIDE_WRITE_TOKEN`. Add them for **Production** and **Preview** only where you intend those deployments to access the services. Do not add `NEXT_PUBLIC_` to these names.
5. Confirm the Supabase schema has been applied, then deploy. After changing environment variables, redeploy so the new values are loaded.
6. Open the deployment, check the directory and a starter guide, then generate a guide for an unfamiliar app and open its saved share URL. Do not use a real provider credential or submit an app for review as part of this smoke check.

The Vercel account, Supabase project, Gemini project, and provider portals remain under the project owner's control. This repository does not contain production credentials.

## Known limitations

- Only four starter guides are included; the assignment's full 100-app directory is outside this focused demo.
- Generated research depends on Gemini Search grounding, source coverage, and current public documentation. Search coverage and model summaries can be incomplete; verify important requirements with the provider before launch.
- Provider portals and approval queues were not exercised. Approval duration can depend on the app, scopes, review backlog, and provider decisions.
- There is no dedicated automated test suite yet. The production build validates compilation, types, and route generation, but it is not an end-to-end OAuth test.
- Supabase stores generated guides as JSON. This keeps the demo small but does not provide a full audit history or collaborative editing workflow.

## Useful commands

```bash
npm run dev
npm run build
npm start
```
