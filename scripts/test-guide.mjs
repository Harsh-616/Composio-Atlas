import assert from "node:assert/strict";
import worker from "../worker/index.js";

const originalFetch = globalThis.fetch;
const authDoc = `Pixelfed OAuth 2.0 authorization code. Register an app with POST /api/v1/apps. Redirect the user to /oauth/authorize and exchange the code with POST /oauth/token. Ask only for the read scope. GET /api/v1/accounts/{id}/statuses returns the account's posts. Tokens can be revoked by the user.`;
const apiDoc = `API: GET /api/v1/accounts/{id}/statuses lists the account's posts. Use pagination for additional results. API requests may return rate limits.`;
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  if (url.hostname === "docs.composio.dev") {
    return new Response("No matching managed toolkit found", { headers: { "content-type": "text/html" } });
  }
  if (url.hostname === "html.duckduckgo.com") {
    const html = [
      '<a class="result__a" href="https://developers.pixelfed.org/api/authentication">Pixelfed OAuth authentication</a>',
      '<a class="result__a" href="https://developers.pixelfed.org/api/statuses">Pixelfed API statuses</a>',
    ].join("");
    return new Response(html, { headers: { "content-type": "text/html" } });
  }
  if (url.hostname === "developers.pixelfed.org") {
    return new Response(url.pathname.endsWith("authentication") ? authDoc : apiDoc, { headers: { "content-type": "text/html" } });
  }
  throw new Error(`Unexpected fetch in isolated test: ${url.hostname}`);
};

try {
  const response = await worker.fetch(new Request("https://atlas.test/api/guide", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Pixelfed", intent: "Summarize my latest posts", language: "typescript" }),
  }));
  assert.equal(response.status, 200);
  const guide = await response.json();
  assert.equal(guide.composio.status, "not_listed");
  assert.equal(guide.composioCustom.available, true);
  assert.ok(guide.composioCustom.sourceIds.includes("composio-custom-mcp"));
  assert.ok(guide.composioCustom.limits.some((x) => x.includes("DCR")));
  assert.ok(guide.apiResearch.task.includes("latest posts"));
  assert.equal(guide.apiResearch.endpointCandidates.length, 1, "only task-matched routes should be shown");
  assert.equal(guide.apiResearch.endpointCandidates[0].label, "List recent posts");
  assert.ok(guide.apiResearch.endpointCandidates[0].path.includes("statuses"));
  assert.ok(!guide.apiResearch.endpointCandidates.some((x) => /oauth|\/apps/.test(x.path)));
  assert.ok(guide.requirements.some((x) => x.id === "tokens"));
  assert.ok(guide.requirements.some((x) => x.id === "limits"));
  assert.ok(guide.sources.some((x) => x.id === "composio-custom-mcp"));

  const schema = await worker.fetch(new Request("https://atlas.test/api/schema"));
  const shape = await schema.json();
  assert.ok(shape.guideShape.composioCustom);
  assert.ok(shape.guideShape.apiResearch);

  const page = await worker.fetch(new Request("https://atlas.test/"));
  const html = await page.text();
  assert.ok(html.includes("Turn an agent task into a clear connection plan."));
  assert.ok(html.includes("From “I want my agent to do this” to “here’s what I need to build.”"));
  assert.ok(html.includes("TOOLKIT + ACTION READY"));
  assert.ok(html.includes("TOOLKIT, CUSTOM INSTRUCTION"));
  assert.ok(html.includes("TOOLKIT NOT LISTED"));
  assert.ok(html.includes("THE RESEARCH BRIEF"));
  assert.ok(html.includes("Add to Composio"));
  assert.ok(!html.includes('\\"+(g.composioCustom?'), "navigation should not expose JavaScript source as page text");
  assert.ok(html.includes('Provider setup</a>"+(g.composioCustom?'), "custom navigation link should be rendered dynamically");
  const browserScript = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
  assert.ok(browserScript, "homepage should include its browser code");
  new Function(browserScript); // Parse the generated client script without executing browser code.
  const acuity = await worker.fetch(new Request("https://atlas.test/api/guide", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Acuity Scheduling", intent: "List appointments", language: "python" }),
  }));
  const acuityGuide = await acuity.json();
  assert.equal(acuityGuide.composio.status, "not_listed");
  assert.ok(acuityGuide.composioCustom.available, "reviewed unsupported-app example should show custom route");
  assert.equal(acuityGuide.apiResearch.endpointCandidates[0].method, "GET");
  assert.equal(acuityGuide.apiResearch.endpointCandidates[0].path, "/api/v1/appointments");
  assert.ok(acuityGuide.sources.some((x) => x.id === "acuity-appointments"));
  console.log("Guide test passed: task-mapped API research, custom Composio route, schema, and homepage.");
} finally {
  globalThis.fetch = originalFetch;
}
