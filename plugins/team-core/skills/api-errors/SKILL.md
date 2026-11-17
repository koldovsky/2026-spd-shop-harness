---
name: api-errors
description: The Shop API error format (RFC 9457 problem details, status codes). Use when adding or changing an HTTP endpoint or error handling in any Shop service.
---
<!-- owner: @koldovsky · why: three services had drifted copies of this rule · review-by: 2027-02-19 -->
# API errors — one format for every Shop service

- Body: RFC 9457 problem details — `type`, `title`, `status`, `detail`; content type `application/problem+json`.
- 400 malformed request · 404 not found · 409 conflict with current state · 422 business rule violation.
- Never a 500 for validation; never a stack trace in `detail`.
- Every error path has a test that asserts the status and `detail`.
