# launching-gcr-json-load

The July 2026 continuation of the Gulf Coast Radar launch site, adding a structured data layer: the same static pages and API server as [`launching-GCR`](https://github.com/CultureReset/launching-GCR), plus SQL migrations and a data-structure guide.

Superseded by [`gcr-unified`](https://github.com/CultureReset/gcr-unified) and [`gcr-api-clean`](https://github.com/CultureReset/gcr-api-clean). Nothing runs from it.

## What it adds

- **SQL migrations** for the shared database, logged one per change; the last ones add payment-tracking columns to bookings.
- **`DATA_STRUCTURE_GUIDE.md`:** how listings, sections and items are organized.
- The same pages, `api-server.cjs`, audit scripts and data-mapping notes as `launching-GCR`.

The `claude/data-structure-impl-sg0g6w` branch holds the data-structure implementation work.
