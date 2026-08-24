# CLAUDE.md

This repository's agent guidance lives in **`AGENTS.md`** — read it before working here.

`AGENTS.md` covers: project overview, installation, how to add a new mod, architecture (load order, shared modules, CustomEvent pattern), development gotchas (CSS/JS, fiber access to React internals), debugging, and reference resources. Both files are tracked in git.

Local tooling not tracked in git: `dev-install.sh` (headless single-mod deploy; edit `VIVALDI_WIN` inside it) and the `vivaldi-browser` skill under `.claude/skills/` (live read/write of Vivaldi prefs, shortcuts, tabs, console capture).
