# CDR Protocol — Ground Truth

Source: read in full from `piplabs/cdr-sdk`, `jacob-tucker/cdr-skill`, `piplabs/cdr-demo` (see `../reference/vendored/`). SDK is ~6 weeks old as of 2026-05 — treat the surface as moving; re-verify before deploy.

## What CDR is (mechanically)

Threshold-encrypted vaults on Story L1. NOT confidential compute.

- Data key (32 bytes) encrypted client-side via **TDH2** to a **global DKG public key** held in shares by Story validators running **Intel SGX (DCAP v3)** enclaves.
- On read: validators each produce an **ECIES-encrypted partial decryption** to the requester's secp256k1 pubkey; requester decrypts partials locally and **TDH2-combines** to recover the data key, then AES-decrypts the body.
- **Net effect: after conditions pass, the requester holds PLAINTEXT.** TEE protects only the validator key-shares, not the buyer's process. No compute-on-encrypted-data. No DRM, no usage control, no leak detection after decryption.
- Two API layers in `@piplabs/cdr-sdk`:
  - High-level: `uploader.uploadCDR` / `consumer.accessCDR` (inline ≤ ~1024 bytes); `uploader.uploadFile` / `consumer.downloadFile` (files → AES body to a StorageProvider e.g. Helia/IPFS, only AES key under CDR).
  - Low-level: `allocate` → `encryptDataKey` → `write`, and `read` → `collectPartials` → `decryptDataKey`.
- `CDRClient({ network: "testnet", publicClient, walletClient, apiUrl })`. `apiUrl` is **required** (Story-API REST). Must `await initWasm()` once before any encrypt/decrypt (in React: top-level effect/provider). Edge runtime unsupported (Node/browser only). Helia needs Node 22+.

### Hard limitations (design around these)
| Limit | Detail | Implication |
|---|---|---|
| No compute | buyer gets plaintext | moat = no-billing-infra + royalty rails + on-chain revoke, NOT secrecy-after-sale |
| ~7-min read latency | "approximately 7 minutes server-side"; SDK default timeout 60s, examples use 120_000ms; `PartialCollectionTimeoutError` exists | async/provisioning UX only; never per-request hot path |
| ~1KB inline cap | bigger → `uploadFile` | datasets/models go to IPFS, key under CDR |
| Trusted keeper | `apiUrl` REST indexer (`http://172.192.41.96:1317`, plain HTTP, may move) sits between client and chain for partials | keep in env var; `onInvalidPartial` attestation check is opt-in |
| Single global key | one DKG round; no per-vault key isolation; SGX attack history (Foreshadow/ÆPIC/SGAxe) | testnet "not production confidentiality" per docs |
| No native revocation/expiry | conditions are `view`; once satisfied, succeeds forever unless your contract gates it | build revoke/expiry into our own condition state |

## THE condition interface (CRITICAL — docs are wrong)

The official `docs/CONDITIONS.md` + `cdr-skill/SKILL.md` show a **3-param** interface: `checkReadCondition(address caller, bytes conditionData, bytes accessAuxData)`. **This is STALE.** Every *deployed, working* contract in `cdr-demo` uses **4-param, uuid-first, caller-last**:

```solidity
function checkReadCondition(
    uint32 uuid,            // CDR vault id (vaults are keyed by uint32)
    bytes calldata accessAuxData,   // dynamic, supplied by caller per read (proof/sig/tokenId)
    bytes calldata conditionData,   // static, set at allocate() time
    address caller          // msg.sender of the CDR read call
) external view returns (bool);

// same shape for checkWriteCondition
```

Confirmed by `MarketplaceWriteCondition.sol` comment: *"Parameter order matches ICDRWriteCondition: (uuid, accessAuxData, writeConditionData, caller)"* and by every other demo condition.

**✅ VERIFIED ON-CHAIN (2026-05-28).** Scanning the live `LICENSE_READ_CONDITION` bytecode dispatcher on Aeneid: the 4-param selector `0x8db3eb17` (`checkReadCondition(uint32,bytes,bytes,address)`) **is present**; the 3-param selector `0x9b3e201d` (`checkReadCondition(address,bytes,bytes)`) **is absent entirely**. The docs' 3-param shape is dead. cdr-kit targets the **4-param uuid-first** interface. (Still add an E0 fork test of a real `allocate→write→read` round-trip as regression protection.)

### ICDR (the precompile) — confirmed from CDRVaultNFT.sol
```solidity
interface ICDR {
    function allocate(
        bool updatable,
        address writeConditionAddr,   // contract OR plain EOA
        address readConditionAddr,
        bytes calldata writeConditionData,
        bytes calldata readConditionData
    ) external payable returns (uint32 newVaultUuid);
    function allocateFee() external view returns (uint256);
}
```
- `conditionData` = static config stored at allocate; `accessAuxData` = dynamic per write/read. Pass `"0x"` if unused.
- **EOA-as-condition:** the precompile accepts a plain EOA as a condition address and gates to that exact address. Use `"0x"` for its conditionData. But `allocate()` preflights a staticcall of `checkRead/WriteCondition` — an EOA has no code → throws `InvalidConditionContractError`; pass `skipConditionValidation: true` and use the **low-level** path (`uploadCDR`/`uploadFile` do NOT expose that flag).

## Verified addresses — Aeneid testnet (chain 1315)

RPC `https://aeneid.storyrpc.io` · faucet `https://aeneid.faucet.story.foundation` · explorer `https://aeneid.storyscan.io` · Story-API REST `http://172.192.41.96:1317` (may move).

