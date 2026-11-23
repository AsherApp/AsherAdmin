/**
 * User-facing identity and copy.
 *
 * Assigned codes already in the system:
 *   tenantCode, landlordCode, ticketCode, APP-…, INS-…
 * Properties are identified by name + address, not a CUID.
 *
 * Never show Prisma/CUID system ids. Never use email as a label.
 */

export const SYSTEM_ID_PATTERN = /^#?c[a-z0-9]{20,}$/i;

export function isSystemId(value?: string | null): boolean {
  const s = String(value ?? '').trim();
  return s.length > 0 && SYSTEM_ID_PATTERN.test(s);
}

export function looksLikeEmail(value?: string | null): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i.test(
    String(value ?? '').trim()
  );
}

/** Empty string when the value is a system id or an email. */
export function rejectSystemId(value?: string | null): string {
  const s = String(value ?? '').trim();
  if (!s || isSystemId(s) || looksLikeEmail(s)) return '';
  return s;
}

export function stripSystemIds(text: string): string {
  return String(text || '').replace(/\b#?c[a-z0-9]{20,}\b/gi, '');
}

export function stripEmails(text: string): string {
  return String(text || '').replace(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    ''
  );
}

function repairMojibake(text: string): string {
  return String(text || '')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€˜/g, '‘')
    .replace(/â€™/g, '’')
    .replace(/â€œ/g, '“')
    .replace(/â€/g, '”')
    .replace(/Â·/g, '·')
    .replace(/Â /g, ' ');
}

function collapsePunctuation(text: string): string {
  return String(text || '')
    .replace(/\s*,(?:\s*,)+/g, ',')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/,\s+\./g, '.')
    .replace(/[ \t]+,/g, ',')
    .replace(/,(?=\s*[<])/g, '')
    .replace(/^\s*,\s*/gm, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*$/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeUserFacingText(text: string): string {
  return collapsePunctuation(repairMojibake(stripEmails(stripSystemIds(text))));
}

export function stripUnresolvedMergeTags(html: string): string {
  return String(html || '').replace(
    /\{\{\s*(?!input:|signature:|#if\b|#unless\b|\/if\b|\/unless\b)[^}]+\}\}/gi,
    ''
  );
}

export function sanitizeUserFacingHtml(html: string): string {
  let out = repairMojibake(
    stripUnresolvedMergeTags(stripEmails(stripSystemIds(String(html || ''))))
  );
  out = out.replace(/\s*,(?:\s*,)+/g, ',');
  if (!/<meta[^>]+charset/i.test(out)) {
    if (/<head[^>]*>/i.test(out)) {
      out = out.replace(/<head[^>]*>/i, (open) => `${open}\n<meta charset="utf-8" />`);
    } else {
      out = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${out}</body></html>`;
    }
  }
  return out;
}

export function personLabel(input: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  tenantCode?: string | null;
  landlordCode?: string | null;
  fallback?: string;
}): string {
  const full = rejectSystemId(input.fullName);
  if (full) return full;
  const business = rejectSystemId(input.businessName);
  if (business) return business;
  const combined = rejectSystemId(
    [input.firstName, input.lastName]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(' ')
  );
  if (combined) return combined;
  const code =
    rejectSystemId(input.tenantCode) || rejectSystemId(input.landlordCode);
  if (code) return code;
  return input.fallback || '';
}

/** APP-/INS- style assigned refs. Never returns a raw CUID. */
export function assignedRef(prefix: string, id?: string | null): string {
  const raw = String(id ?? '').trim();
  if (!raw) return '';
  const upperPrefix = prefix.toUpperCase().replace(/[^A-Z]/g, '');
  if (!upperPrefix) return '';
  if (new RegExp(`^${upperPrefix}-[A-Z0-9-]+$`, 'i').test(raw)) {
    return raw.toUpperCase();
  }
  if (!isSystemId(raw)) return '';
  return `${upperPrefix}-${raw.slice(-8).toUpperCase()}`;
}

export function applicationCode(id?: string | null): string {
  return assignedRef('APP', id);
}

export function maintenanceJobCode(id?: string | null): string {
  return assignedRef('JOB', id);
}

export function inspectionCode(id?: string | null): string {
  return assignedRef('INS', id);
}

export function stateDisplay(property?: {
  state?: unknown;
  stateId?: unknown;
  stateName?: unknown;
} | null): string {
  if (!property) return '';
  const state = property.state;
  if (typeof state === 'object' && state !== null) {
    const named = state as { name?: string | null; stateName?: string | null };
    return rejectSystemId(named.name || named.stateName);
  }
  if (typeof state === 'string') return rejectSystemId(state);
  return rejectSystemId(
    typeof property.stateName === 'string' ? property.stateName : ''
  );
}

function nameWord(value?: string | null): string {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0] || "";
}

function titleWord(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * What a tenant is allowed to see.
 * A saved trade / business name wins. Otherwise initials plus Homes
 * (Jane Doe → JD Homes). One name becomes "Jane Homes".
 * The personal full name is never the label.
 */
export function landlordPublicName(input: {
  businessName?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const business = rejectSystemId(input.businessName);
  if (business) return business;

  const first = nameWord(input.firstName);
  const last = nameWord(input.lastName);
  const fullParts = String(input.fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const given = first || fullParts[0] || "";
  const family = last || (fullParts.length > 1 ? fullParts[fullParts.length - 1] : "");

  if (given && family && given.toLowerCase() !== family.toLowerCase()) {
    return `${(given.charAt(0) + family.charAt(0)).toUpperCase()} Homes`;
  }
  if (given) return `${titleWord(given)} Homes`;
  return "";
}
