import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "happy-dom" },
  // @cdr-kit/core's storage-ecosystem adapters dynamically import optional peer deps
  // (@aws-sdk/client-s3, @storacha/client, helia, @helia/unixfs). Vite's pre-bundler tries
  // to resolve them statically — alias them to a no-op so tests run without these SDKs installed.
  resolve: {
    alias: [
      { find: "@aws-sdk/client-s3", replacement: "data:text/javascript,export default {}" },
      { find: "@storacha/client", replacement: "data:text/javascript,export default {}" },
      { find: "helia", replacement: "data:text/javascript,export default {}" },
      { find: "@helia/unixfs", replacement: "data:text/javascript,export default {}" },
    ],
  },
});
