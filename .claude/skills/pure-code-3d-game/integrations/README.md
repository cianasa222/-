# GameKit integrated skills
- fast-anything: upstream official SKILL.md and MIT license mirrored; blob 7162f523bac56af45630d72aaf1ad97c381f2222. Optional native CLI/MCP, not executed at publish.
- raea-gamekit: original GameKit adapter, with official raea-skills install path (Apache-2.0 repo). Full upstream plugin, hooks, and executable are not bundled or installed on a host by this release; install separately if supported. Upstream core SKILL blob 7239c776d7a94595fee8b1760e2345ac99b7841c.
- game-ui-research: original GameKit skill; Game UI Database is a website, not an installable SDK. No screenshots mirrored.
- Cold Smoke remains existing algorithm reference; no asset imports or new mandatory runtime dependencies.
All three workflows accessible via main SKILL.md and single-get bundle even without GitHub. For standalone Claude Code install, copy each folder under integrations/ containing SKILL.md to .claude/skills/ or ~/.claude/skills/ alongside pure-code-3d-game. Do not duplicate global and project hooks. Agent must follow GameKit code-only rules ahead of external skill defaults.
