import React from 'react';

import { findAvatarPreset, presetIdFromStored, type AvatarPreset } from './avatarPresets';

/**
 * The avatar. One component wherever a person is shown.
 *
 * Seven places in this app drew their own circle and took `name.charAt(0)`,
 * so every admin saw a single letter where the other apps show two, and the
 * circle's size and colour changed from table to modal.
 *
 * Three tiers, in order, and it can never show a broken image:
 *
 *   1. their photo     — if they uploaded one, and it loads
 *   2. a preset avatar — if they picked one instead
 *   3. their initials   — always available, so this is the floor
 */
export type AvatarStatus = 'online' | 'offline' | 'busy';

const SIZES = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]' },
  sm: { box: 'w-8 h-8', text: 'text-xs' },
  md: { box: 'w-11 h-11', text: 'text-sm' },
  lg: { box: 'w-12 h-12', text: 'text-lg' },
  xl: { box: 'w-20 h-20', text: 'text-2xl' },
  '2xl': { box: 'w-28 h-28', text: 'text-4xl' },
} as const;

export type AvatarSize = keyof typeof SIZES;

export function initialsFromName(name?: string | null): string {
  const parts = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

/** Draws one preset face. Pure geometry, so it is crisp at any size. */
function PresetFace({ preset }: { preset: AvatarPreset }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill={preset.bg} />
      <path d="M18 100c0-19 14-30 32-30s32 11 32 30z" fill={preset.hair} opacity={0.9} />
      <circle cx="50" cy="44" r="21" fill={preset.skin} />
      {preset.style === 'short' || preset.style === 'bun' ? (
        <path d="M29 42a21 21 0 0 1 42 0c0-14-9-21-21-21s-21 7-21 21z" fill={preset.hair} />
      ) : null}
      {preset.style === 'bun' ? <circle cx="50" cy="18" r="8" fill={preset.hair} /> : null}
      {preset.style === 'curls' ? (
        <>
          <circle cx="36" cy="30" r="10" fill={preset.hair} />
          <circle cx="50" cy="25" r="11" fill={preset.hair} />
          <circle cx="64" cy="30" r="10" fill={preset.hair} />
        </>
      ) : null}
      {preset.style === 'wrap' ? (
        <path
          d="M27 44c0-15 10-25 23-25s23 10 23 25c0 4-4 5-6 2-3-6-9-10-17-10s-14 4-17 10c-2 3-6 2-6-2z"
          fill={preset.hair}
        />
      ) : null}
      <ellipse cx="42" cy="45" rx="2.6" ry="3.2" fill="#2B2B33" />
      <ellipse cx="58" cy="45" rx="2.6" ry="3.2" fill="#2B2B33" />
      <path
        d="M44 54c2 2.6 10 2.6 12 0"
        stroke="#2B2B33"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Avatar({
  name,
  source,
  size = 'md',
  status,
  ring = false,
  className = '',
}: {
  name?: string | null;
  /** An uploaded image URL, or a stored preset such as `preset:rose`. */
  source?: string | null;
  size?: AvatarSize;
  status?: AvatarStatus;
  ring?: boolean;
  className?: string;
}) {
  const [photoFailed, setPhotoFailed] = React.useState(false);

  // A new source deserves a fresh attempt — otherwise one bad URL poisons the
  // component for every person rendered through it afterwards.
  React.useEffect(() => {
    setPhotoFailed(false);
  }, [source]);

  const spec = SIZES[size];
  const label = (name ?? '').trim() || 'User';
  const presetId = presetIdFromStored(source);
  const preset = findAvatarPreset(presetId);
  const photoUrl = !presetId && source?.trim() ? source.trim() : undefined;

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`${spec.box} overflow-hidden rounded-full bg-red-50 ${ring ? 'ring-2 ring-white' : ''}`}
        role="img"
        aria-label={`${label}${status ? `, ${status}` : ''}`}
      >
        {photoUrl && !photoFailed ? (
          <img
            src={photoUrl}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : preset ? (
          <PresetFace preset={preset} />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center bg-red-600 font-bold text-white ${spec.text}`}
          >
            {initialsFromName(label)}
          </span>
        )}
      </span>

      {status ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
            size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
          } ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'busy'
                ? 'bg-amber-500'
                : 'bg-gray-400'
          }`}
        />
      ) : null}
    </span>
  );
}

export default Avatar;
