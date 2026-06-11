# Performance baseline · post

Lighthouse ×3 averaged, headless Chrome, local preview (:4321). INP is field-only; TBT is the lab proxy.

| route | perf | a11y | LCP ms | CLS | TBT ms | TTFB ms | SI ms |
|---|---|---|---|---|---|---|---|
| / | 66 | 93 | 8513 | 0.000 | 0 | 9 | 4703 |
| /instrument/ | 82 | 93 | 4216 | 0.000 | 0 | 7 | 2537 |
| /case-studies/cg-oncology/ | 90 | 96 | 3410 | 0.018 | 0 | 7 | 1910 |
