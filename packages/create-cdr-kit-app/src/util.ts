/** Strip the common indent + leading/trailing blank lines from a template literal block. */
export function dedent(s: string): string {
  const lines = s.split("\n");
  if (lines.length && (lines[0] ?? "").trim() === "") lines.shift();
  if (lines.length && (lines[lines.length - 1] ?? "").trim() === "") lines.pop();
  const indents = lines.filter((l) => l.trim()).map((l) => (l.match(/^(\s*)/)?.[1] ?? "").length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join("\n") + "\n";
}
