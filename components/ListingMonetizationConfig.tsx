import React, { useCallback, useEffect, useState } from 'react';
import { Loader, Save, Settings2 } from 'lucide-react';
import {
  getListingMonetizationConfig,
  ListingMonetizationConfig,
  updateListingMonetizationConfig,
} from '../services/systemConfigService';

type FormState = {
  freePerMonth: string;
  premiumDays: string;
  relocatePostFeeEnabled: boolean;
  listFeeGbp: string;
  premiumFeeGbp: string;
  listFeeNgn: string;
  premiumFeeNgn: string;
  listFeeUsd: string;
  premiumFeeUsd: string;
  listFeeEur: string;
  premiumFeeEur: string;
  relocatePostFeeGbp: string;
  relocatePostFeeNgn: string;
  relocatePostFeeUsd: string;
  relocatePostFeeEur: string;
  adBaseGbp: string;
  adBaseNgn: string;
  adBaseUsd: string;
  adBaseEur: string;
  adDurationIncreasePercent: string;
  adLocationIncreasePercent: string;
  adBannerPremiumPercent: string;
};

const toForm = (config: ListingMonetizationConfig): FormState => ({
  freePerMonth: String(config.freePerMonth),
  premiumDays: String(config.premiumDays),
  relocatePostFeeEnabled: config.relocatePostFeeEnabled !== false,
  listFeeGbp: String(config.fees.GBP.listFee),
  premiumFeeGbp: String(config.fees.GBP.premiumFee),
  listFeeNgn: String(config.fees.NGN.listFee),
  premiumFeeNgn: String(config.fees.NGN.premiumFee),
  listFeeUsd: String(config.fees.USD.listFee),
  premiumFeeUsd: String(config.fees.USD.premiumFee),
  listFeeEur: String(config.fees.EUR.listFee),
  premiumFeeEur: String(config.fees.EUR.premiumFee),
  relocatePostFeeGbp: String(config.fees.GBP.relocatePostFee ?? 25),
  relocatePostFeeNgn: String(config.fees.NGN.relocatePostFee ?? 15000),
  relocatePostFeeUsd: String(config.fees.USD.relocatePostFee ?? 30),
  relocatePostFeeEur: String(config.fees.EUR.relocatePostFee ?? 28),
  adBaseGbp: String(config.ads?.base?.GBP ?? 5),
  adBaseNgn: String(config.ads?.base?.NGN ?? 5000),
  adBaseUsd: String(config.ads?.base?.USD ?? 5),
  adBaseEur: String(config.ads?.base?.EUR ?? 5),
  adDurationIncreasePercent: String(config.ads?.durationIncreasePercent ?? 30),
  adLocationIncreasePercent: String(config.ads?.locationIncreasePercent ?? 30),
  adBannerPremiumPercent: String(config.ads?.bannerPremiumPercent ?? 50),
});

