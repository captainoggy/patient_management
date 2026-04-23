/**
 * Vercel serverless: proxies /api/* to Render.
 * Vercel project root must be `frontend` so this `api/` folder is deployed.
 * Use ESM — `package.json` has "type": "module" (CJS `module.exports` can fail).
 */
const UPSTREAM = (
  process.env.RENDER_API_ORIGIN || "https://patient-mgmt-api-o6ma.onrender.com"
).replace(/\/$/, "");

export default async function handler(req, res) {
  const path = req.url && req.url.startsWith("/") ? req.url : `/${req.url || ""}`;
  const target = `${UPSTREAM}${path}`;

  const headers = new Headers();
  if (req.headers["content-type"]) {
    headers.set("content-type", String(req.headers["content-type"]));
  }
  if (req.headers.cookie) {
    headers.set("cookie", String(req.headers.cookie));
  }
  if (req.headers["x-csrftoken"]) {
    headers.set("x-csrftoken", String(req.headers["x-csrftoken"]));
  }
  if (req.headers["x-clinic-id"]) {
    headers.set("x-clinic-id", String(req.headers["x-clinic-id"]));
  }
  if (req.headers["x-client-calendar-date"]) {
    headers.set("x-client-calendar-date", String(req.headers["x-client-calendar-date"]));
  }
  if (req.headers["x-forwarded-for"]) {
    headers.set("x-forwarded-for", String(req.headers["x-forwarded-for"]));
  }

  const method = req.method || "GET";
  const hasBody = !["GET", "HEAD"].includes(method);
  let body;
  if (hasBody) {
    if (typeof req.body === "string") {
      body = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      body = req.body;
    } else if (req.body == null) {
      body = undefined;
    } else {
      body = JSON.stringify(req.body);
    }
  }

  const r = await fetch(target, {
    method,
    headers,
    body: hasBody ? body : undefined,
  });

  res.status(r.status);
  if (r.headers.getSetCookie) {
    for (const c of r.headers.getSetCookie()) {
      res.append("set-cookie", c);
    }
  } else {
    const c = r.headers.get("set-cookie");
    if (c) {
      res.setHeader("set-cookie", c);
    }
  }
  const ct = r.headers.get("content-type");
  if (ct) {
    res.setHeader("content-type", ct);
  }
  const text = await r.text();
  res.send(text);
}
