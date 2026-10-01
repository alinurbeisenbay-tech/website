# Unect Talks — registration landing page

Static site: `index.html`, `styles.css`, `script.js`, `assets/`. No build step.

- **Text (Russian + Kazakh) and speakers:** all in `texts.js`. `?lang=kz` in the link opens the Kazakh version.
- **Date / time / venue / description:** edit `index.html` (marked with `TODO`).
- **Saving registrations:** follow the steps in `google-apps-script.js`, then paste the URL into `FORM_ENDPOINT` in `script.js`. Until then the form runs in demo mode and saves nothing.
- **Hosting:** GitHub Pages, Netlify or Vercel — upload the folder as is.