const Field = ({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-semibold text-gray-700">{label}</span>
    <input
      type="number"
      min={0}
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
    />
    {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
  </label>
);

const ListingMonetizationConfigPage: React.FC = () => {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const config = await getListingMonetizationConfig();
      setForm(toForm(config));
      setUpdatedAt(config.updatedAt);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load listing monetization config'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSuccess('');
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateListingMonetizationConfig({
        freePerMonth: Number(form.freePerMonth),
        premiumDays: Number(form.premiumDays),
        listFeeGbp: Number(form.listFeeGbp),
        premiumFeeGbp: Number(form.premiumFeeGbp),
        listFeeNgn: Number(form.listFeeNgn),
        premiumFeeNgn: Number(form.premiumFeeNgn),
        listFeeUsd: Number(form.listFeeUsd),
        premiumFeeUsd: Number(form.premiumFeeUsd),
        listFeeEur: Number(form.listFeeEur),
        premiumFeeEur: Number(form.premiumFeeEur),
        relocatePostFeeGbp: Number(form.relocatePostFeeGbp),
        relocatePostFeeNgn: Number(form.relocatePostFeeNgn),
        relocatePostFeeUsd: Number(form.relocatePostFeeUsd),
        relocatePostFeeEur: Number(form.relocatePostFeeEur),
        relocatePostFeeEnabled: form.relocatePostFeeEnabled,
        adBaseGbp: Number(form.adBaseGbp),
        adBaseNgn: Number(form.adBaseNgn),
        adBaseUsd: Number(form.adBaseUsd),
        adBaseEur: Number(form.adBaseEur),
        adDurationIncreasePercent: Number(form.adDurationIncreasePercent),
        adLocationIncreasePercent: Number(form.adLocationIncreasePercent),
        adBannerPremiumPercent: Number(form.adBannerPremiumPercent),
      });
      setForm(toForm(updated));
      setUpdatedAt(updated.updatedAt);
      setSuccess('System fees saved. Listings, relocate posts, and tenant ads will use these values.');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save listing monetization config'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-gray-800">
          <Settings2 className="text-red-600" />
          Listing & ads pricing
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-600">
          Platform system config for listings, relocate posts, and tenant ads.
          Charged from landlord or tenant wallets by currency. Ads money goes
          to the Admin wallet.
        </p>
        {updatedAt ? (
          <p className="mt-1 text-xs text-gray-400">
            Last updated {new Date(updatedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {loading || !form ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader className="animate-spin" size={18} />
          Loading system config…
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-red-500/5 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800">Quota & duration</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Free listings per month"
                value={form.freePerMonth}
                onChange={(v) => setField('freePerMonth', v)}
                hint="Each landlord gets this many free publishes each calendar month."
              />
              <Field
                label="Premium pin duration (days)"
                value={form.premiumDays}
                onChange={(v) => setField('premiumDays', v)}
                hint="How long a promoted listing stays pinned on tenant search/landing."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-red-500/5 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800">Relocate post fee</h3>
            <p className="mt-1 text-sm text-gray-500">
              When ON, Asher score 850+ tenants pay the relocate post fee from
              their wallet on final submit. When OFF, the same submit runs with
              no charge.
            </p>
            <label className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.relocatePostFeeEnabled}
                onChange={(e) => {
                  setForm((prev) =>
                    prev
                      ? { ...prev, relocatePostFeeEnabled: e.target.checked }
                      : prev
                  );
                  setSuccess('');
                }}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-semibold text-gray-800">
                Charge relocate post fee
              </span>
            </label>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-red-500/5 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800">Fees by currency</h3>
            <p className="mt-1 text-sm text-gray-500">
              List fee applies after free quota. Premium fee is optional on top
              (free+premium or paid+premium). Relocate post fee is charged from
              tenant wallets for Asher score 850+ premium matching when the
              toggle above is ON.
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {(
                [
                  [
                    'GBP',
                    'listFeeGbp',
                    'premiumFeeGbp',
                    'relocatePostFeeGbp',
                    'United Kingdom',
                  ],
                  [
                    'NGN',
                    'listFeeNgn',
                    'premiumFeeNgn',
                    'relocatePostFeeNgn',
                    'Nigeria',
                  ],
                  [
                    'USD',
                    'listFeeUsd',
                    'premiumFeeUsd',
                    'relocatePostFeeUsd',
                    'US dollar markets',
                  ],
                  [
                    'EUR',
                    'listFeeEur',
                    'premiumFeeEur',
                    'relocatePostFeeEur',
                    'Euro markets',
                  ],
                ] as const
              ).map(([code, listKey, premiumKey, relocateKey, market]) => (
                <div
                  key={code}
                  className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4"
                >
                  <p className="text-sm font-bold text-gray-800">
                    {code}{' '}
                    <span className="font-medium text-gray-500">· {market}</span>
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field
                      label={`List fee (${code})`}
                      value={form[listKey]}
                      onChange={(v) => setField(listKey, v)}
                    />
                    <Field
                      label={`Premium fee (${code})`}
                      value={form[premiumKey]}
                      onChange={(v) => setField(premiumKey, v)}
                    />
                    <Field
                      label={`Relocate post (${code})`}
                      value={form[relocateKey]}
                      onChange={(v) => setField(relocateKey, v)}
                      hint="Platform + referencing"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-red-500/5 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800">Tenant ads</h3>
            <p className="mt-1 text-sm text-gray-500">
              Base price per currency. Extra days after day 1 add the duration
              percent. Each 10 km after the first 10 km adds the location
              percent. Banner ads add the banner percent. The backend charges
              this quote, not the amount the tenant app sends.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field
                label="Duration increase (%)"
                value={form.adDurationIncreasePercent}
                onChange={(v) => setField('adDurationIncreasePercent', v)}
                hint="Per extra day after day 1."
              />
              <Field
                label="Location increase (%)"
                value={form.adLocationIncreasePercent}
                onChange={(v) => setField('adLocationIncreasePercent', v)}
                hint="Per 10 km after the first 10 km."
              />
              <Field
                label="Banner premium (%)"
                value={form.adBannerPremiumPercent}
                onChange={(v) => setField('adBannerPremiumPercent', v)}
                hint="Extra on top of duration and radius."
              />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Ad base (GBP)"
                value={form.adBaseGbp}
                onChange={(v) => setField('adBaseGbp', v)}
              />
              <Field
                label="Ad base (NGN)"
                value={form.adBaseNgn}
                onChange={(v) => setField('adBaseNgn', v)}
              />
              <Field
                label="Ad base (USD)"
                value={form.adBaseUsd}
                onChange={(v) => setField('adBaseUsd', v)}
              />
              <Field
                label="Ad base (EUR)"
                value={form.adBaseEur}
                onChange={(v) => setField('adBaseEur', v)}
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Save system config
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingMonetizationConfigPage;
