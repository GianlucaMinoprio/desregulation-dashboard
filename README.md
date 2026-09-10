# desregulacion.com

An independent citizen guide to Argentina’s deregulation process. The interface uses navy, gold, white, and green from the official report and explains measures in plain Argentine Spanish.

## Run locally

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

Open [the local dashboard](http://127.0.0.1:8766/). The website has no runtime libraries or package installation steps.

## Features

- A shorter homepage with the navy-and-gold crest, centered mobile introductions and primary actions, and a compact strip of articles reached, norms reached, and deregulation measures—in that order.
- “¿Qué cambia para vos?” covers December 2023–August 2026 with **21 plain-language explanations**, including **Producir, vender y emprender**. Three cards appear initially; each “Ver más cambios” adds six. Topics and accent-insensitive search remain visible; year and sorting are under “Más filtros”. Shared URLs with advanced filters open the disclosure automatically. Each card expands to its amber/green before-and-after comparison, affected audience, legal reference, and source.
- **33 exact monthly observations** for all three measures. Only the native slider, its keyboard controls, and previous/next buttons change the selected month. One stable readout shows the total and monthly difference. The July/August source discrepancy remains visible as an expandable note; the full table and downloads remain available.
- The sector chart shows the top five of eleven sectors, with an accessible expansion button, named labels, stable colors, proportional bars, and counts.
- **`/archivo/`** is the sole document browser, covering all **257 indexed publications**. Search and filter by topic, year, or document type; sort and paginate through ten results per page. Explained publications link back to their homepage cards. The hosted homepage does not load `data/archive.json` or the archive script.
- “¿Qué se viene?” shows pending legislation and the time-limited IGJ consultation. The IGJ card highlights its September 28, 2026 submission deadline, keeps the form link visible, and expands to show the requirements. The yellow “Vos también podés proponer un cambio” section contains the general regulation-report form and preparation guidance. “Participá” navigates directly to this area. The site does not submit forms or messages.
- “Fuentes y datos” consolidates metric definitions, official links, and JSON downloads. The site continues to identify itself as an independent citizen project.
- Independent error/retry states, visible focus, 44px controls, 16px form text, reduced motion, and a self-contained portable export covering both views.

The current crest and generation prompts are documented in `assets/emblem-design.md`. Source figures, archive coverage, and initiative status have not changed in this UI simplification.

The AI-assisted participation flow is available on both official-form cards under “Prepará tu propuesta con IA”. [`prompts/participacion.md`](prompts/participacion.md) is the source for the public conversation starters. It combines a common conversation prompt with the selected official channel's requirements. ChatGPT, Claude, and Grok links carry the full prompt using their web `q` routes; Grok now opens `grok.com`. The three buttons use the site’s rectangular navy outlines, with a consistent navy fill, white text, and gold logos on hover/focus/press. The AI disclosure uses a simple divider instead of an extra yellow panel. [Link research and color details](docs/ai-links.md) document the conventions and visual changes. Both cards provide manual copying if clipboard access or a provider's prefilled link is unavailable. No account credentials or personal data are collected by this website. The assistant first asks the visitor to describe a problem, then uses relevant memory when available, confirming remembered facts before including them in a submission. The IGJ form was checked directly on September 10, 2026: it concerns RG 15/2024 and requires an attached proposal document, rather than an email or a free-text proposal field. The participation record now links directly to that form; its disclosure retains the official call and recorded deadline.

## Coverage and source distinctions

The complete monthly series is available; **the archive is not the ministry's itemized inventory of all 770 deregulation norms**. The inspected public sources provide totals, a public news archive, and reports. A document can discuss multiple norms, and several documents can cover the same measure. Inclusion does not certify current legal validity or measured social benefits. This distinction appears in the interface and in the exported data.

- `data/august-2026.json`: report figures and original summaries, with the eight monthly editorial explanations under `lectura_ciudadana`.
- `data/citizen.json`: the broader collection of 21 explanations, with stable IDs, publication dates, topics, before/after text, and an official source for each. Where applicable, `archive_id` connects an explanation to an indexed publication. The data check prevents the eight monthly copies from drifting. This remains a selection of explained reforms, not a complete inventory of 770 individual norms.
- `data/upcoming.json`: proposal status, next step, participation instructions, official links, and the last review date. Review the Senate bill's current status and the IGJ channel before updating this date; the importer does not advance it automatically.
- `data/history.json`: exact values from the public spreadsheet referenced in [the ministry's charts](https://www.argentina.gob.ar/desregulacion), including source CSV URLs. No chart-image interpolation. The public spreadsheet and August PDF disagree on July 2026; `reconciliation` records the exact differences and the UI displays a note for each affected metric. The spreadsheet history and PDF summary retain their respective published values.
- `data/archive.json`: dated metadata and official source links, collected from all 15 pages of [the ministry news index](https://www.argentina.gob.ar/desregulacion/noticias), the [monthly report index](https://www.argentina.gob.ar/desregulacion/desregulacion-en-numeros), and curated references.
- `data/archive-foundations.json`: official DNU 70/2023 and Law 27.742 references, dated by publication in the Boletín Oficial.

Report entries use the edition's month, not an invented publication day. The combined December/January report retains its original title and is indexed under January 2026. News records preserve official titles and excerpts with attribution. The archive is a local snapshot, so visitor searches do not depend on government servers.

## Navigation and code organization

The homepage uses `tema`, `q`, `periodo`, and `ordenar` for explanation filters, plus `metrica` for the historical chart. The archive uses `tema`, `archivo`, `anio`, `tipo`, and `orden`. The combined “Producir, vender y emprender” topic uses `producir`; old `tema=emprender` links select this same group. Both editorial tags and archive topic matching include the former groups without duplicates. Its topics are editorial navigation tags, not the ministry's sector totals.

Legacy homepage `#archivo` links redirect to `/archivo/`, preserving archive filters. Legacy `vista=publicaciones` links translate `q`, `periodo`, and `ordenar` to the archive fields. Existing `#cambio-1` through `#cambio-8` and descriptive explanation fragments remain valid. `#metodologia` and `#fuente` reveal their disclosures. Browser Back restores the relevant route and URL filters.

`site.js` provides shared data reads, topic matching, downloads, and URL helpers. `history.js` owns only the monthly chart; `archive.js` owns only the document browser. `explorer.js` owns citizen explanations and upcoming initiatives. `navigation.js` handles legacy links, disclosure anchors, and portable view switching. `participation-ai.js` mounts the AI help, loads prompts only when expanded, and handles copying and provider links. `scripts/build_prompts.py` generates `data/participation-prompts.json` from the prompt Markdown; rebuild it after editing the source. [The live form review](docs/participation-forms.md) records exact labels, conditional questions, required fields, and upload limits for both channels. Prompts distinguish official requirements from suggested drafting structure, prepare separate copy-ready answers or an attachment, and identify missing information before declaring a draft ready. Hosted pages share the stylesheet and scripts using relative asset paths, so the homepage and archive work as static routes on Vercel.

## Refresh public source data

The planned fortnightly maintenance runs through the owner's Hermes agent cron. Use [the Hermes update prompt](prompts/hermes-fortnightly-update.md) every 14 days. It covers source discovery, monthly rollovers, citizen explanations, consultation deadlines, validation, and automatic publication of verified updates through Vercel. This repository does not create the Hermes schedule. The agent starts from production `main`, validates changes before pushing, and verifies the resulting deployment.

This optional maintenance script requires `curl` and Python's `beautifulsoup4`; neither is needed to serve the site.

```bash
python3 -m venv .venv
.venv/bin/pip install beautifulsoup4
.venv/bin/python scripts/refresh_sources.py
python3 scripts/check_data.py
python3 scripts/build_single.py
```

The importer discovers pagination and the publicly referenced spreadsheet, caches reads for the day in the system temporary directory, and writes after all sources pass its checks. It does not submit forms or send messages. Review updated data before publishing; add itemized norms only from traceable sources, and do not infer inventory completeness from aggregate counts.

## Portable version and checks

`index.single.html` embeds the homepage, the archive view extracted from `archivo/index.html`, shared CSS/JavaScript, brand images, all five datasets, and both AI prompts. `#archivo` switches to the archive locally; other section or explanation links switch back to the homepage. Search, filters, pagination, comparisons, and downloads work without a server or network. The optional Google font falls back to system fonts offline. Do not edit this generated file manually.

```bash
node --check app.js
node --check archive.js
node --check history.js
node --check site.js
node --check navigation.js
node --check explorer.js
node --check participation-ai.js
python3 scripts/build_prompts.py
python3 scripts/build_prompts.py --check
python3 scripts/check_data.py
python3 scripts/build_single.py
python3 scripts/build_single.py --check
```

Browser verification on September 10, 2026 covered 320, 390, 720, and 1440px layouts, 44px controls and 16px form inputs, all 99 month/metric values, slider-only selection, filters and resets, 26 archive pages, cross-page explanations, legacy redirects, browser Back, disclosure anchors, independent failure/retry recovery, and both portable views with the network disabled. With the IGJ deadline and AI help collapsed, at 390 × 844 the default homepage measures 6,063px tall (previously 15,310px), with the first explanation at approximately 1,200px (previously 1,883px). The two official form links remain available when the initiative data fails, and retry restores the proposal details. The deadline, AI prompt previews, copying fallback, and participation controls also work in the portable export offline; external AI services and forms require a connection. AI checks cover both distinct prompts, provider URL decoding, successful and denied clipboard access, logo hover/focus colors, reduced motion, lazy loading, retry recovery, 44px targets, and 16px readonly prompt fields. Signed-in provider conversations were not submitted during verification. The hosted homepage makes no archive-data request.

## Production hosting

Vercel's native GitHub integration connects this repository to the **desregulacion** project in **Gianlu's projects** (`gianlus-projects`). Pushes to `main` create production deployments; other branches create previews. The site is static HTML/CSS/JavaScript with no framework or server dependencies. Cloudflare manages DNS for the canonical domain, **desregulacion.com**. Both the root and `www` point to Vercel with DNS-only CNAME records. `vercel.json` permanently redirects `www` to the root domain, retaining paths and query parameters.

`.github/workflows/validate.yml` checks data, generated prompts, the portable export, and JavaScript syntax on pushes and pull requests. It replaces the unused GitHub Pages deployment. Vercel deployment and GitHub validation run independently, so run the checks locally before pushing production changes, then verify both statuses and the live homepage and `/archivo/`. No Vercel deployment token is needed in GitHub Actions.

## Color changes in `styles.css`

The requested sector differentiation replaces a mostly navy chart with restrained OKLCH hues. The previous fills were `var(--blue)` for Agroindustria and `var(--navy)` for all other sectors; the new `.sector-fill` reads `var(--sector-color)`. These are visual distinctions, not additional categories or ratings. Each new color is within sRGB and has at least 4.8:1 contrast against white; text retains the existing navy color.

| Sector | Previous fill | New `--sector-color` |
| --- | --- | --- |
| Agroindustria | `var(--blue)` | `oklch(0.54 0.11 145)` |
| Finanzas y Mercado de Capitales | `var(--navy)` | `oklch(0.54 0.12 255)` |
| Comercio Exterior | `var(--navy)` | `oklch(0.54 0.085 190)` |
| Transporte | `var(--navy)` | `oklch(0.54 0.105 70)` |
| Producción Nacional | `var(--navy)` | `oklch(0.54 0.12 35)` |
| Bienestar Ciudadano | `var(--navy)` | `oklch(0.54 0.095 220)` |
| Salud | `var(--navy)` | `oklch(0.54 0.12 345)` |
| Energía | `var(--navy)` | `oklch(0.54 0.1 90)` |
| Cultura, Turismo y Deporte | `var(--navy)` | `oklch(0.54 0.12 295)` |
| Empleo y Regulación Laboral | `var(--navy)` | `oklch(0.54 0.085 265)` |
| Sector Inmobiliario | `var(--navy)` | `oklch(0.54 0.08 125)` |

`.sector-track` changes from `#e8e9ed` to `color-mix(in oklch, var(--sector-color) 12%, var(--paper))`; `.sector-n` gains the same tinted background. This connects each bar and count without relying on color alone. New chart readouts and source-icon containers reuse the existing navy, white, gold, blue, and light-green tokens. The shared source-icon style replaces the previous mix of one gold circle and two unframed white glyphs.
