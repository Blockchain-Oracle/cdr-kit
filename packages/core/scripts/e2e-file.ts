/**
 * File-path end-to-end against real Aeneid: encrypt a >1KB body, store it (off-chain), allocate +
 * write the CDR-secured key on-chain, then read → collect partials → decrypt key → fetch + decrypt
 * the body. Proves the deferred file/IPFS path live. Storage is in-process memory (the storage layer
 * is pluggable; this exercises the upload/download flow without needing live IPFS infra — the CDR
 * key + crypto round-trip on Aeneid is real).
 *
 * Run: source contracts/.env && pnpm --filter @cdr-kit/core run e2e:file
 */
import { consola } from "consola";
import { createCdrKitClient } from "../src/client.js";
import { uploadFile, downloadFile, createMemoryStorage } from "../src/files.js";

const log = consola.withTag("e2e-file");

const PK = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const RPC = process.env.AENEID_RPC ?? "https://aeneid.storyrpc.io";
const API = process.env.CDR_API_URL ?? "http://172.192.41.96:1317";

if (!PK) throw new Error("PRIVATE_KEY not set (source contracts/.env)");

const client = createCdrKitClient({ privateKey: PK, apiUrl: API, rpcUrl: RPC });
const storage = createMemoryStorage();

const content = new TextEncoder().encode(`cdr-kit file-path e2e — ${"x".repeat(1500)} — ${Date.now()}`);
log.info(`payload ${content.length}B (>1KB → file path)`);

log.start("uploadFile (encrypt body → storage → allocate + write key)…");
const { uuid, cid } = await uploadFile(client, { content, storage });
log.success(`uuid=${uuid} cid=${cid}`);

log.start("downloadFile (read + collect partials + decrypt key → fetch + decrypt body)…");
const t0 = Date.now();
const { content: out } = await downloadFile(client, { uuid, storage, timeoutMs: 600_000 });
log.success(`recovered ${out.length}B in ${Math.round((Date.now() - t0) / 1000)}s`);

const match = new TextDecoder().decode(out) === new TextDecoder().decode(content);
if (match) log.box(`✅ file-path round-trip OK (uuid ${uuid})`);
else log.error("MISMATCH — body did not round-trip");
process.exit(match ? 0 : 1);
