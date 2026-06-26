// Sends a single chat message to /api/chat and prints the streamed response.
// Used as a smoke test that the system prompt is loaded into the conversation.
//
// Usage:
//   $env:NODE_EXTRA_CA_CERTS = (Resolve-Path .\techloq-ca.pem).Path
//   $cookie = (curl ...auth...) .cookie
//   node scripts/probe-chat.mjs "<cookie>" "<message>"

const cookie = process.argv[2];
const userMessage = process.argv[3] || "What is your name?";

if (!cookie) {
  console.error("Usage: node scripts/probe-chat.mjs <cookie> [message]");
  process.exit(2);
}

const res = await fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: cookie,
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: userMessage }],
  }),
});

if (!res.ok) {
  console.error("HTTP", res.status, await res.text());
  process.exit(1);
}

console.log(`[conversationId: ${res.headers.get("X-Conversation-Id")}]`);
process.stdout.write("> ");
const reader = res.body.getReader();
const decoder = new TextDecoder();
let acc = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  process.stdout.write(chunk);
  acc += chunk;
}
console.log("\n---");
console.log("Total chars:", acc.length);
