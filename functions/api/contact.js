// POST /api/contact: the site's contact forms (contact page and the header drawer).
// Checks the Cloudflare Turnstile token, then sends the message to Ash with Resend.
//
// Cloudflare Pages environment variables (Settings → Variables and Secrets; locally, .dev.vars):
//   TURNSTILE_SECRET_KEY  Turnstile widget's secret key (encrypt it)
//   RESEND_API_KEY        Resend API key with send access (encrypt it)
//   CONTACT_TO_EMAIL      Where messages go. Default: info@ashmurrell.com
//   CONTACT_FROM_EMAIL    Sender, on a domain verified in Resend,
//                         e.g. "Ash Murrell website <website@ashmurrell.com>"

const REASONS = ["Photography", "Brand Strategy", "Consulting", "Speaking"];
const LIMITS = { name: 120, email: 254, business: 160, website: 300, message: 5000 };
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (value, max) => String(value ?? "").trim().slice(0, max);

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function readBody(request) {
  const type = request.headers.get("Content-Type") || "";
  if (type.includes("application/json")) return request.json();
  return Object.fromEntries(await request.formData());
}

async function verifyTurnstile(token, secret, ip) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  if (!res.ok) return false;
  const outcome = await res.json();
  return outcome.success === true;
}

export async function onRequestPost({ request, env }) {
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) {
    console.error("Contact form: missing TURNSTILE_SECRET_KEY, RESEND_API_KEY or CONTACT_FROM_EMAIL");
    return json({ ok: false, error: "The form isn't set up yet." }, 500);
  }

  let data;
  try {
    data = await readBody(request);
  } catch {
    return json({ ok: false, error: "That didn't come through properly. Please try again." }, 400);
  }

  // Honeypot: hidden from people, so anything in it came from a bot. Pretend it worked.
  if (clean(data.company_site, 300)) return json({ ok: true });

  const first = clean(data.first, LIMITS.name);
  const last = clean(data.last, LIMITS.name);
  const name = clean(data.name, LIMITS.name) || `${first} ${last}`.trim();
  const email = clean(data.email, LIMITS.email);
  const business = clean(data.business, LIMITS.business);
  const website = clean(data.website, LIMITS.website);
  const reason = clean(data.reason, 40);
  const message = clean(data.message, LIMITS.message);
  const token = clean(data["cf-turnstile-response"], 2048);

  if (!name || !EMAIL_RE.test(email) || !REASONS.includes(reason) || !message) {
    return json({ ok: false, error: "Please fill in your name, a valid email, a reason and a message." }, 400);
  }
  if (!token) {
    return json({ ok: false, error: "Please complete the security check." }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP");
  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip))) {
    return json({ ok: false, error: "The security check didn't pass. Please try again." }, 403);
  }

  const details = [
    ["Name", name],
    ["Email", email],
    ["Reason", reason],
    ["Business", business],
    ["Website", website],
  ].filter(([, v]) => v);

  const text = `${message}\n\n---\n${details.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  const html =
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p><hr>` +
    `<table>${details.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL || "info@ashmurrell.com"],
      reply_to: email,
      subject: `${reason} enquiry from ${name}`,
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Contact form: Resend error", res.status, await res.text());
    return json({ ok: false, error: "Your message couldn't be sent just now." }, 502);
  }

  return json({ ok: true });
}

// Anything but POST
export const onRequest = () => json({ ok: false, error: "Method not allowed" }, 405);
