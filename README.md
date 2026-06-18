# wx

Service-aware git workflow for managing multiple projects in a single repo.

`wx` groups your working-tree changes by service, helps you create scoped
conventional commits, and wraps common branch/sync/rebase/PR flows.

## Install

Requires [Bun](https://bun.com).

```bash
bun add -g wx
```

## Configure

Create a `wx.json` at the root of your repo describing your services:

```json
{
  "services": [
    "api",
    { "name": "web", "paths": ["apps/web", "packages/ui"] }
  ],
  "protectedBranches": ["main", "staging"]
}
```

Paths are matched against changed files to attribute them to a service. The
built-in `root` service catches anything not covered by a registered path.

## Usage

```bash
wx status              # changes grouped by service
wx service list        # show registered services
wx commit api -m "..." # scoped conventional commit
wx affected --base main
wx pr                  # open/create a PR for the current branch
wx help                # full command list
```

## Develop

```bash
bun install
bun run src/index.ts help   # or: bun start help
bun run typecheck
```
