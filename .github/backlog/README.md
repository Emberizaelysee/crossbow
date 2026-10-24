# Backlog

The first backlog is stored here as data and created on GitHub with [`seed_github.py`](seed_github.py). Once it's seeded, **GitHub Issues are the source of truth**. These files are only the starting point.

| File | Content |
|---|---|
| [`labels.json`](labels.json) | Type, area, priority and status labels |
| [`milestones.json`](milestones.json) | M0 to M4 (no due dates yet) |
| [`issues.json`](issues.json) | Spikes and features, with acceptance criteria and requirement IDs |

```bash
python3 .github/backlog/seed_github.py --repo Emberizaelysee/crossbow          # dry run
python3 .github/backlog/seed_github.py --repo Emberizaelysee/crossbow --apply  # create
```

Re-running is safe: labels are updated, and existing milestones and issues (matched by title) are skipped. The milestone contents are described in [docs/roadmap.md](../../docs/roadmap.md).
