# Composio Atlas

**Confidential project source.** This repository is intended for the project owner and the people they explicitly share it with. Do not redistribute the source or its contents without permission. The repository should remain private. It contains no OAuth credentials or provider secrets.

Composio Atlas helps an agent builder understand how to connect an app to their product. A developer enters an app name or website, describes the task their agent needs to do, and gets an evidence-linked guide. Atlas first checks whether Composio manages OAuth for that app. When a managed toolkit is available, the guide explains that path. When it is not, Atlas researches public provider documentation and shows a provider-native path where the evidence supports one.

Live demo: https://oauth-setup-atlas.proudbox2.chatgpt.site

## What a user does

1. Enter any app name or official website, describe what their agent should do, and choose Python or TypeScript.
2. Atlas checks the Composio directory and selects the managed or provider-native route.
3. Atlas shows the available implementation guide: setup steps, packages and commands, code, actions and scopes, time expectations, submission checklist, sources, and open questions.
4. The developer completes provider-owned steps, keeps credentials private, tests the integration, and asks users to approve their own account connections.
5. The guide can be shared by URL or downloaded as JSON. A shared URL rebuilds the current guide; it is not a frozen historical record.

## Product architecture

The homepage is an open app search and guide builder, not a menu limited to the featured cards. It accepts other app names and websites. The three homepage cards show two Composio-managed routes, Google Drive and Slack, and one provider-native example, Acuity Scheduling. The cards are examples of different setup paths, not the limits of the search.

The guide helps a developer make five decisions:

- **Connection route:** whether Composio manages OAuth for the app, or whether the developer needs a provider-owned OAuth app.
- **Implementation:** which packages, commands, environment variable names, and code examples apply.
- **Permissions:** which actions and scopes are relevant to the requested task, with links and caveats.
- **Readiness:** what can be prepared now, what a person or provider still needs to do, and what to watch for after submission.
- **Evidence:** which sources support each claim, how confident Atlas is, and what remains unknown.

### Key decisions and why

- **Check Composio first.** If Composio already manages the OAuth app, a developer can often avoid creating a separate provider OAuth client. This distinction is central to the problem the tool is meant to solve.
- **Accept any app name or website.** Developers should be able to try the app they actually need, even if it is not one of the homepage examples. The research fallback searches for public provider documentation and attempts to build a useful guide.
- **Show two managed examples and one provider-native example.** Google Drive and Slack demonstrate managed OAuth, while Acuity shows what changes when the provider documents a direct OAuth flow. This makes the route decision visible without suggesting the app library is complete.
- **Put evidence next to guidance.** OAuth setup can involve provider-specific rules. The guide links material claims to Composio or provider sources and leaves missing facts unknown instead of filling gaps with guesses.
- **Tie permissions to the task.** The agent's task should determine the actions and candidate scopes. A broad generic permission list could ask end users for access the product does not need.
- **Separate preparation from approval.** Research and code drafting can be automated, but a person still owns provider accounts, truthful app details, legal terms, credential handling, and any submission or consent.
- **Keep the prototype small and deployable.** A JavaScript Worker and a fixed JSON guide structure provide a focused take-home slice without paid accounts or a large runtime stack.

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

1. For a small set of apps, Atlas uses reviewed examples and Composio directory information. The example data includes Composio and provider sources.
2. For an unrecognized app, Atlas searches public web results, favors the provider's own developer documentation and policies, and extracts pages from likely official domains when available.
3. Findings use a fixed JSON shape: app identity, managed-auth status, setup steps, packages and code, scopes, review requirements and timing, agent and human responsibilities, sources, confidence, and uncertainties.
4. Provider claims should come from provider sources; Composio behavior claims should come from Composio documentation. Unsupported details stay marked unknown.
5. The guide renders source links beside the guidance. For Composio-managed flows, the developer can run the included scope recommendation in their own environment with their own Composio key.

The unfamiliar-app path is deterministic web search and page extraction. It is not an LLM research agent. It attempts to work across apps, but guide quality depends on what can be found in public, high-confidence sources. It may not find enough detail for an app, especially a smaller or newer service with limited developer documentation.

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

## Limitations

- The homepage highlights three paths. It is not a pre-researched catalogue of every OAuth app. Search accepts other apps, but some results may be partial.
- The research flow is best-effort public-web search and extraction. Search can miss official pages, sites can block automated access, and public pages can change.
- Smaller or newer apps may not publish OAuth setup, scope, review, or timing details. Atlas marks those gaps unknown; a developer may need to contact the provider.
- Atlas does not create OAuth apps, receive provider credentials, submit provider forms, or approve applications. A person must complete provider account, legal, verification, and end-user consent steps.
- Review durations are shown as official only when a cited provider source publishes them. Other durations are estimates; missing durations remain unknown.
- Composio scope recommendations depend on the selected actions and toolkit version. Review the output before requesting consent.
- The demo does not preserve immutable guide snapshots. Download the JSON to keep the exact guide output you reviewed.

## Confidentiality

Keep this source repository private and share access only with intended reviewers. The public demo contains no provider credentials. Do not enter secrets, tokens, passwords, or customer data into it.
