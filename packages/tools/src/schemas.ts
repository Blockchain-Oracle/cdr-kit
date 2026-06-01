import { z } from "zod";

/* ============================================================ */
/* Reader-side schemas (consumer subset)                         */
/* ============================================================ */

export const discoverSchema = z.object({
  fromBlock: z.number().int().nonnegative().optional().describe("Optional start block for the event scan"),
});
export const subscribeSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to subscribe to"),
  periods: z.number().int().min(1).default(1).describe("Number of subscription periods to pay for"),
  maxPricePerPeriodWei: z.string().describe("Max price per period, in wei, as a decimal string"),
});
export const accessSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to read"),
  accessAuxData: z
    .string()
    .optional()
    .describe("Optional 0x-hex aux data (e.g. ABI-encoded license tokenId for tier-gated vaults)"),
});
export const accessLicenseSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to read"),
  licenseTokenId: z.string().describe("Story license token ID (decimal string) the agent holds"),
});

/* ============================================================ */
/* Introspection schemas                                         */
/* ============================================================ */

export const vaultInfoSchema = z.object({
  uuid: z.number().int().describe("The vault UUID"),
});
export const creatorVaultsSchema = z.object({
  creator: z.string().describe("EOA address (0x...) of the vault creator"),
});
export const entitlementSchema = z.object({
  uuid: z.number().int().describe("The vault UUID"),
  subscriber: z.string().optional().describe("Address to check (default: the agent's own address)"),
});
export const estimateCostSchema = z.object({
  uuid: z.number().int().describe("The vault UUID"),
});
export const listSubscriptionsSchema = z.object({
  fromBlock: z.number().int().nonnegative().optional().describe("Optional start block for the vault scan"),
});
export const feesSchema = z.object({}).describe("Fetch CDR operation fees + operational threshold");

/* ============================================================ */
/* Author-side schemas                                           */
/* ============================================================ */

export const createVaultSchema = z.object({
  readConditionAddr: z.string().describe("Address of the condition contract for read access"),
  readConfig: z.string().describe("ABI-encoded condition config (0x-hex)"),
  childConditions: z.array(z.string()).optional().describe("Optional child condition addresses (ComposableCondition)"),
  childConfigs: z.array(z.string()).optional().describe("Optional child condition configs (0x-hex)"),
  licenseTermsId: z.string().optional().describe("Story license terms ID (decimal string), if license-gated"),
  valueWei: z.string().optional().describe("Native value to send in wei (decimal string), default 0"),
});
export const writeDataSchema = z.object({
  uuid: z.number().int().describe("Vault UUID to write into"),
  dataKey: z.string().describe("UTF-8 string to encrypt (<1KB after TDH2 overhead)"),
});
export const uploadFileSchema = z.object({
  contentBase64: z.string().describe("Base64-encoded file contents (>1KB ok; goes to IPFS)"),
  addUrl: z.string().describe("IPFS pinning POST endpoint (e.g. https://api.web3.storage/upload)"),
  gatewayUrl: z.string().describe("IPFS read gateway (e.g. https://w3s.link)"),
  authHeader: z.string().optional().describe("Authorization header for the pinning service"),
  readConditionAddr: z.string().optional().describe("Override read condition (default: openCondition)"),
  readConditionData: z.string().optional().describe("ABI-encoded read-condition config (0x-hex)"),
});

/* ============================================================ */
/* 0.5.0 advanced-condition schemas                              */
/* ============================================================ */

