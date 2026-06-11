# Performance baseline · post2

Lighthouse ×3 averaged, headless Chrome, local preview (:4321). INP is field-only; TBT is the lab proxy.

| route | perf | a11y | LCP ms | CLS | TBT ms | TTFB ms | SI ms |
|---|---|---|---|---|---|---|---|
| / | 66 | 93 | 8624 | 0.000 | 17 | 9 | 4808 |
| /instrument/ | 83 | 93 | 4142 | 0.000 | 0 | 12 | 2513 |
| /case-studies/cg-oncology/ | 91 | 96 | 3260 | 0.018 | 0 | 9 | 1885 |
