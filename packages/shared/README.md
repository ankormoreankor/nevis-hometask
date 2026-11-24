# @nevis/shared

Zod contract for the dashboard: the four source schemas, their types and a `TreeNode` union. The API validates what it sends and the web client parses what it receives, so the types cannot drift. The package also exports `isFiscalYear`, the shared predicate for fiscal years (four digits starting with 1 or 2, so 1000 to 2999).

```ts
import { companySchema, isFiscalYear, type TreeNode } from "@nevis/shared";
```

The mock payload the brief gave sits next to it, on its own entry point, so the API serves it and the web tests read the same tree instead of keeping a second copy:

```ts
import { payload2024 } from "@nevis/shared/payload";
```
