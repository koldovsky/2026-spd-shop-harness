---
name: web-conventions
description: Shop conventions for the Next.js app and its BFF routes. Use when writing or reviewing code in shop-web.
---
<!-- owner: @koldovsky · review-by: 2027-02-19 -->
# Web conventions

- The UI never computes prices; it renders what the BFF returns from shop-pricing.
- BFF routes live in `app/api/`; they call services by URL from env, never hard-coded hosts.
- Show money with `Intl.NumberFormat` from integer cents.
