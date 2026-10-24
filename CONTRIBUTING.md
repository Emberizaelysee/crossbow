# Contributing to Crossbow

Thanks for your interest! Crossbow is at an early stage (see the [roadmap](docs/roadmap.md)), so ideas and reviews of the design docs are as welcome as code.

## Before you start

1. Read the [vision](docs/vision.md). Its principles settle most design questions: private by default, user in control, light by design, browsing first, honest about limits, replaceable parts.
2. Look for an existing issue, or open one with the templates. For anything larger than a bug fix, agree on the approach in the issue first.
3. If your change alters a decision recorded in an [ADR](docs/adr/), propose a new ADR in the same PR.

## The rules that matter most

- **New features are modules.** Put them in `src/modules/<id>/` with a manifest ([ADR-0002](docs/adr/0002-modular-feature-system.md)). Something belongs in core only if it can't sensibly be switched off. Say why in the PR.
- **Modules talk only through `ctx`.** No imports from `src/core` internals or from other modules. Only `src/engine/electron/` may import `electron`. Lint enforces both.
- **Stay within budget.** The benchmark in CI checks memory, disk and start-up budgets ([requirements](docs/requirements.md#non-functional-requirements)). A PR that breaks one needs an ADR.
- **No new network requests** unless they're listed in [privacy.md](docs/privacy.md) with a switch. CI records every request Crossbow makes.
- **Few dependencies.** Every new runtime dependency needs a reason, its size, and its licence (MPL-2.0 compatible) in the PR description.

## Workflow

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `spike/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat(workspaces): send tab to workspace`.
- Open a PR with the template, link the issue, and reference requirement IDs (`FR-30`) and ADRs.
- `main` is protected. PRs are merged after review and green CI.

## Development setup

Comes with M1 (the project scaffold issue). It will be `pnpm install`, then `pnpm dev`.

## Licence

By contributing you agree that your contribution is licensed under the [MPL-2.0](LICENSE), like the rest of Crossbow.
