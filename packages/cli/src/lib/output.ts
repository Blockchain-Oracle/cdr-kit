/** `ok(data)` and `err(msg)` helpers. Pretty by default; raw JSON when `--json` is set. */

let jsonMode = false;
export function setJsonMode(on: boolean): void {
  jsonMode = on;
}
export function isJsonMode(): boolean {
  return jsonMode;
}

export function ok(data: unknown): void {
  if (jsonMode) process.stdout.write(JSON.stringify(data, replacer, 2) + "\n");
  else prettyPrint(data);
}

export function err(message: string, exitCode = 1): never {
  if (jsonMode) process.stdout.write(JSON.stringify({ error: message }) + "\n");
  else process.stderr.write(`error: ${message}\n`);
  process.exit(exitCode);
}

function replacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

function prettyPrint(data: unknown): void {
  if (data === undefined || data === null) return;
  if (typeof data === "string") {
    process.stdout.write(data + "\n");
    return;
  }
  if (typeof data === "number" || typeof data === "boolean" || typeof data === "bigint") {
    process.stdout.write(String(data) + "\n");
    return;
  }
  process.stdout.write(JSON.stringify(data, replacer, 2) + "\n");
}
