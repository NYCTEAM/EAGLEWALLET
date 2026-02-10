/**
 * Rewards DApp URL (Swap Mining + NFT Mining)
 */

export const REWARDS_DAPP_URLS = [
  'https://eagleswap.io/rewards',
  'https://eagleswap.llc/rewards',
];

export function getRewardsDappUrl(): string {
  return REWARDS_DAPP_URLS[0];
}
