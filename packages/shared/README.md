# @nevis/shared

Zod contract for the dashboard: the source payload schemas, the node summary, and the two response shapes. The API validates what it sends and the web client parses what it receives, so the types cannot drift.

```ts
import { companySchema, nodeSummarySchema } from "@nevis/shared";
```
