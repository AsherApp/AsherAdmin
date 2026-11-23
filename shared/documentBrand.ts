/**
 * Whose name and logo a document carries.
 *
 * A landlord takes an Asher template, edits it, saves it and sends it. From
 * that point it is THEIR document, so the cover and the footer have to be
 * theirs — not Asher's. Asher's own library templates stay Asher's.
 *
 * This is the only place that decision is made. It used to be made nowhere:
 * the cover logo was hardcoded into the viewer, which injected Asher's mark
 * into every document it was shown, whoever had written it.
 *
 * Dependency-free apart from the two modules beside it, so it can be vendored
 * into the front ends the way `asherFees.ts` is — a landlord's preview and the
 * copy their tenant receives are then branded by the same code, rather than
 * each app guessing.
 */

import { ASHER_BRAND, type DocumentBrand } from './documentEngine';
import { landlordPublicName, rejectSystemId } from './displayIdentity';

export type { DocumentBrand };
export { ASHER_BRAND };

/** What `documentBrandFor` needs to know about a landlord. */
export interface LandlordBrandSource {
  businessName?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Their uploaded logo, if they have set one. */
  logoUrl?: string | null;
}

/**
 * The brand for a document a landlord sends.
 *
 * The name is `landlordPublicName`: their saved business name if they have
 * one, otherwise the name Asher makes for them from their own — Jane Doe
 * becomes "JD Homes", a single name becomes "Jane Homes". That rule already
 * decided what a tenant sees a landlord called in a notification; a document
 * is no different, and a landlord without a business name should not find
 * their legal name across the top of every agreement they send.
 *
 * Returns Asher's brand when there is nothing to go on, so a document is never
 * left unsigned by anyone.
 */
export function documentBrandFor(landlord: LandlordBrandSource | null | undefined): DocumentBrand {
  if (!landlord) return ASHER_BRAND;

  const name = landlordPublicName(landlord);
  if (!name) return ASHER_BRAND;

  const logo = rejectSystemId(landlord.logoUrl);

  return {
    name,
    ...(logo ? { logoSrc: logo } : {}),
  };
}

/**
 * The brand for a template, by who owns it.
 *
 * `documentFor: 'ASHER'` is a library template Asher publishes, and stays
 * Asher's however a landlord has it open. `'USER'` is a landlord's own saved
 * copy, which goes out under theirs.
 */
export function templateBrand(
  documentFor: string | null | undefined,
  owner: LandlordBrandSource | null | undefined
): DocumentBrand {
  if (String(documentFor || '').toUpperCase() !== 'USER') return ASHER_BRAND;
  return documentBrandFor(owner);
}
