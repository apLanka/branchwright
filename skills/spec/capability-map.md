# Capability map (Tier 3)

Use when one request bundles several capabilities that can ship and be verified separately: distinct consumers or data (identity, billing, notifications), acceptance criteria that cluster into independent groups, a part that could be cut without rewriting the rest. A single capability skips this.

Write a small, reviewable map, a module table and a build order, not a project plan:

```markdown
# Capability map: <initiative>

| Module id | Responsibility | Depends on |
|---|---|---|
| identity | Accounts, sessions, SSO | none |
| billing | Plans, invoices, payments | identity |
| notifications | Email and webhook fan-out | identity |
| reporting | Usage dashboards | billing, notifications |

Build order: identity, then billing and notifications, then reporting
```

Rules:

- **Stable ids.** Kebab-case, chosen once, never renamed mid-initiative; specs, tickets and branches name modules by id.
- **One direction.** Dependencies point one way. Two modules that need each other are one module.
- **Contracts at the boundary.** The map records that billing depends on identity; the contract between them goes in the provider's spec.
- **Show it with the first spec.** The user approves the map (boundaries, dependency direction, build order) together with the first module's spec. Getting boundaries wrong is expensive; reviewing ten lines is not.
- **Then one spec per module** in dependency order, each with its own issue, success criteria and seams; `to-tickets` turns each spec into tickets.
- Save the approved map as a comment on the parent issue, or as its body when the user wants a parent issue.
