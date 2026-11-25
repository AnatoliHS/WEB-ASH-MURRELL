// GET /api/callback: GitHub returns here after sign-in (see auth.js). Swaps the code for a token,
// then passes it to the CMS window that opened this popup, using Decap's message handshake.

const page = (status, content) => {
  // JSON inside a <script>: escape "<" so the data can't close the tag
  const message = JSON.stringify(`authorization:github:${status}:${JSON.stringify(content)}`).replace(/</g, "\\u003c");
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Signing in…</title><p>Signing in…</p>
<script>
  (function () {
    var origin = location.origin;
    function reply(e) {
      if (e.origin !== origin || e.data !== "authorizing:github") return;
      window.removeEventListener("message", reply);
      window.opener.postMessage(${message}, origin);
    }
    if (!window.opener) { document.body.textContent = "Open the CMS at /admin/ to sign in."; return; }
    window.addEventListener("message", reply);
    window.opener.postMessage("authorizing:github", origin);
  })();
</script>`,
    {
      status: status === "success" ? 200 : 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Set-Cookie": "cms_oauth_state=; Path=/api/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
      },
    }
  );
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)cms_oauth_state=([^;]+)/);

  if (url.searchParams.get("error")) {
    return page("error", { message: url.searchParams.get("error_description") || "GitHub sign-in was cancelled." });
  }
  if (!code || !state || !cookie || cookie[1] !== state) {
    return page("error", { message: "Sign-in expired or didn't match. Close this window and try again." });
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "decap-cms-auth" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!data.access_token) {
    return page("error", { message: data.error_description || "GitHub didn't return a token." });
  }
  return page("success", { token: data.access_token, provider: "github" });
}
