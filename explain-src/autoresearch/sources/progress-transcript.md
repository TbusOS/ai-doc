# progress.png — text transcribed from the figure

Transcribed by hand from `progress.png` (karpathy/autoresearch e6d79c1) on 2026-10-09,
so that explainer claims about the figure can be checked like any other quote.
Labels are copied exactly as drawn, including the one that matplotlib truncated (`...`).
The figure is produced by `analysis.ipynb` (kept experiments are labelled with their
`description` column, cut to 45 characters).

Title: Autoresearch Progress: 83 Experiments, 15 Kept Improvements

Axis: Experiment # (x) · Validation BPB (lower is better) (y)

Legend: Discarded · Kept · Running best

Kept labels, in order:

1. baseline
2. halve total batch 524K→262K (more steps)
3. warmdown 0.5→0.7 (more cooldown helps)
4. add 5% warmup
5. depth 9 aspect_ratio 57 (same dim 512 + ex...
6. x0_lambda init 0.1→0.05
7. unembedding LR 0.004→0.008
8. SSSSL window pattern (more sliding window)
9. short window 1/4 context instead of 1/2
10. short window 1/8 context (256 tokens)
11. embedding LR 0.6→0.8
12. RoPE base frequency 10000→50000
13. RoPE base frequency 50000→100000
14. RoPE base frequency 100000→200000
15. random seed 42→137
