# Engawa

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/gaijinblog/engawa/blob/main/LICENSE)
[![Hugo](https://img.shields.io/badge/Hugo-%E2%89%A5%200.157-blue)](https://gohugo.io/)
[![Sass](https://img.shields.io/badge/SCSS-Dart%20Sass-CC6699)](https://sass-lang.com/dart-sass/)
![Furigana](https://img.shields.io/badge/Furigana-built%20in-7A3E9D)

A calm, reading-first Hugo theme for long-form blogs. Soft Japanese design
language (*ma* 間 — intentional empty space — paper & ink), multilingual UI,
built-in color schemes (plus an extension path for your own), Furifont
furigana, modest search, Disqus, and comfortable image viewing.

| | |
| --- | --- |
| **Furigana** | Rendered *by the font itself* (IVS ligatures) — no `<ruby>` DOM. Header toggle: Off / Hiragana / Romaji. |
| **Color schemes** | Built-in: System, Light, Dark. Add site-owned schemes with config + one SCSS file each (see exampleSite for blogger / aurora). |
| **Languages** | UI: English, 日本語, Português (BR), 简体中文, 繁體中文. Add another via a theme `i18n` file. |
| **Content** | Heading anchors, GFM alerts, task lists, footnotes, ruby, lightbox + captions, galleries, video embeds |
| **Comments / Search** | Disqus / client-side JSON index |

## Requirements

- Hugo ≥ 0.157.0 (Extended **not** required — SCSS uses Dart Sass)
- [Dart Sass](https://sass-lang.com/dart-sass/) on `PATH` (`sass` binary):
  - macOS: `brew install dart-sass`
  - npm: `npm install -g sass`
  - Or set `DART_SASS_BINARY` to any dart-sass executable

## Install

> [!TIP]
> Using an AI coding agent (Cursor, Claude Code, OpenCode, …)? Ask it to
> install Engawa — the step-by-step prompt lives in
> [`AGENTS.md`](AGENTS.md) (*Install into a site*). Manual steps below.

### Try the example site

This repository includes a traditional `exampleSite/` — **full theme
configuration**, minimal content (two posts, a few pages, en + ja). From the
theme directory (when it lives at `themes/hugo-theme-engawa`):

```bash
cd exampleSite
hugo server --themesDir ../..
```

It enables the header bar, Disqus stub, furigana, lightbox captions, mark
avatar, multilingual chrome, and two sample site-owned schemes (`blogger`,
`aurora`).

### Add the theme to your site

Clone or submodule into `themes/hugo-theme-engawa`, then set in your site
`hugo.toml` (or `config/_default/hugo.toml`):

```toml
theme = "hugo-theme-engawa"
```

### Markup merge (required)

> [!IMPORTANT]
> Hugo does **not** merge `markup` from themes by default. Opt in so the
> theme's goldmark / TOC / highlight settings apply:

```toml
[markup]
    _merge = 'deep'
```

Site-side `markup` values always win. Only add a site `markup.toml` if you
need to override the theme defaults in `config/_default/markup.toml`.

### Required site setup

1. **`hugo.toml`** — identity, permalinks, optional Disqus:

   ```toml
   baseURL = "https://example.com"
   title   = "My Blog"
   theme   = "hugo-theme-engawa"

   [permalinks]
       post = "/p/:slug/"
       page = "/:slug/"

   [services.disqus]
       shortname = "your-shortname"   # only if using comments
   ```

2. **`params.toml`** — at least author identity (`mainSections` defaults to
   `["post"]` in the theme):

   ```toml
   mainSections = ["post"]

   [author]
       name        = "You"
       avatar      = "img/avatar.svg"   # under static/; empty hides the avatar
       avatarStyle = "photo"            # photo | mark
       bio         = "One line about you"
   ```

   Every configurable key is documented in
   [`config/_default/params.toml`](config/_default/params.toml) — copy only
   what you want to change.

3. **Search page** — `content/page/search/index.md` (JSON output feeds the
   sidebar widget; without it search stays inert):

   ```markdown
   ---
   title: "Search"
   slug: "search"
   layout: "search"
   outputs:
       - html
       - json
   sidebar: false
   ---
   ```

4. **Archives page** — `content/page/archives/index.md`:

   ```markdown
   ---
   title: "Archives"
   date: 2019-05-28
   layout: "archives"
   slug: "archives"
   ---
   ```

5. **Main menu** — on each page you want in the nav (not in `menu.toml`):

   ```markdown
   menu:
       main:
           weight: -90
           params:
               icon: home
   ```

6. **Favicons** (optional) — place `favicon-32.png`, `favicon.ico`, and/or
   `apple-touch-icon.png` in `static/img/`. Present files are emitted;
   missing ones are skipped. `params.favicon` adds an SVG icon.

## Configuration reference

Theme defaults live under [`config/_default/`](config/_default/):

| File | Role |
| ---- | ---- |
| [`params.toml`](config/_default/params.toml) | Author, color schemes, home/article/sidebar, search, comments, images, footer, header bar, furigana, fonts |
| [`markup.toml`](config/_default/markup.toml) | Goldmark (raw HTML, image attributes), TOC `h2`–`h4`, Chroma highlighting |

Override any key in the site's own `config/_default/`. Comments in those
files describe every field and its allowed values.

## Post front matter

| Field | Effect |
| ----- | ------ |
| `title` | Page title (lists use it too) |
| `date` | Meta panel, RSS `pubDate`, list sorting |
| `draft` | Excluded from builds; comments skipped |
| `slug` | Permalink (`/p/:slug/`) |
| `description` | `<meta>` description; RSS fallback |
| `summary` | Lead on the post page; list excerpts; RSS fallback |
| `categories` / `tags` | Meta chips, sidebar/footer taxonomy |
| `image` | Cover (page resource), list thumbs, `og:image` |
| `sidebar` / `fullWidth` / `wideFooter` | Layout flags (below) |
| `comments` | `false` hides Disqus for this post |
| `weight` | Ordering tie-break among same-date posts |

Posts are page bundles: `content/post/my-post/index.md` plus local images as
page resources.

## Layout flags

- **`sidebar`** (default on) — `false` hides the sidebar and **auto-enables**
  the wide secondary footer unless `wideFooter: false`.
- **`fullWidth`** — widens the content column; only with the sidebar off.
- **`wideFooter`** — extra footer band; never shown together with the sidebar.

## Content features

From the theme's render hooks and `markup.toml` defaults:

- **Heading anchors** — hover `#` on `h2`–`h4`; TOC covers `h2`–`h4` (ordered).
- **GFM alerts** — `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`,
  `[!CAUTION]`; text after the type overrides the label. Labels follow the
  page language (`i18n` `alert.*`), with an English title-case fallback.
- **Blockquote classes** — `{.my-class}` on the line under a blockquote.
- **Task lists** and **footnotes** (goldmark).
- **Raw HTML** inline (`<abbr>`, `<sub>`, `<kbd>`, `<mark>`, `<ruby>`…).
- **Code fences** — line numbers, syntax guessing, options such as
  `linenos=false`, `linenostart=N`, `hl_lines=[2 4-6]`.

### Images

Every image (page resource or remote URL) becomes a `<figure>` with lightbox,
lazy loading, and automatic resizing (960px display, 1400px full).

The `title` attribute always feeds the lightbox. On-page captions are opt-in —
site-wide `images.showCaptions = true`, or per image:

```markdown
![alt](photo.jpg "Caption text")
{.caption}
```

Grids use the shortcode:

```html
{{< gallery cols="2" >}}
![alt](photo1.jpg)
![alt](photo2.jpg)
{{< /gallery >}}
```

### Shortcodes

| Shortcode | Usage |
| --------- | ----- |
| `quote` | `{{< quote author="…" source="…" url="…" >}}text{{< /quote >}}` |
| `video` | `{{< video src="file-or-url" >}}` — optional `poster`, `autoplay`, `muted` |
| `youtube` | `{{< youtube VIDEO_ID >}}` |
| `bilibili` | `{{< bilibili "BV…" >}}` (or `av…`; optional page number; autoplay off) |
| `tencent` | `{{< tencent VIDEO_ID >}}` |
| `gitlab` | `{{< gitlab SNIPPET_ID >}}` |
| `gallery` | `cols="2"` (default) or `cols="3"` |

Mermaid and math are not bundled — those fences render as plain code.

## Multilingual

- Content: `index.md` (default language) plus `index.<lang>.md` siblings.
- UI strings: theme `i18n/*.toml` (en, ja, pt-br, zh, zh-hant-tw). Add a file
  for a missing language; do not hardcode UI text in content.
- Language chrome in the site's `languages.toml`:

  ```toml
  [ja]
      label          = "日本語"
      weight         = 3
      hasCJKLanguage = true   # WordCount / ReadingTime for Japanese

      [ja.params]
          description = "…"
      [ja.params.author]
          bio = "…"
      [ja.params.footer]
          customText = "…"
  ```

## Menus

- `menu.toml` → `[[social]]` (footer) and `[[headerBar]]` (second chrome row,
  only when `params.headerBar.enabled = true`).
- Main nav → page front matter (`menu.main`), see *Required site setup*.

## Furigana (Furifont)

Furigana comes from the bundled Furifont variable fonts (IVS glyph variants),
served from `/fonts/furifont/`. No DOM `<rt>` injection for the built-in mode.

- Header toggle: Off / Hiragana / Romaji (stored in localStorage).
- Config: `params.furifont` — `enabled`, `default` (`off` \| `hiragana` \|
  `romaji`), and `schemes` (per color scheme: `sans` or `serif`).
- Automatic annotation covers article prose and selected chrome; `code` /
  `pre` / `kbd` and manual `<ruby>` are skipped.

## Color schemes

Built-in and selectable in the header (localStorage):

| Pref | Notes |
| ---- | ----- |
| `auto` | Follows system light/dark (always available; not listed in `schemes`) |
| `light` / `dark` | Core tokens in `assets/scss/_tokens.scss` |

Site-owned schemes (any other slug) live in the *site's* `assets/scss/` and
are imported from the site's `_custom-schemes.scss`. The theme's
`exampleSite/` demos two: `blogger` (full worked example) and `aurora`
(minimal tokens + icon).

### Adding a site-owned scheme

Use any short slug of your own (examples below use `aurora`). Copy
`exampleSite/assets/scss/_blogger.scss` as the full template, or
`_aurora.scss` for a minimal one.

1. **List it** in site `params.toml`:

   ```toml
   [colorScheme]
       default = "auto"
       schemes = ["light", "dark", "aurora"]
       darkish = ["dark"]    # backgrounds that should use Disqus dark chrome

   [fonts]
       url = "https://fonts.googleapis.com/css2?family=…&display=swap"
   ```

   `fonts.url` must include every family your scheme tokens use. The theme
   default covers Noto Sans JP + Source Serif 4 (enough for light/dark).

2. **SCSS** — copy the template to the site as `assets/scss/_aurora.scss`
   (rename the slug everywhere), then create site
   `assets/scss/_custom-schemes.scss` (overrides the theme's empty stub):

   ```scss
   @use "aurora";
   ```

   Define `[data-theme="aurora"]` tokens (same variables as `_tokens.scss`) plus
   any component overrides. These compile after base components, so they win.

3. **Optional** — `theme.aurora` in site `i18n/*.toml`, and
   `layouts/partials/scheme-icons/aurora.html` (`<svg class="icon-aurora">`)
   with a matching rule in the scheme file:
   `[data-theme-pref="aurora"] .theme-switcher .icon-aurora { display: block; }`.

## Comments

Disqus via `[services.disqus] shortname`. Per-post opt-out: `comments: false`.
Drafts never render comments.

## Search

The sidebar widget reads the search page's JSON output (`data-search-index` in
`head.html`). Indexed sections come from `mainSections`.

## Styling

SCSS is compiled with Dart Sass (`css.Sass` / `transpiler: "dartsass"`),
compressed and fingerprinted. Modules use `@use` in `assets/scss/main.scss`;
`custom-schemes` loads last so site schemes win. A missing `sass` binary
fails the build — see *Requirements*.

## License

Theme code: [MIT](LICENSE). Bundled third-party assets keep their own licenses
— see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md):

- **Fonts** (`static/fonts/furifont/*.woff2`) — [Furifont](https://github.com/antfu/furifont)
  by Anthony Fu, SIL OFL 1.1 (from Adobe Source Han Sans/Serif).
- **Furigana tables** (`*.ivs.json`, `okurigana.json`) — CC BY-SA 4.0; see
  `static/fonts/furifont/DATA-LICENSE.md`.

## Contributing

Theme internals (file map, config merge, Furifont pipeline, SCSS order) are in
[docs/INTERNALS.md](docs/INTERNALS.md).
