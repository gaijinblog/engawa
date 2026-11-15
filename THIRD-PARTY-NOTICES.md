# Third-party notices

The MIT license in [`LICENSE`](LICENSE) covers the Engawa theme's own code
(layouts, SCSS, JS, configuration). The theme bundles third-party assets that
keep their own licenses and are **not** relicensed by the theme's MIT license.
This file credits them; the individual license texts ship next to the assets.

## Furifont (bundled fonts and furigana data)

Everything under `static/fonts/furifont/` comes from
[Furifont](https://github.com/antfu/furifont) by [Anthony Fu](https://github.com/antfu)
— "A Japanese font that shows furigana by itself." Furifont itself is derived
from [Source Han Sans / Source Han Serif](https://github.com/adobe-fonts/source-han-sans)
by Adobe. The theme bundles the variable WOFF2 fonts (Hiragana and Romaji,
Sans and Serif) plus the IVS variant tables (`*.ivs.json`) and the okurigana
reading table (`okurigana.json`), unmodified.

- **Fonts (`*.woff2`):** [SIL Open Font License 1.1](https://openfontlicense.org/)
  — see `static/fonts/furifont/OFL.txt` (carried over verbatim from Furifont,
  whose own `OFL.txt` is the upstream Adobe/Source Han license text, with
  Reserved Font Name "Source"). The fonts remain under the OFL; the MIT license
  of this theme does not apply to them. Per OFL terms they may be bundled and
  redistributed with software (as here) but not sold by themselves.
- **Furigana data (`*.ivs.json`, `okurigana.json`):**
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — see
  `static/fonts/furifont/DATA-LICENSE.md` for the full source list. The data is
  redistributed unmodified, so no share-alike adaptation is triggered by this
  bundling; the attribution above is provided as its notice.

Furifont's code and dictionary sources were compiled by the Furifont project
from: JMdict, JMnedict and KANJIDIC2 (EDRDG), JmdictFurigana (Doublevil),
yomitan-jlpt-vocab (stephenmk / Jonathan Waller's JLPT lists), Tatoeba
(CC BY 2.0 FR), Desktop Tetsu's JR station list, and Japan Post's postal code
data — all detailed in `DATA-LICENSE.md`.
