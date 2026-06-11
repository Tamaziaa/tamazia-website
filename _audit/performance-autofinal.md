# Performance baseline · autofinal

Lighthouse ×3 averaged, headless Chrome, local preview (:4321). INP is field-only; TBT is the lab proxy.

| route | perf | a11y | LCP ms | CLS | TBT ms | TTFB ms | SI ms |
|---|---|---|---|---|---|---|---|
| / | 71 | 90 | 5930 | 0.017 | 10 | 13 | 3472 |
| /instrument/ | 83 | 96 | 4210 | 0.000 | 0 | 4 | 2510 |
| /case-studies/cg-oncology/ | 90 | 96 | 3461 | 0.018 | 0 | 5 | 1886 |
