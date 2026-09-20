/**
 * Preset avatars — ten of them, drawn in code.
 *
 * These used to be URLs to DiceBear's public API. That made something as
 * basic as a profile picture depend on a third party being up, on their
 * version 7 endpoint never being retired, and on the person having signal.
 * Any of those failing shows a broken image where a face should be.
 *
 * Drawn as SVG paths instead: a few hundred bytes each, no network, no 404,
 * sharp at 24px and at 200px. One parametric face with ten colourways and
 * four hair shapes gives variety without ten hand-drawn files.
 *
 * Keep this list in step across Tenant, Landlord, V2, Vendor and Admin — the
 * same `id` must mean the same face everywhere, because it is what gets
 * stored against the profile.
 */

export type AvatarPreset = {
  /** Stored on the profile. Never renumber these. */
  id: string;
  label: string;
  /** Ring/background behind the face. */
  bg: string;
  /** Face colour. */
  skin: string;
  /** Hair / head covering colour. */
  hair: string;
  /** Which hair shape to draw. */
  style: 'short' | 'bun' | 'curls' | 'wrap';
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'rose', label: 'Rose', bg: '#F8E1E7', skin: '#E8B48F', hair: '#3A2A27', style: 'short' },
  { id: 'ocean', label: 'Ocean', bg: '#DCEBF7', skin: '#D9A377', hair: '#1F3A57', style: 'bun' },
  { id: 'forest', label: 'Forest', bg: '#DDEFE2', skin: '#C98C5E', hair: '#22402C', style: 'curls' },
  { id: 'sunset', label: 'Sunset', bg: '#FBE6D3', skin: '#B87748', hair: '#5A2E1B', style: 'wrap' },
  { id: 'lavender', label: 'Lavender', bg: '#E8E2F3', skin: '#F0C9A8', hair: '#4A3A63', style: 'bun' },
  { id: 'clay', label: 'Clay', bg: '#F3E3DA', skin: '#8D5A3B', hair: '#2B1C14', style: 'curls' },
  { id: 'mint', label: 'Mint', bg: '#DAF0EC', skin: '#EBBF9B', hair: '#16403B', style: 'short' },
  { id: 'slate', label: 'Slate', bg: '#E4E7EB', skin: '#A96F45', hair: '#20262E', style: 'wrap' },
  { id: 'amber', label: 'Amber', bg: '#FAEBCD', skin: '#6F452B', hair: '#3A2413', style: 'curls' },
  { id: 'plum', label: 'Plum', bg: '#F0DFEA', skin: '#DCA77F', hair: '#4B2039', style: 'bun' },
];

/** Lookup by stored id. Returns undefined for an unknown or retired preset. */
export function findAvatarPreset(id?: string | null): AvatarPreset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((preset) => preset.id === id);
}

/**
 * The value stored on a profile so a preset can live in the same field as an
 * uploaded photo URL, rather than needing a second column everywhere.
 */
export const AVATAR_PRESET_PREFIX = 'preset:';

export function toStoredAvatar(presetId: string): string {
  return `${AVATAR_PRESET_PREFIX}${presetId}`;
}

/** Reads a stored profile value: a preset id, or undefined if it is a real URL. */
export function presetIdFromStored(value?: string | null): string | undefined {
  if (!value || !value.startsWith(AVATAR_PRESET_PREFIX)) return undefined;
  return value.slice(AVATAR_PRESET_PREFIX.length) || undefined;
}
