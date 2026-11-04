module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: data => `/blog/${data.page.fileSlug}/`,
    seoTitle: data => `${data.title} | Ash Murrell`,
  },
};
