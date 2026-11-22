# AGENTS.md — Engawa theme

This directory is the **Engawa** Hugo theme, vendored in the gaijin_blog repo
and also shipped standalone at https://github.com/gaijinblog/engawa. When
vendored in-repo — edit it directly as part of this project.

## Read before working here

| Need | File |
| ---- | ---- |
| Features, install, front matter, shortcodes, i18n, schemes (for humans) | `README.md` |
| Layouts, SCSS/JS pipelines, Furifont plumbing, config merge | `docs/INTERNALS.md` |
| Default keys and meanings | `config/_default/params.toml`, `config/_default/markup.toml` |
| Runnable demo (max config, min content) | `exampleSite/` — `hugo server --themesDir ../..` from that folder |
| Licenses | `LICENSE` (MIT, theme code), `THIRD-PARTY-NOTICES.md` (Furifont OFL + IVS tables CC BY-SA) |

Never edit the bundled font binaries or their license files under
`static/fonts/furifont/`.

## Rules

- **No negative documentation** — document what Engawa *does*, not what it
  lacks. Never add sections, samples, or caveats about unsupported features
  ("not bundled", "not wired", "no … yet", "no <engine> support") or describe
  missing integrations. If a capability does not exist, leave it undocumented.
  Describe shipped features, their usage, and their behavior; frame real
  behavior positively (e.g. "wide equations scroll inside their panel", not
  "there is no overflow handling").
- **UI strings** — only from `i18n/*.toml`. Never hardcode chrome text in
  layouts or content.
- **Site vs theme** — do not put site branding, content, or site-only config
  into this directory. Site-owned color schemes live in the *site's*
  `assets/scss/` + `_custom-schemes.scss` (copy `exampleSite/assets/scss/_blogger.scss`
  as the full template, or `_aurora.scss` for a minimal one). Theme-native
  schemes are `light` and `dark` only.
- **Content-facing changes** — markdown, shortcodes, front matter, captions,
  furigana *usage* must stay documented in the consuming site's markup-demo
  post (see that site's root `AGENTS.md`). Update all language copies of the
  demo in the same change.
- **Furigana scope** — adding an annotatable container requires **two matching
  edits**: `SCOPE` in `assets/js/furifont.js` and `$furigana-scopes` in
  `assets/scss/_furifont.scss`. Keep them identical.
- **Color schemes (site-owned)** — list the slug in `params.colorScheme.schemes`
  (and `darkish` if the background is dark), `@use` the file from the site's
  `_custom-schemes.scss`, optional `theme.<slug>` i18n + `partials/scheme-icons/<slug>.html`.
  Do **not** hardcode site scheme names into theme JS/layouts; the switcher is
  params-driven.
- **After theme edits** — `hugo -D --quiet` (or `hugo server -D`) from the site
  root must succeed.

## Install into a site (agent prompt)

When a user asks an agent to install Engawa into a Hugo site, follow this
block verbatim. Do not modify files inside the theme directory after install
except when the user explicitly requests theme changes.

```text
Install the Engawa Hugo theme (https://github.com/gaijinblog/engawa) into this
Hugo site and wire up the required site configuration. Follow every step; do
not modify anything inside the theme directory afterwards.

1. Check prerequisites: `hugo version` must be >= 0.157.0, and a `sass`
   binary (Dart Sass) must exist on PATH (`sass --version`). Install Dart Sass
   if missing (`brew install dart-sass` on macOS, `npm install -g sass`
   otherwise). Hugo Extended is NOT required.
2. Vendor the theme: `git submodule add https://github.com/gaijinblog/engawa
   themes/hugo-theme-engawa` (or a plain `git clone` if the site is not a git
   repository).
3. In the site config (`hugo.toml` or `config/_default/hugo.toml`):
   - set `theme = "hugo-theme-engawa"`
   - set `baseURL` and `title` to the site's real values
   - add:
       [markup]
           _merge = 'deep'
     (required — Hugo needs explicit site opt-in for theme markup config)
   - add:
       [permalinks]
           post = "/p/:slug/"
           page = "/:slug/"
   - only if comments are wanted:
       [services.disqus]
           shortname = "your-shortname"
4. In `config/_default/params.toml` (create or merge), set at minimum:
       mainSections = ["post"]
       [author]
           name        = "<site author>"
           avatar      = "img/avatar.svg"   # file in static/img/; empty hides the avatar
           avatarStyle = "photo"            # photo | mark
           bio         = "<one line>"
   Every other key has commented defaults in the theme's own
   config/_default/params.toml — copy only what you want to change.
5. Create `content/page/search/index.md`:
       ---
       title: "Search"
       slug: "search"
       layout: "search"
       outputs:
           - html
           - json
       sidebar: false
       ---
   (the JSON output is the search index; without it the search widget is inert)
6. Create `content/page/archives/index.md`:
       ---
       title: "Archives"
       date: <any past date>
       layout: "archives"
       slug: "archives"
       ---
7. Set the main menu in each page's front matter (NOT in menu.toml):
       menu:
           main:
               weight: <negative or positive int, lower = more left>
               params:
                   icon: <home | user | link | …>
8. Optional favicons: place `favicon-32.png`, `favicon.ico`,
   `apple-touch-icon.png` in `static/img/`. Files that exist are emitted
   automatically; missing files are safely skipped (no 404s).
9. Never hardcode UI strings in content; UI chrome comes from the theme's
   i18n files.
10. Verify: `hugo` (or `hugo server`) must build without errors; check that
    the home page, /search/, and /archives/ render, and that the sidebar
    search widget works. Report what was created/changed.
```
