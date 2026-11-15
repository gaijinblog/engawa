# Engawa internals

How the theme works under the hood. For install, configuration, and feature
usage, see the [README](../README.md). Default keys are commented in
[`config/_default/params.toml`](../config/_default/params.toml) and
[`markup.toml`](../config/_default/markup.toml).

## File map

```
layouts/_markup/        Render hooks: headings (h2–h4 anchors), blockquote
                        (GFM alerts via i18n `alert.*`, custom classes), image
layouts/_shortcodes/    gallery, quote, video, youtube, bilibili, tencent, gitlab
layouts/_partials/      Header, sidebar, footer, meta, TOC, comments, search,
                        theme/size/furigana/lang switchers, scheme-icons/
assets/scss/            Tokens (_tokens.scss), components, _custom-schemes.scss
                        (empty stub — site overrides with its own @use list;
                        see exampleSite for blogger / aurora demos)
assets/js/              main (theme/size), furifont, lightbox, search
i18n/                   UI strings: en, ja, pt-br, zh, zh-hant-tw
config/_default/        params.toml + markup.toml (theme defaults)
static/fonts/furifont/  Furifont VF woff2 + IVS tables — served at /fonts/furifont/
```

## Config merge

Theme `config/_default/` merges into the site under Hugo's usual rules:

- **`markup` is opt-in.** Default merge strategy for `markup` is `none`. The
  site must set `[markup] _merge = 'deep'` in `hugo.toml` for the theme's
  markup file to apply. Site-side markup keys always win.
- Other site config (`params`, `hugo`, languages, menus) overrides theme
  defaults for the same keys.

## Layout flags (`baseof.html`)

| Front matter | Behavior |
| ------------ | -------- |
| `sidebar` | Default on. `false` hides the aside and **enables** the wide secondary footer unless `wideFooter: false`. |
| `fullWidth` | Widens the content column; only with sidebar off. |
| `wideFooter` | Extra footer band (`footer-secondary.html`); never with sidebar. |

Meta panel, TOC, summary lead, post nav, and comments render only for
`type: "post"`. Comments skip drafts; on localhost a placeholder replaces the
Disqus embed.

## Furigana (Furifont) pipeline

Furigana is drawn by the **font** (IVS glyph variants), not DOM `<rt>`:

1. **Config** — `params.furifont`: `enabled`, `default` mode
   (`off` / `hiragana` / `romaji`), `schemes` (color scheme → `sans` \| `serif`).
2. **Pre-paint** — `head.html` sets `data-furigana`, `data-furifont-family`,
   `data-furifont-schemes`, and `data-furifont-base` on `<html>` (localStorage
   key `engawa-furigana`).
3. **Runtime** — `assets/js/furifont.js` loads `okurigana.json` and the
   family/mode IVS table from `/fonts/furifont/`, walks text nodes, and wraps
   kanji runs in `<span data-furifont-reading data-furifont-salt>`. A
   MutationObserver re-annotates dynamic content.
4. **Theme switch** — `main.js` calls `window.engawaFurifont.syncFamily()` so
   the face follows the resolved scheme.

Important constants in `furifont.js` / `_furifont.scss`:

- **`SCOPE` / `$furigana-scopes`** — containers that get annotated (must stay
  in sync with each other).
- **`SKIP`** — exclusions: `code` / `pre` / `kbd`, manual `ruby`, meta block,
  TOC, counters, existing `[data-furifont-reading]`.

## Styling pipeline

`head.html` compiles `assets/scss/main.scss` with `css.Sass`
(`transpiler: "dartsass"`, compressed, fingerprinted, integrity). Modules use
`@use` (no `@import`). Near the end: `furifont`, `separators`, then
`custom-schemes` (so site scheme overrides win over base components).
Missing `sass` on `PATH` fails the build.

## Color schemes

| Layer | What |
| ----- | ---- |
| Core | `auto` (system), `light`, `dark` — tokens in `_tokens.scss` (`:root` / `[data-theme="dark"]`) |
| Site-owned | Any other slug — site `assets/scss/_*.scss` imported from site `_custom-schemes.scss`. Worked examples in `exampleSite/`: `blogger` (full) and `aurora` (minimal) |

**Params**

- `colorScheme.schemes` — selectable names (`auto` is always offered in the
  UI). Feeds the FOUC script's allow-list + `data-theme-prefs` (comma list),
  `main.js` validation, and `theme-toggle.html` buttons.
- `colorScheme.darkish` — schemes with dark page backgrounds →
  `data-theme-darkish` for Disqus light/dark chrome alignment.
- `colorScheme.default` / `toggle` — initial pref and whether the switcher
  renders.
- `fonts.url` — Google Fonts css2 URL; empty uses the theme default (Noto Sans
  JP + Source Serif 4).
- `furifont.schemes` — map each color scheme to Furifont `sans` or `serif`.

**Switcher chrome**

- Labels: i18n `theme.<name>` (fallback: humanized slug).
- Icons: built-in SVGs for auto / light / dark; other schemes use
  `partials/scheme-icons/<name>.html` plus
  `[data-theme-pref="<name>"] .theme-switcher .icon-<name> { display: block; }`
  in the scheme SCSS.

**Scheme file shape** — see `exampleSite/assets/scss/_blogger.scss`: tokens,
separators, surface / content-panel rules when `--color-bg` differs from the
reading surface, light component accents, switcher icon rule. Minimal variant:
`exampleSite/assets/scss/_aurora.scss`.
