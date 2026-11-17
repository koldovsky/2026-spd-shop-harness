---
name: kotlin-conventions
description: Shop conventions for Kotlin + Spring Boot code (layers, money, errors, tests). Use when writing or reviewing Kotlin in a Shop service.
---
<!-- owner: @koldovsky · review-by: 2027-02-19 -->
# Kotlin service conventions

- Layers: `domain/` (no Spring Web, no JPA) · `persistence/` adapters return domain types · `api/` controllers + DTOs.
- Money: `Long` cents; never `Double`; prices come only from shop-pricing.
- Tests: domain without Spring; MockMvc for HTTP; `@DataJpaTest` for queries.
- Flyway: new `V<n>__<what>.sql`; never edit an applied one.
