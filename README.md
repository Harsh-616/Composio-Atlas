# Composio Atlas

**Confidential project source.** This repository is intended for the project owner and the people they explicitly share it with. Do not redistribute the source or its contents without permission. The repository should remain private. It contains no OAuth credentials or provider secrets.

Composio Atlas is a demo that helps an agent builder understand how to connect an app to their product. It checks whether Composio already handles sign-in for that app. If it does not, Atlas searches public documentation and assembles a guide with source links, setup code, likely work, provider review steps, and open questions.

Live demo: https://oauth-setup-atlas.proudbox2.chatgpt.site

## What a user does

1. Enter an app name or official website, describe what their agent needs to do, and choose Python or TypeScript.
2. Atlas checks the known Composio directory entries. It explains whether Composio-managed authentication is available or whether the developer may need their own provider app.
3. Atlas shows a guide: packages and terminal commands, sample code, suggested actions and scopes, setup steps, a simple connection diagram, likely time, approval materials, and source links.
4. The developer uses the code and checklist in their own project. They create provider credentials, submit applications, approve access, and handle credentials themselves.
5. The guide can be shared by URL or downloaded as JSON. A shared URL regenerates the current guide; it is not a frozen historical record.

## Product architecture

The homepage is the app search and guide builder. The guide is organized around decisions a developer needs to make:

- **Path:** whether Composio-managed auth is listed, or provider-owned OAuth setup is needed.
- **Implementation:** packages, commands, environment variable names, sample code, and connection flow.
- **Permissions:** likely actions and scopes based on the requested task, with caveats and links to provider documentation.
- **Readiness:** provider requirements, what can be prepared now, what a person must submit or approve, likely wait time, and next steps after approval.
- **Evidence:** source links, confidence labels, and explicit unknowns beside the guidance.

Google Drive, Slack, GitHub, and Linear are the managed-directory examples. Acuity Scheduling is an example of a provider-native OAuth flow outside the managed examples. These examples demonstrate different setup paths; they do not represent a 100-app library.

### Example 1: Acuity Scheduling is not in the managed directory

Suppose a developer wants an agent to read appointments and summarize the week's availability. Atlas checks the Composio directory first. In this demo's directory examples, Acuity is not listed as a managed toolkit, so Atlas follows Acuity's own OAuth documentation instead of showing Composio connection commands.

The guide explains that Acuity recommends OAuth2 when a product connects multiple customers' Acuity accounts. It identifies the documented `api-v1` scope, points to Acuity's OAuth endpoints, and provides a server-side OAuth example for the selected language. The developer registers for an Acuity OAuth client and supplies the exact callback URL. Atlas labels registration review timing unknown because Acuity's public documentation does not publish a duration.

Atlas can prepare the implementation outline, code scaffold, and questions for Acuity. The developer must register the client, obtain and protect credentials, confirm any account or registration requirements, and approve users' connections. The guide's source links point to Acuity's [OAuth2 documentation](https://developers.acuityscheduling.com/docs/oauth2), [developer signup](https://developers.acuityscheduling.com/docs/signup), and [SDK documentation](https://developers.acuityscheduling.com/docs/sdks).

Try it in the live site by entering **Acuity Scheduling** and the task “Read appointments and summarize weekly availability.”

### Example 2: Google Drive is in the managed directory

Suppose a developer wants an agent to find project files and upload a weekly report. Atlas finds Google Drive as a Composio-managed toolkit. The first path is to use Composio's managed OAuth, so the developer can avoid registering a separate Google OAuth app for a basic connection.

The guide asks the developer to choose the exact Google Drive actions needed. It includes Python and TypeScript snippets that use the developer's own Composio API key in their backend to look up scopes for those action IDs. This makes the permission recommendation task-specific; the developer should review the result before asking a user to consent. The guide also explains when the developer may need a custom Google app, such as for their own consent-screen branding, custom scopes, or quota, and links to Google's verification requirements.

