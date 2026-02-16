const ISSUER_RULES = [
  { pattern: /\biShares\b/i, issuer: 'BlackRock (iShares)' },
  { pattern: /\bVanguard\b/i, issuer: 'Vanguard' },
  { pattern: /\bSPDR\b/i, issuer: 'State Street (SPDR)' },
  { pattern: /\bInvesco\b/i, issuer: 'Invesco' },
  { pattern: /\bSchwab\b/i, issuer: 'Charles Schwab' },
  { pattern: /\bJPMorgan\b|\bJ\.P\. Morgan\b|\bJP Morgan\b/i, issuer: 'JPMorgan' },
  { pattern: /\bGlobal X\b/i, issuer: 'Global X' },
  { pattern: /\bWisdomTree\b/i, issuer: 'WisdomTree' },
  { pattern: /\bVanEck\b/i, issuer: 'VanEck' },
  { pattern: /\bFirst Trust\b/i, issuer: 'First Trust' },
  { pattern: /\bPIMCO\b/i, issuer: 'PIMCO' },
  { pattern: /\bDimensional\b/i, issuer: 'Dimensional' },
  { pattern: /\bProShares\b/i, issuer: 'ProShares' },
  { pattern: /\bARK\b/i, issuer: 'ARK' },
  { pattern: /\bFidelity\b/i, issuer: 'Fidelity' },
  { pattern: /\bFranklin\b/i, issuer: 'Franklin Templeton' },
  { pattern: /\bT\. Rowe Price\b/i, issuer: 'T. Rowe Price' },
  { pattern: /\bMorgan Stanley\b/i, issuer: 'Morgan Stanley' },
  { pattern: /\bGoldman Sachs\b/i, issuer: 'Goldman Sachs' },
  { pattern: /\bDeutsche Bank\b|\bXtrackers\b/i, issuer: 'DWS (Xtrackers)' }
];

export const detectIssuer = (securityName) => {
  for (const rule of ISSUER_RULES) {
    if (rule.pattern.test(securityName)) {
      return rule.issuer;
    }
  }
  return '';
};
