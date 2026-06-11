# Performance baseline · dedup

Lighthouse ×3 averaged, headless Chrome, local preview (:4321). INP is field-only; TBT is the lab proxy.

| route | perf | a11y | LCP ms | CLS | TBT ms | TTFB ms | SI ms |
|---|---|---|---|---|---|---|---|
| / | 74 | 93 | 5979 | 0.000 | 4 | 9 | 2718 |
| /instrument/ | 82 | 96 | 4287 | 0.000 | 0 | 5 | 2536 |
| /case-studies/cg-oncology/ | 90 | 96 | 3462 | 0.018 | 0 | 6 | 1937 |
