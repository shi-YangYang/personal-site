---
name: web-interface-guidelines
description: Vercel's Web Interface Guidelines for reviewing or building accessible, fast, delightful web UI. Use when auditing pages or components for accessibility, focus, forms, animation, typography, layout, content, or interaction quality, or when implementing frontend details to spec.
---

# Web Interface Guidelines

Source: [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines), commit `434b7f91364665f2f733b310ec54809bf8f37937`.

Use this skill for two jobs:

- **Review**: read `references/review-checklist.md`, inspect the target files (or the current diff), and report concrete violations.
- **Build or fix**: read `references/guidelines.md` and apply its MUST / SHOULD / NEVER rules while writing UI code.

`references/guidelines.md` is the concise rule set. `references/full-guidelines.md` is the long-form version with rationale and examples; read it when a rule is ambiguous or you need the reasoning.

## Review output

Group findings by severity. For each finding, give the file and line, the rule violated, why it matters, and the concrete fix. Prefer specific, actionable findings over a generic checklist. Do not invent violations: verify against the actual code.