Composio can handle the managed connection flow, but the developer still builds and tests the feature, keeps any keys server-side, and the user must approve access to their Google account. If the developer chooses a custom Google OAuth app, they must configure its Google Cloud project and consent screen and submit any required verification materials. Google publishes different review stages and durations for certain verification paths; Atlas shows those separately from hands-on setup estimates.

Try it in the live site by entering **Google Drive** and the task “Find project files and upload a weekly report.”

These two examples show the key product decision: first determine who provides the OAuth app and connection flow, then give implementation steps that match that path. Managed status does not mean every provider review, developer task, or end-user consent step disappears.

## System architecture

This is a small JavaScript Worker application. `worker/index.js` contains the HTTP handlers, guide data, research helpers, and page UI. `scripts/build.sh` creates the deployable `dist/` artifact. The project has no runtime package dependencies.

```text
Browser
  -> POST /api/guide
      -> Check Composio directory status
      -> Use a reviewed example or research official public sources
      -> Build a guide object with claims, source links, and uncertainties
  <- Guide JSON
  -> Render guide, copy a share URL, or download JSON
```

The browser sends the app name, optional website, intended task, and language to `/api/guide`. It does not send provider client secrets or tokens. The server returns a guide object. `/api/schema` exposes the expected research brief and guide data structure.

### Information and research flow

1. For a small set of apps, Atlas uses reviewed examples and Composio directory information. The example data includes relevant Composio and provider source links.
2. For an unrecognized app, Atlas searches public web results, favors the app provider's own developer documentation and policies, and extracts pages from official domains when available.
3. Findings are stored in a defined JSON shape: provider identity, managed-auth status, setup steps, packages and code, scopes, review requirements and timing, human/agent responsibilities, sources, confidence, and uncertainties.
4. Each important finding points to one or more sources. Provider policy claims should come from provider sources; Composio behavior claims should come from Composio documentation. Unsupported details stay marked unknown.
5. The guide builder renders the structured result and includes copyable implementation examples. Scope recommendations for Composio-managed flows can be run by the developer in their own environment with their own Composio key.

The unfamiliar-app path is a deterministic web search and page extraction flow. It is not an LLM agent, and it cannot reliably research every provider. Search may fail, pages may change, and official sites may not publish review rules or timelines. In those cases Atlas shows the gap rather than inventing an answer.

## How to run it

Requirements: Node.js 20 or newer.

```bash
node --input-type=module -e "import worker from './worker/index.js'; const r = await worker.fetch(new Request('http://localhost/')); console.log(r.status)"
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

The first command makes a local smoke request directly to the Worker module. The build and validation commands create and check the static deployment artifact. The hosted demo runs on the Sites platform.

Example request:

```json
{
  "name": "Google Drive",
  "website": "https://developers.google.com",
  "intent": "Read project files and upload a weekly report",
  "language": "python"
}
```

For exact Composio scope recommendations, run the generated snippet locally after installing the listed SDK and setting `COMPOSIO_API_KEY` in your own private environment. Never put that key in browser code or commit it to this repository.

## What Atlas does not do

Atlas does not create an OAuth application for the developer, receive provider credentials, submit verification forms, approve access, or guarantee that a provider will approve an application. A human must own provider accounts, give truthful product and privacy details, approve consent, and submit provider forms. Atlas is preparation and guidance, not an OAuth credential vault or provider approval service.

Timelines are shown as official only when the cited source publishes them. Other durations are labeled estimates, and missing timelines are marked unknown. Scope examples are starting points; verify the actual action-to-scope mapping before requesting access.

## Confidentiality and limitations

- Keep this source repository private and share access only with intended reviewers.
- The live demo is public and contains no provider credentials. Do not enter secrets, tokens, passwords, or customer data into it.
- This is a focused take-home implementation, not the requested full library of 100 guides.
- The live research flow is a best-effort public-web lookup rather than a continuously validated research agent.
- Example data and provider requirements can become stale; follow the linked current provider documentation before shipping.
- The demo does not preserve immutable guide snapshots. Download the JSON when you need to keep the exact guide output you reviewed.
