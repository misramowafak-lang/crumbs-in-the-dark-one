// Manually trigger after launch. Protect this endpoint with LAUNCH_ADMIN_SECRET.
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const reply = (data: unknown, status=200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const supplied = req.headers.get("x-launch-secret");
  if (!supplied || supplied !== Deno.env.get("LAUNCH_ADMIN_SECRET")) return reply({ error: "Unauthorized" }, 401);
  try {
    const { subject, message } = await req.json();
    if (!subject || !message) return reply({ error: "subject and message are required" }, 400);
    const url = Deno.env.get("SUPABASE_URL")!; const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const r = await fetch(`${url}/rest/v1/subscribers?select=email`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error(`Subscriber query failed: ${r.status}`);
    const rows = await r.json() as {email:string}[];
    const apiKey = Deno.env.get("RESEND_API_KEY")!;
    let sent = 0; let failed = 0;
    // Send in small batches to stay within provider limits.
    for (const row of rows) {
      const mail = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "CRUMBS IN THE DARK <updates@your-verified-domain.com>", to: [row.email], subject, text: message }) });
      if (mail.ok) sent++; else { failed++; console.error("Launch email failed", row.email, await mail.text()); }
    }
    return reply({ total: rows.length, sent, failed });
  } catch (e) { console.error(e); return reply({ error: "Launch notification failed" }, 500); }
});
