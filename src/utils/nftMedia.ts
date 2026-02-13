const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
];

const ARWEAVE_GATEWAY = 'https://arweave.net/';

const dedupe = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  });
  return out;
};

export const toIpfsGatewayCandidates = (uri: string): string[] => {
  const raw = String(uri || '').trim();
  if (!raw) return [];

  let cidPath = '';
  if (raw.startsWith('ipfs://ipfs/')) {
    cidPath = raw.slice('ipfs://ipfs/'.length);
  } else if (raw.startsWith('ipfs://')) {
    cidPath = raw.slice('ipfs://'.length);
  } else if (raw.startsWith('ipfs/')) {
    cidPath = raw.slice('ipfs/'.length);
  } else if (raw.includes('/ipfs/')) {
    const idx = raw.indexOf('/ipfs/');
    cidPath = raw.slice(idx + '/ipfs/'.length);
  } else {
    return [];
  }

  const clean = cidPath.replace(/^\/+/, '');
  if (!clean) return [];
  return IPFS_GATEWAYS.map((gateway) => `${gateway}${clean}`);
};

export const normalizeNftUrl = (raw: unknown): string => {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return '';

  if (value.startsWith('ipfs://') || value.startsWith('ipfs/') || value.includes('/ipfs/')) {
    return toIpfsGatewayCandidates(value)[0] || '';
  }

  if (value.startsWith('ar://')) {
    return `${ARWEAVE_GATEWAY}${value.slice('ar://'.length)}`;
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('{') || value.startsWith('[')) {
    return '';
  }

  return '';
};

export const buildNftImageCandidates = (raw: unknown): string[] => {
  const normalized = normalizeNftUrl(raw);
  if (!normalized) return [];

  if (normalized.startsWith('data:')) {
    return [normalized];
  }

  if (normalized.includes('/ipfs/')) {
    const fromIpfs = toIpfsGatewayCandidates(normalized);
    if (fromIpfs.length > 0) {
      return dedupe(fromIpfs);
    }
  }

  return [normalized];
};

export const isSvgDataUri = (uri: string): boolean =>
  uri.startsWith('data:image/svg+xml');

export const isLikelySvgUrl = (uri: string): boolean => {
  if (!uri) return false;
  if (isSvgDataUri(uri)) return true;
  const base = uri.split('?')[0].toLowerCase();
  return base.endsWith('.svg');
};

