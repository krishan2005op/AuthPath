# AuthPath

I built AuthPath to help developers figure out what it takes to connect an app with OAuth. It includes starter guides for GitHub, Slack, Google APIs, and HubSpot. You can also submit another app by name or website and generate a guide from public documentation.

## Run it locally

You need Node.js 20 or newer and npm. The directory and starter guides work without API keys. To generate and save guides, you also need a Supabase project and a Gemini API key with Google Search grounding available.

1. Clone this repository and open a terminal in the project folder.
2. Install the packages:

   ```bash
   npm install
   ```

3. Create a file named `.env` in the project root. Add your own values for these variables:

   ```dotenv
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=your_supabase_secret_key
   GUIDE_WRITE_TOKEN=your_long_random_write_token
   ```

   Keep `.env` on your computer. Git ignores it. Older setups can use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_SECRET_KEY`; the newer secret key name is preferred. Neither database key belongs in browser code or in Git.

4. In the Supabase dashboard, open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
5. Start the app:

   ```bash
   npm run dev
   ```

6. Visit [http://localhost:3000](http://localhost:3000).

To make a production build, run `npm run build`. To run that build locally, use `npm start` afterward.

## What happens when you research an app

The generator sends the app name or website to a server route. That route asks `gemini-2.5-flash` to search public documentation, then asks it to format the findings as a guide. The server checks the guide fields and source references, makes one correction attempt if needed, and saves a valid guide in Supabase.

The saved guide gets a stable URL such as `/guides/notion`. Submitting the same app again reuses the saved guide. Gemini and Supabase keys stay on the server, and `GUIDE_WRITE_TOKEN` protects the guide creation endpoint.

The main API routes are:

- `/api/guides` returns starter guides and saved guides.
- `/api/guides/[slug]` returns one guide.
- `/api/generate` researches and saves a guide.

The agent only works with public information. It does not create provider apps, configure credentials, test OAuth callbacks, exchange tokens, or submit apps for approval. A developer still needs to do those parts.

## What I focused on

I started with four providers because they show different setup paths: GitHub's OAuth Apps and GitHub Apps, Slack's separate Marketplace review, Google's scope-dependent verification, and HubSpot's different public-app documentation paths.

The guides link to sources and label estimates and unknowns. Looking at a provider's documentation is not treated as testing its OAuth flow. Managed OAuth is shown separately from registering an app that you own.

## Checks and research notes

The project build and TypeScript checks have passed. I did not register provider apps, complete OAuth consent, exchange tokens, or submit apps for approval. The starter guides' tested-step lists are empty for that reason.

While I was working on the generator, some responses failed validation because required guide fields or source labels were missing. The server now fills certain safe defaults, tries one correction pass, and returns an error if the corrected guide still does not pass. I tried the live flow with Airtable and Notion after these fixes and got guides for both. I could not replay those API requests independently from this environment.

I checked these provider docs while preparing the project:

- [Airtable Builder Hub OAuth setup](https://support.airtable.com/articles/9362950318-using-builder-hub-in-airtable) - registration is self-serve; a support email, privacy policy, and terms URLs are needed before other users can authorize.
- [Notion authorization guide](https://developers.notion.com/guides/authorization/overview) - OAuth credentials and a redirect URI are needed; Marketplace listing is a separate process.
- [Google OAuth consent configuration](https://developers.google.com/workspace/guides/configure-oauth-consent) and [restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification) - review depends on the audience and requested scopes; restricted scopes can require a security assessment.

## Deploy to Vercel

1. Push the repository to GitHub. Before deploying, make sure `.env` is ignored and no credentials were committed.
2. In Vercel, choose **Add New... > Project** and import the repository.
3. Keep the detected Next.js preset and default build settings.
4. Add `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `GUIDE_WRITE_TOKEN` under **Settings > Environment Variables**. Choose the environments that should be able to generate guides. These are server-side values; do not add a `NEXT_PUBLIC_` prefix.
5. Make sure the Supabase schema has been run, then deploy. If you change environment variables later, deploy again so the new values take effect.
6. Open the deployed site, check a starter guide, then try generating a guide for an unfamiliar app.

The project owner manages the Vercel, Supabase, Gemini, and provider accounts. Production credentials are not included in this repository.

## Current limits

- There are four starter guides, not the full 100-app library from the assignment.
- Generated guides depend on Gemini Search grounding and the public sources it can find. Check important details against the provider's current docs.
- Provider portals, approval queues, and OAuth flows were not tested. Approval timing can vary by provider, scopes, and app.
- There is no dedicated automated test suite yet. A successful build checks the app compiles; it does not prove an OAuth integration works.
- Supabase stores generated guides as JSON. There is no audit history or collaborative editing.

## Commands

```bash
npm run dev
npm run build
npm start
```
