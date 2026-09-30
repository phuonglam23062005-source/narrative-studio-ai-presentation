# Tool connection registry

| Tool | Verified in this session | Free-safe path | Next adapter boundary |
|---|---|---|---|
| Microsoft Designer | No direct connector | Manual visual exploration from exported brief | `visual-exploration` handoff |
| Figma | Connector present, OAuth required | Keep local JSON + copy visual spec | `figma` design handoff |
| Lovable | No callable connector | Paste the implementation brief into the browser workflow | `web-builder` handoff |
| v0 | No callable connector | Paste the component contract into the browser workflow | `ui-generation` handoff |
| Make | No callable connector | Use the documented event contract/webhook boundary | `automation` adapter |
| Zapier | No callable connector | Use the same event contract when an account is connected | `automation` adapter |

The app intentionally displays these states instead of claiming that an OAuth account, webhook, deployment, or paid feature is active.
