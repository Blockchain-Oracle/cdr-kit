// fumadocs config — consumed by the fumadocs-mdx CLI generator
import { defineDocs, defineConfig, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      importLine: z.string().optional(),
      breadcrumb: z.array(z.string()).optional(),
      prev: z.object({ href: z.string(), label: z.string() }).optional(),
      next: z.object({ href: z.string(), label: z.string() }).optional(),
    }),
  },
});

export default defineConfig();
