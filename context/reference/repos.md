# Reference Repos — manifest

Full clones live in `/tmp/cdr-research/` (ephemeral, re-clone any time). The high-value files are vendored under `./vendored/` so this context folder is self-sufficient.

## Re-clone
```bash
mkdir -p /tmp/cdr-research && cd /tmp/cdr-research
gh repo clone piplabs/cdr-sdk -- --depth 1
gh repo clone jacob-tucker/cdr-ai-negotiate -- --depth 1
gh repo clone jacob-tucker/cdr-skill -- --depth 1
gh repo clone piplabs/cdr-demo -- --depth 1
# Story core (for PIL/royalty source): storyprotocol/protocol-core-v1
```

## What each repo is for
| Repo | Use it for | Caveat |
|---|---|---|
| `piplabs/cdr-sdk` | the SDK: `packages/sdk/src/{conditions,consumer,uploader,observer,attestation}.ts`, `docs/{ARCHITECTURE,CONDITIONS,SCENARIOS}.md`, fee math, error classes | docs CONDITIONS interface is STALE (3-param) |
| `piplabs/cdr-demo` | the ~9 real condition contracts + `CDRVaultNFT` + `DataMarketplace`; `src/config/contracts.ts` (ABIs/addresses); hooks `src/hooks/use-cdr-client.ts` | demo-quality; only 2 contracts tested |
| `jacob-tucker/cdr-ai-negotiate` | agent + license + vault wiring (`packages/cdr/src/vault.ts`, `apps/*/src`) | "negotiation" is random-number gen |
| `jacob-tucker/cdr-skill` | canonical CDR code patterns; EOA-as-condition + `skipConditionValidation` trick | interface docs stale |
| `storyprotocol/protocol-core-v1` | PIL/License/Royalty source of truth (interfaces, structs, signatures) | addresses in `../research/cdr-protocol-truth.md` |

## Vendored files (in ./vendored/)
- `cdr-demo-contracts/` — TimeBased, FixedFee, Whitelist(+test), DeadManSwitch(+test), MarketplaceWrite, VaultWrite, InferenceWrite, ConfidentialInference, DepinWrite, DepinBackend, CDRVaultNFT, DataMarketplace, Constants. **The exact reference for our condition contracts + the 4-param interface.**
- `cdr-sdk/` — `conditions.ts` (SDK encoder API to mirror), `CONDITIONS.md` (note stale interface), `ARCHITECTURE.md` (threshold/DKG/partials mechanics).
- `cdr-skill/SKILL.md` — setup + canonical patterns + failure modes.
- `cdr-ai-negotiate/vault.ts` — CDR vault wrapper for the agent flow.

## Docs (web)
- CDR SDK: https://docs.story.foundation/developers/cdr-sdk/overview (+ setup, encrypt-and-decrypt, ip-asset-vaults, advanced-configuration)
- Deployed contracts: https://docs.story.foundation/developers/deployed-smart-contracts
- Hackathon: https://build.usecdr.dev/
- CDR blog: https://www.story.foundation/blog/confidential-data-rails
