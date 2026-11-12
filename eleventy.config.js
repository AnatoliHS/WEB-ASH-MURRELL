const fs = require("fs");

module.exports = function(eleventyConfig) {
  // src/assets is served from the site root: /style.css, /images/...
  eleventyConfig.addPassthroughCopy({ "./src/assets/": "/" });

  eleventyConfig.addLayoutAlias("default", "default.njk");
  eleventyConfig.addGlobalData("layout", "default");

  eleventyConfig.addCollection("episodeList", api =>
    api.getFilteredByGlob("src/podcast/*.md").sort((a, b) => b.data.episode - a.data.episode)
  );
  eleventyConfig.addCollection("postList", api =>
    api.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("first", (items, count) => items.slice(0, count));

  // The items either side of a page in a newest-first list
  eleventyConfig.addFilter("neighbours", (items, url) => {
    const i = items.findIndex(item => item.url === url);
    return { newer: items[i - 1], older: items[i + 1] };
  });

  eleventyConfig.addFilter("readableDate", date =>
    new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(date))
  );

  // A clean one-line summary for llms.txt. The imported descriptions often stop mid-sentence
  // with "…": those are rebuilt from the opening sentences of the page itself (its HTML),
  // up to about 300 characters, always ending on a full sentence.
  const decode = s => s
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n));
  const sentences = s => s.match(/[^.!?]+[.!?]+["'”’)]*(\s+|$)/g) || [];
  eleventyConfig.addFilter("cleanSummary", (description, html) => {
    let s = String(description || "").replace(/^Embed\s+/, "").replace(/\s+/g, " ").trim();
    if (!s.endsWith("…")) return s;
    const body = decode(String(html || "")
      .replace(/<(h\d|figure|iframe|script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "))
      .replace(/^\s*Embed\s+/, "").replace(/\s+/g, " ").trim();
    let out = "";
    for (const sentence of sentences(body)) {
      if (out && (out + sentence).length > 300) break;
      out += sentence;
    }
    return out.trim() || s;
  });

  eleventyConfig.addFilter("youtubeId", url => {
    const match = String(url || "").match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return match ? match[1] : "";
  });

  // The wordmark, inline, so MURRELL can follow the header's colour and glitch out as the brand
  // docks (only the ASH box docks). MURRELL is wrapped in a group with two colour-split copies.
  eleventyConfig.addShortcode("wordmark", () =>
    fs.readFileSync("src/assets/images/wordmark.svg", "utf8")
      .trim()
      .replace("<svg ", '<svg aria-hidden="true" focusable="false" ')
      .replace(
        /<path transform="([^"]+)" d="([^"]+)" fill="#fff"\/>/,
        (_, t, d) =>
          `<g transform="${t}"><g class="wm-murrell">` +
          `<path class="wm-split wm-split-l" d="${d}" fill="#cc5500"/>` +
          `<path class="wm-split wm-split-r" d="${d}" fill="#de9e3b"/>` +
          `<path d="${d}" fill="currentColor"/>` +
          `</g></g>`
      )
  );

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // After build, if outputting to dist, also mirror to _site (or vice versa)
  // so Cloudflare Pages succeeds whether Build Output Directory is set to 'dist' or '_site'.
  // Only on one-off builds: under --serve/--watch the copy can overlap a rebuild and fail
  eleventyConfig.on("eleventy.after", async ({ dir, runMode }) => {
    if (runMode !== "build") return;
    const outDir = dir.output;
    const targetDir = outDir === "dist" ? "_site" : (outDir === "_site" ? "dist" : null);
    if (targetDir && fs.existsSync(outDir)) {
      fs.cpSync(outDir, targetDir, { recursive: true });
    }
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: process.env.ELEVENTY_OUTPUT || "dist",
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
};
