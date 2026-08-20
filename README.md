# Research, Methodology & Validation

Static page for the TalentSmartEQ Research, Methodology, and Validation section. Covers how the
Emotional Intelligence Appraisal® was developed and the evidence for its reliability, validity, and
relationship to workplace performance.

Includes an interactive score explorer: enter an overall EQ score and see where it sits in the
current test-taker population.

## Files

```
index.html                  the page
css/styles.css              all styling
js/eq-distribution.js       the score distribution data
js/score-explorer.js        the interactive chart
.nojekyll                   tells GitHub Pages to serve files as-is
```

No build step, no dependencies, no external requests. Everything is plain HTML, CSS, and vanilla JS.

## Preview locally

Open `index.html` in a browser. Nothing is fetched over the network, so `file://` works.

To serve it over HTTP instead:

```
python -m http.server 8000
```

then open <http://localhost:8000>.

## Deploy on GitHub Pages

Push the folder to a repository, then in **Settings → Pages** set the source to the branch and
folder containing `index.html`.

To publish it under an existing site, copy this folder into that repository — for example as
`/validation` — and it will serve at `yourdomain.com/validation/`.

## Updating the score data

Everything the chart needs lives in `js/eq-distribution.js`:

| Field | Meaning |
| --- | --- |
| `n` | number of administrations in the comparison group |
| `min` / `max` | raw total score bounds (28 items scored 1–6) |
| `m` / `s` | raw mean and SD of the norm baseline |
| `counts` | number of people at each raw total, from `min` to `max` |

Scores are converted with the documented formula `score = 75 + 10 × (raw − m) / s`, which produces
a mean of 75 and a standard deviation of 10 on the norm baseline.

Replacing `counts`, `n`, and the anchor values is all that is needed when the comparison group
changes. No other file needs editing.

Current comparison group: **139,734 Self Edition administrations, 2022–2026.** That window sits
entirely after the January 2021 platform migration, so every record uses the same scoring.

## Two open items before publishing

**Reliability figures.** The reliability section cites the technical manual: .895 for self-awareness
and .967 for relationship management. Analysis of 2022–2026 platform data produces .614 and .810
respectively, with overall EQ at .908. The subscale figures should be attributed to the manual's
sample and date, or reconciled, before this page goes live.

**The 75 versus 76.9 tension.** The page states that 75 is the normative average. The explorer shows
that 75 now sits at roughly the 41st percentile, because the population mean in 2022–2026 data is
76.9. Both statements are accurate, and the gap is the norm drift. Consider adding a sentence in the
Norms and scoring section acknowledging it rather than leaving readers to notice the discrepancy.

## Accessibility and browser support

Semantic headings, a labelled numeric input, live-region readout for screen readers, visible focus
states, and `prefers-reduced-motion` support. The chart works with mouse, touch, and keyboard entry.
Tested in Chrome; no browser-specific APIs are used.
