# Composio Atlas

**Confidential project source.** This repository is intended for the project owner and the people they explicitly share it with. Do not redistribute the source or its contents without permission. The repository should remain private. It contains no OAuth credentials or provider secrets.

Composio Atlas turns an agent task into a clear app-connection plan. A developer enters an app name and describes what their agent should do. Atlas checks whether Composio has the toolkit and relevant actions, then researches official app documentation for API details, sign-in, permissions, limits, review, and open questions. The guide links its sources and shows what the developer can use, what they need to build, and what still needs verification.

Live demo: https://oauth-setup-atlas.harsh616.chatgpt.site

## What a user does

1. Enter an app name or official website, describe what the agent should do, and choose Python or TypeScript.
2. Atlas checks whether the Composio toolkit and actions fit the task. There are three cases:
   - **Toolkit and action ready:** Composio supplies app actions; the developer wires the task into their agent.
   - **Toolkit ready, custom instruction needed:** Composio supplies reusable app actions, while the developer writes the task-specific instruction and any workflow logic that joins actions together.
   - **Toolkit missing:** Atlas researches the provider API and sign-in. The developer builds the app-specific action; Atlas explains a direct integration path and the optional custom-server path into the developer's own Composio project.
3. Atlas presents a focused brief: task-to-action match, sign-in and token handling, permissions, API limits and edge cases, provider review and timing, and next steps. It links the sources and marks unsupported details as unknown.
4. The developer completes provider-owned steps, keeps credentials private, tests the integration, and asks users to approve their own account connections.
5. The guide can be shared by URL or downloaded as JSON. A shared URL rebuilds the current guide; it is not a frozen historical record.

## Product architecture

The homepage introduces the flow with a diagram and explains where Atlas helps the developer: understanding what Composio already supplies, finding official app requirements, and seeing what remains to build or verify. The three homepage examples demonstrate the three task-fit cases: Google Drive for toolkit plus action, Slack for toolkit plus developer-written instruction, and Acuity Scheduling for an app with no listed toolkit. The search accepts other app names and websites too.

The guide helps a developer make five decisions:

- **Connection route:** whether Composio manages OAuth for the app, or whether the developer needs a provider-owned OAuth app.
- **Implementation:** which packages, commands, environment variable names, and code examples apply.
- **Permissions:** which actions and scopes are relevant to the requested task, with links and caveats.
- **Readiness:** what can be prepared now, what a person or provider still needs to do, and what to watch for after submission.
- **Custom route:** whether a developer can add a remote MCP server to their own Composio project, what Composio needs, what the developer still builds, and where auth compatibility may block the route. This does not publish a toolkit in the public directory.
- **Evidence:** which sources support each claim, how confident Atlas is, and what remains unknown.

### Key decisions and why

- **Check Composio first.** If Composio already manages the OAuth app, a developer can often avoid creating a separate provider OAuth client. This distinction is central to the problem the tool is meant to solve.
- **Accept any app name or website.** Developers should be able to try the app they actually need, even if it is not one of the homepage examples. The research fallback searches for public provider documentation and attempts to build a useful guide.
- **Separate toolkit availability from task fit.** A toolkit is a collection of app actions. A developer's instruction describes the task and how the agent should use those actions. Having a toolkit does not mean every workflow is ready-made.
- **Structure the research around developer questions.** The guide leads with the task match, then access and permissions, practical API limits, and review or implementation next steps. Short candidate descriptions replace raw page excerpts, and each claim points to its source.
- **Put evidence next to guidance.** OAuth setup can involve provider-specific rules. The guide links material claims to Composio or provider sources and leaves missing facts unknown instead of filling gaps with guesses.
- **Explain the missing-app route.** A missing toolkit does not become a working integration just by adding OAuth. Atlas now explains the direct option and the custom MCP route, separating the API action the developer writes from the tool discovery and session routing Composio can add.
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
2. For an unrecognized app, Atlas runs focused searches for the task-specific API endpoint, OAuth setup/token lifecycle, task permissions, review/timing, and rate limits/pagination. It favors provider-owned documentation and extracts pages from likely official domains when available.
3. Findings use a fixed JSON shape: app identity, managed-auth status, task-matched API route candidates, setup steps, packages and code, scopes, review requirements and timing, custom Composio route options, agent and human responsibilities, sources, confidence, and uncertainties.
4. Provider claims should come from provider sources; Composio behavior claims should come from Composio documentation. Unsupported details stay marked unknown.
5. The guide renders source links beside the guidance. For Composio-managed flows, the developer can run the included scope recommendation in their own environment with their own Composio key.

The unfamiliar-app path is deterministic web search and page extraction, not an autonomous LLM research agent. It searches for the requested task, OAuth and token lifecycle, permissions, review and timing, and API limits. It extracts only a few routes that match the task and labels them as candidates to verify, not generated integrations. Guide quality depends on public documentation; small or new apps may have gaps.

## How to run it

Requirements: Node.js 20 or newer.

```bash
node --input-type=module -e "import worker from './worker/index.js'; const r = await worker.fetch(new Request('http://localhost/')); console.log(r.status)"
bash scripts/build.sh
node scripts/validate-artifact.mjs
npm test
```

The first command makes a local smoke request directly to the Worker module. The build and validation commands create and check the deployment artifact. `npm test` runs the guide builder against mocked official provider docs and checks that the missing-app route, API findings, and Composio custom path are present. The hosted demo runs on the Sites platform.

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

- The homepage demonstrates three task-fit cases. It is not a pre-researched catalogue of every OAuth app. Search accepts other apps, but some results may be partial.
- The research flow is best-effort public-web search and extraction. It can miss official pages, sites can block automated access, and public pages may change. Short route matches are candidates; verify inputs and responses against the linked source before implementation.
- Smaller or newer apps may not publish OAuth setup, scope, review, or timing details. Atlas marks those gaps unknown; a developer may need to contact the provider.
- Atlas does not create OAuth apps, receive provider credentials, submit provider forms, or approve applications. A person must complete provider account, legal, verification, and end-user consent steps.
- The custom Composio route requires the developer to build and host their own HTTPS MCP server and its app-specific actions. Custom MCP is experimental and its OAuth connection supports DCR; other provider OAuth flows may need to be handled by the developer’s server. A custom project toolkit is separate from Composio’s public catalog.
- Review durations are shown as official only when a cited provider source publishes them. Other durations are estimates; missing durations remain unknown.
- Composio scope recommendations depend on the selected actions and toolkit version. Review the output before requesting consent.
- The demo does not preserve immutable guide snapshots. Download the JSON to keep the exact guide output you reviewed.

## Confidentiality

Keep this source repository private and share access only with intended reviewers. The public demo contains no provider credentials. Do not enter secrets, tokens, passwords, or customer data into it.
