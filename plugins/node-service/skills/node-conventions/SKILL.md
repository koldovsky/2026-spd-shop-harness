---
name: node-conventions
description: Shop conventions for TypeScript/Express services (validation, money, tests). Use when writing or reviewing TypeScript in a Shop Node service.
---
<!-- owner: @koldovsky · review-by: 2027-02-19 -->
# Node service conventions

- Validate every request body at the edge; the domain gets typed values.
- Money: integer cents in the API; decimal arithmetic inside; round once, half-even, at the end (ADR-007).
- Tests: `node --test` or vitest; one test per rule incl. the boundary.
