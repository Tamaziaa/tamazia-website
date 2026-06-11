# Performance baseline · inline

Lighthouse ×3 averaged, headless Chrome, local preview (:4321). INP is field-only; TBT is the lab proxy.

| route | perf | a11y | LCP ms | CLS | TBT ms | TTFB ms | SI ms |
|---|---|---|---|---|---|---|---|
| / | 70 | 90 | 5590 | 0.017 | 9 | 11 | 3887 |
| /instrument/ | 82 | 96 | 4308 | 0.000 | 0 | 9 | 2410 |
| /case-studies/cg-oncology/ | 89 | 96 | 3562 | 0.018 | 0 | 6 | 1808 |
