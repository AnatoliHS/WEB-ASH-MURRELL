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

  eleventyConfig.addFilter("youtubeId", url => {
    const match = String(url || "").match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return match ? match[1] : "";
  });

  // The wordmark, inline, so MURRELL can follow the header's colour on light sections
  eleventyConfig.addShortcode("wordmark", () =>
    fs.readFileSync("src/assets/images/wordmark.svg", "utf8")
      .trim()
      .replace("<svg ", '<svg aria-hidden="true" focusable="false" ')
      .replace('fill="#fff"', 'fill="currentColor"')
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
