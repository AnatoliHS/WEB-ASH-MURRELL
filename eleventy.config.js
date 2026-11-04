const fs = require("fs");

module.exports = function(eleventyConfig) {
  // src/assets is served from the site root: /style.css, /images/...
  eleventyConfig.addPassthroughCopy({ "./src/assets/": "/" });

  eleventyConfig.addLayoutAlias("default", "default.njk");
  eleventyConfig.addGlobalData("layout", "default");

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
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
  };
};
