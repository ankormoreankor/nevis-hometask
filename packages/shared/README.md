# @nevis/shared

Zod contract for the dashboard: the four source schemas, their types and a `TreeNode` union. The API validates what it sends and the web client parses what it receives, so the types cannot drift.

```ts
import { companySchema, type TreeNode } from "@nevis/shared";
```
