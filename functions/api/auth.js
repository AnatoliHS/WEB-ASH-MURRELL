// GET /api/auth: starts Decap CMS sign-in (/admin/) by sending the editor to GitHub.
// GitHub then returns them to /api/callback, which hands the token back to the CMS.
//
// Cloudflare Pages environment variables (Settings → Variables and Secrets; locally, .dev.vars):
//   GITHUB_CLIENT_ID      From a GitHub OAuth App whose callback URL is https://<site>/api/callback
//   GITHUB_CLIENT_SECRET  That app's client secret (encrypt it)

export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("CMS sign-in isn't set up: GITHUB_CLIENT_ID is missing.", { status: 500 });
  }

  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
  authorize.searchParams.set("scope", url.searchParams.get("scope") || "repo,user");
  authorize.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      // Checked in /api/callback, so only a sign-in started here can finish there
      "Set-Cookie": `cms_oauth_state=${state}; Path=/api/callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      "Cache-Control": "no-store",
    },
  });
}