All addresses below ✅ VERIFIED ON-CHAIN deployed (bytecode present) on 2026-05-28 @ block ~18,837,722. `CDR.allocateFee()` returns **0** on this deployment (no allocate fee currently — but read it at runtime; it can change).
```
CDR precompile          0xCCCcCC0000000000000000000000000000000005   (allocateFee() = 0)
DKG precompile          0xcccccc0000000000000000000000000000000004
OwnerWriteCondition     0x4C9bFC96d7092b590D497A191826C3dA2277c34B   (✅ live; write-only; reverts if used as read)
LICENSE_READ_CONDITION  0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3   (✅ LIVE — use this one)
   ⚠️ the cdr-demo Constants.sol address 0xD42912755319665397FF090fBB63B1a31aE87Cee is NOT deployed (empty bytecode) — demo source is stale; docs are correct here.
Story IP core (✅ all deployed; confirmed against docs.story.foundation/developers/deployed-smart-contracts):
IPAssetRegistry         0x77319B4031e6eF1250907aa00018B8B1c67a244b
LicenseRegistry         0x529a750E02d8E2f15649c13D69a465286a780e24
LicensingModule         0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f
LicenseToken (ERC721)   0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC
PILicenseTemplate       0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316
RoyaltyModule           0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086
RoyaltyPolicyLAP        0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E
RoyaltyPolicyLRP        0x9156e603C949481883B1d3355c6f1132D191fC41
ModuleRegistry          0x022DBAAeA5D8fB31a0Ad793335e39Ced5D631fa5
WIP (Wrapped IP ERC20)  0x1514000000000000000000000000000000000000
```
Pragma across CDR demo + Story core: `solidity 0.8.26`.

## Live on-chain findings (OQ8 — confirmed against Aeneid 2026-05-28)

Ran real txs from a funded wallet (`0xc183…96E2`) with our deployed `OpenCondition` (`0x36fB2e2d10efd1E905b7779A684F34B9c775b62B`).

1. **`allocate` works with our 4-param contract condition.** `allocate(false, OpenCondition, OpenCondition, "", "")` succeeded → `VaultAllocated(uuid=4056, …, writeCond=OpenCondition, readCond=OpenCondition)`. Confirms OQ6: allocate just stores the vault (it did NOT invoke the condition at allocate time).
2. **⚠️ GAS: `eth_estimateGas` underestimates CDR precompile calls → the tx OOGs with `ReentrancySentryOOG` and reverts (status=false) even though `eth_call` simulation succeeds.** Fix: **set an explicit, generous gas limit on every CDR write/allocate/read tx** (2,000,000 worked; actual `allocate` gasUsed was ~100k, but the estimate was below the precompile's true need). The SDK + dashboard MUST override gas limit, not rely on estimation. Also the original tx sat *pending* when gas PRICE was too low — set a healthy gas price too (~60+ gwei; network ~42 gwei).
3. **`uuid` is a GLOBAL sequential counter** shared by all testnet users (got 4056). You cannot predict your uuid before the tx (it moves between simulate and send). **Read your uuid from the `VaultAllocated` event in your own tx receipt** (topic0 `0xf1370099e56e061a64615edc07c1d17e36a20585cdc9b288bf0259a528365d0a`; data word[0]=uuid, word[2]=writeCond, word[3]=readCond). For discover/indexing, filter `VaultAllocated` by matching your condition/factory addr (the event has no allocator field — see OQ7).
4. There's also a fee event (topic0 `0x93a1…`) emitted before `VaultAllocated`; don't assume logs[0] is VaultAllocated.
6. **✅✅✅ OQ8 CLOSED — full encrypt→write→read→decrypt round-trip works on real Aeneid.** Via `@piplabs/cdr-sdk` `uploader.uploadCDR` (allocate uuid=4058 + encrypt + write) → `consumer.accessCDR` (read + collect partials + threshold-decrypt) → recovered the exact secret (MATCH). Two surprises vs assumptions: (a) **the SDK's internal `allocate` did NOT OOG** — the gas issue is cast-specific (cast's `eth_estimateGas`), the SDK/viem path is fine, so the dashboard/agent using the SDK don't need the manual gas-limit workaround (only raw cast/low-level calls do). (b) **the read took ~18s, not ~7 min** — the keeper API (`172.192.41.96:1317`) is live and fast; treat 7-min as a worst-case ceiling, design UX for "tens of seconds typical, minutes worst-case." Requires `initWasm()` (from `@piplabs/cdr-crypto`, NOT re-exported by cdr-sdk) before any encrypt/decrypt.
5. **✅✅ The 4-param interface is PROVEN by real precompile invocation (not just the bytecode scan).** `write(4056, "0x", 0xdeadbeef)` succeeded; the `cast run` trace shows the CDR precompile staticcall our `OpenCondition` with selector **`0x5645dbbf` = `checkWriteCondition(uint32,bytes,bytes,address)`**, passing `(uuid=4056, accessAuxData, conditionData, caller=0xc183…96E2)`, and our contract `← [Return] 0x…01` (true) → the write proceeded + emitted `VaultWritten` (topic0 `0x68b7452742f8d8707af90ddff5ef1a7f8850f5724b804e72b4df1a37050a6355`). So: the precompile calls conditions with `(uuid, accessAuxData, conditionData, caller)`, at write/read time, and respects the returned bool. Read-cond selector is `0x8db3eb17`. **D3 closed end-to-end.** Remaining (OQ8): the encrypt→read→partial-collect→decrypt flow (~7 min, needs the SDK to produce a real TDH2 ciphertext) — that's the E4 TS e2e.
