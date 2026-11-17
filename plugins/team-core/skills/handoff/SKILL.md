---
name: handoff
description: Write or read a handoff note so another session or person can continue a task. Use at the end of a work session, when stopping halfway, or when asked to continue from the latest handoff.
---
<!-- owner: @koldovsky · why: half-done cross-repo work was lost between sessions · review-by: 2027-02-19 -->
# Handoff

Notes live in the workspace repo: `handoffs/<YYYY-MM-DD>-<TICKET>.md`, one note per task, newest wins.

## Writing (end of a session)
Fill every section; keep it under 25 lines:
- **Goal** — one sentence, what "done" means.
- **State** — per repo: done (with PR links), in progress (branch), not started.
- **Decisions** — decision and reason, link the ADR.
- **Next step** — the single next action, concrete enough to start without questions.
- **How to verify** — commands and what green looks like.
- **Links** — ticket, PRs, contracts.
Then list the file path you wrote.

## Reading ("continue from the latest handoff")
1. Open the newest file in `handoffs/` for the ticket.
2. Re-run "How to verify" to confirm the state is still true; say what differs.
3. Start with "Next step". Do not redo finished work.
