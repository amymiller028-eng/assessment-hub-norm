# Research, Methodology & Validation

Static page for the TalentSmartEQ Research, Methodology, and Validation section. Covers how the
Emotional Intelligence Appraisal® was developed and the evidence for its reliability, validity, and
relationship to workplace performance.

Includes an interactive score explorer: enter an overall EQ score and see where it sits in the
current test-taker population.

## Files

```
index.html              the page
styles.css              all styling
eq-distribution.js      the score distribution data
score-explorer.js       the interactive chart
.nojekyll               tells GitHub Pages to serve files as-is
```

All files sit at the repository root. GitHub's drag-and-drop uploader flattens folders, so a
flat layout avoids broken asset paths.

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

Everything the chart needs lives in `eq-distribution.js`:

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

Current comparison group: **720,271 Self Edition administrations, 2021–2026, book and online pooled.**
That window sits entirely after the platform migration, so every record uses the same scoring.

Built from the August 2026 full extract (`Survey1and1010.zip`, six CSVs, 2.1M rows). Selection rules:

- `RaterLevel = Self` only. Re-assessments are excluded — people retaking after training average
  about 5 points higher and would inflate the comparison group.
- Both delivery channels pooled: SurveyId 1010 (book codes) and SurveyId 1 (online). Same
  instrument, two channels.
- 2021 onward, which is where the demographic fields begin and which sits after the migration.
- All 28 items present and in range.

Regenerate with `rebuild_eq_distribution.py`.

## Two open items before publishing

**Reliability figures.** The reliability section cites the technical manual: .895 for self-awareness
and .967 for relationship management. Analysis of 2022–2026 platform data produces .614 and .810
respectively, with overall EQ at .908. The subscale figures should be attributed to the manual's
sample and date, or reconciled, before this page goes live.

**~~The 75 versus 76.9 tension.~~ RESOLVED — it was not drift, it was channel selection.** The old
comparison group used the online channel only, whose mean is 76.9, which pushed 75 down to the 41st
percentile. The online channel runs about 2.9 points above the book channel in every year measured
(SD of the gap 0.57), because it is largely corporate client populations. Pooling both channels, as
the comparison group now does, puts the mean at 74.4 and the **median at exactly 75.0 — so 75 sits
at the 51st percentile**, which is what the documentation always claimed. No wording change needed.

**The seniority and job-function sentences contradict the current data.** The Norms and scoring
section, citing the technical manual, says *"EQ scores declined among director-level and more senior
titles"* and that *"sales, finance, and information-technology roles did not differ significantly."*
Regression on the 2021–2026 data (n = 642,885 complete cases, all eight demographics plus channel
and year entered together) shows the opposite on both counts:

| Claim on the page | 2021–2026 data |
| --- | --- |
| Scores decline at director level and above | Rise monotonically: Director +1.72, VP +2.16, SVP +2.41, C-level +2.63 vs Employee −1.28 |
| Sales does not differ significantly | Sales **+1.23**, significantly higher |
| R&D among the highest | R&D **−1.08**, significantly lower |
| Business development among the highest | Not a category in the current Job Function codebook |

These are attributed to the manual, so they are a citation rather than an error in the page — but a
reader who checks them against current data will find they no longer hold. Either date and attribute
them explicitly ("the 2003 manual's sample reported…") or replace them with the current figures.
**Decide this before the page goes public.** Source: `EQ-Norm-2026.xlsx`, `adjusted` sheet.

**Reliability figures** — unchanged from before, see above.

## Accessibility and browser support

Semantic headings, a labelled numeric input, live-region readout for screen readers, visible focus
states, and `prefers-reduced-motion` support. The chart works with mouse, touch, and keyboard entry.
Tested in Chrome; no browser-specific APIs are used.
