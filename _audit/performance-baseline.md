# Performance baseline · baseline

Lighthouse ×3 averaged, headless Chrome, local preview (:4321). INP is field-only; TBT is the lab proxy.

| route | perf | a11y | LCP ms | CLS | TBT ms | TTFB ms | SI ms |
|---|---|---|---|---|---|---|---|
| / | 61 | 93 | 6686 | 0.055 | 275 | 32 | 4191 |
| /instrument/ | 78 | 96 | 5176 | 0.000 | 20 | 7 | 2396 |
| /case-studies/cg-oncology/ | 87 | 96 | 3823 | 0.018 | 26 | 9 | 1918 |
