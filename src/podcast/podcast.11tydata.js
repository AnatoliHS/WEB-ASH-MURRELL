module.exports = {
  layout: "episode.njk",
  eleventyComputed: {
    permalink: data => `/podcast/${data.page.fileSlug}/`,
    seoTitle: data => `${data.title} | Amplified Podcast by Ash Murrell`,
  },
};
