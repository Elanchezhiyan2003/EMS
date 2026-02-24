// Make PostCSS resilient if Tailwind/autoprefixer aren't installed yet.
module.exports = (() => {
  const plugins = {};

  try {
    // prefer require so Vite can resolve from node_modules
    plugins.tailwindcss = require('tailwindcss');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('postcss: tailwindcss not found — skipping tailwind plugin');
  }

  try {
    plugins.autoprefixer = require('autoprefixer');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('postcss: autoprefixer not found — skipping autoprefixer');
  }

  return { plugins };
})();
