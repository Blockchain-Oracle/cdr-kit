# create-cdr-kit-app

Scaffold a runnable **cdr-kit** starter in seconds — mock mode, so it runs with no wallet or chain.

```bash
npm create cdr-kit-app my-app
# or: npx create-cdr-kit-app my-app
cd my-app && pnpm install && pnpm start
```

The starter runs the full CDR flow against `createMockCdrKit()` (create → threshold-decrypt read with progress). Swap in `createCdrKitClient({ privateKey, apiUrl })` + the flow helpers from [`@cdr-kit/core`](../core) to go live on Aeneid.