export const createTimeWindowSchema = z.object({
  startTs: z.string().describe("Start timestamp (or block) as a decimal string. Use 0 for 'always-on from genesis'."),
  endTs: z.string().describe("End timestamp (or block) as a decimal string. Use 0 for 'open-ended after startTs'."),
  blockBased: z.boolean().default(false).describe("Interpret startTs/endTs as block numbers instead of unix timestamps"),
  licenseTermsId: z.string().optional().describe("Story PIL license terms ID (decimal string)"),
  valueWei: z.string().optional().describe("Native IP to send in wei (decimal). Defaults to 0."),
});
export const createDeadManSchema = z.object({
  duration: z.string().describe("Heartbeat window in seconds (or blocks) as a decimal string"),
  heirs: z.array(z.string()).describe("Heir wallet addresses; allowed to read post-unlock if publicAfterUnlock=false"),
  blockBased: z.boolean().default(false).describe("Interpret duration as blocks instead of seconds"),
  creatorCanReadWhileLocked: z.boolean().default(true).describe("Creator can read their own vault pre-unlock"),
  publicAfterUnlock: z.boolean().default(false).describe("If true, ANYONE reads post-unlock; if false, only `heirs`"),
  licenseTermsId: z.string().optional(),
  valueWei: z.string().optional(),
});
export const createEscrowSchema = z.object({
  seller: z.string().optional().describe("Seller address (default: this agent's wallet)"),
  price: z.string().describe("Listing price in wei (decimal string)"),
  timeoutSecs: z.string().describe("Seconds after buyer's pay before seller can unilaterally claim"),
  arbiter: z.string().optional().describe("Arbiter address; can refund buyer. Omit for no-arbiter mode."),
  licenseTermsId: z.string().optional(),
  valueWei: z.string().optional(),
});
export const createMultiSigSchema = z.object({
  signers: z.array(z.string()).min(1).describe("Signer wallet addresses (auto-sorted by the helper)"),
  threshold: z.number().int().min(1).describe("Minimum sigs required to read (N-of-M)"),
  licenseTermsId: z.string().optional(),
  valueWei: z.string().optional(),
});

/* ============================================================ */
/* 0.5.0 Story IP integration schemas                            */
/* ============================================================ */

export const registerIpAssetSchema = z.object({
  spgNftContract: z.string().describe("SPG NFT contract address for fresh mints"),
  recipient: z.string().optional().describe("NFT recipient address (default: the agent's wallet)"),
  ipMetadataURI: z.string().optional().describe("Off-chain JSON metadata URI for the IP"),
  ipMetadataHash: z.string().optional().describe("0x-hex keccak256 of the IP metadata"),
  nftMetadataURI: z.string().optional().describe("Off-chain JSON metadata URI for the NFT"),
  nftMetadataHash: z.string().optional().describe("0x-hex keccak256 of the NFT metadata"),
});
export const attachLicenseTermsSchema = z.object({
  ipId: z.string().describe("IP asset address (0x...) to attach terms to"),
  licenseTermsId: z.string().describe("PIL license terms id (decimal string)"),
  licenseTemplate: z.string().optional().describe("PIL template address (default: aeneid.pilTemplate)"),
});
export const mintLicenseTokenSchema = z.object({
  licensorIpId: z.string().describe("Licensor IP address (the seller's IP asset)"),
  licenseTermsId: z.string().describe("PIL license terms id (decimal string)"),
  amount: z.string().default("1").describe("Number of tokens to mint (decimal string)"),
  receiver: z.string().optional().describe("Token recipient (default: the agent's wallet)"),
  maxMintingFee: z.string().default("0").describe("Max minting fee in wei (decimal string)"),
});
export const publishDataSchema = z.object({
  dataKey: z.string().describe("UTF-8 string to encrypt (<1KB after TDH2 overhead) + publish as an IP"),
  spgNftContract: z.string().describe("SPG NFT contract address (your own — register via SPG factory)"),
  /** PILTerms struct is rich + flavor-specific. Pass a flavor name + minimal params; the tool
   *  constructs the PILTerms via PILFlavor.<flavor>(params). */
  flavor: z
    .enum(["nonCommercialSocialRemixing", "commercialUse", "commercialRemix", "creativeCommonsAttribution"])
    .describe("PIL flavor — picks the right preset"),
  defaultMintingFee: z.string().default("0").describe("PIL: default minting fee in wei (decimal string)"),
  commercialRevShare: z.number().int().min(0).max(100).default(0).describe("PIL: commercial rev share %, 0-100"),
  ipMetadataURI: z.string().optional(),
});
