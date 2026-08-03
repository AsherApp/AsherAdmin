import React, { useCallback, useEffect, useState } from 'react';
import { FileCheck, FormInput, Loader, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  createVendorDocumentRequirement,
  createVendorFieldRequirement,
  deleteVendorDocumentRequirement,
  deleteVendorFieldRequirement,
  getVendorDocumentRequirements,
  getVendorFieldRequirements,
  updateVendorDocumentRequirement,
  updateVendorFieldRequirement,
  VendorDocumentRequirement,
  VendorFieldRequirement,
} from '../services/vendorService';

type Tab = 'documents' | 'fields';
type AppliesTo = 'ALL' | 'INDIVIDUAL' | 'BUSINESS';

const FIELD_KEY_OPTIONS = [
  'DATE_OF_BIRTH',
  'POSTAL_CODE',
  'BUSINESS_TYPE',
  'BUSINESS_REGISTRATION_NUMBER',
  'TAX_NUMBER',
  'BUSINESS_ADDRESS',
];

/**
 * Admin-controlled vendor onboarding collection:
 *  - Documents: upload slots (ID, proof of address, certs…)
 *  - Fields: profile/business inputs for Stripe-ready KYC (DOB, postcode, tax…)
 */
const VendorDocumentRequirements: React.FC = () => {
  const [tab, setTab] = useState<Tab>('documents');
  const [docs, setDocs] = useState<VendorDocumentRequirement[]>([]);
  const [fields, setFields] = useState<VendorFieldRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Document form
  const [newType, setNewType] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newAppliesTo, setNewAppliesTo] = useState<AppliesTo>('ALL');
  const [newDescription, setNewDescription] = useState('');

  // Field form
  const [newFieldKey, setNewFieldKey] = useState(FIELD_KEY_OPTIONS[0]);
  const [newFieldLabel, setNewFieldLabel] = useState('Date of birth');
  const [newFieldCountry, setNewFieldCountry] = useState('');
  const [newFieldAppliesTo, setNewFieldAppliesTo] = useState<AppliesTo>('ALL');
  const [newFieldDescription, setNewFieldDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, f] = await Promise.all([
        getVendorDocumentRequirements(),
        getVendorFieldRequirements(),
      ]);
      setDocs(d);
      setFields(f);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding requirements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scopeBadge = (appliesTo?: string) => {
    if (appliesTo === 'BUSINESS') return { text: 'Business signups', className: 'bg-blue-50 text-blue-700' };
    if (appliesTo === 'INDIVIDUAL') return { text: 'Individuals only', className: 'bg-amber-50 text-amber-700' };
    return { text: 'Everyone', className: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
          <FileCheck className="text-red-600" />
          Vendor Onboarding Collection
        </h2>
        <p className="text-gray-600 text-sm mt-1 font-medium">
          Switch on/off what vendors must provide — documents and Stripe-ready profile fields.
          Country blank = all markets.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('documents')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${
            tab === 'documents' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setTab('fields')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
            tab === 'fields' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <FormInput size={16} />
          Profile fields
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader className="animate-spin mr-2" />
          Loading...
        </div>
      ) : tab === 'documents' ? (
        <>
          <div className="glass-panel rounded-2xl border border-white/50 divide-y divide-white/40">
            {docs.map((item) => {
              const badge = scopeBadge(item.appliesTo);
              return (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.type}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {item.country || 'All countries'}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="text-xs text-gray-400 mt-1 max-w-xl">{item.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await updateVendorDocumentRequirement(item.id, { active: !item.active });
                          setDocs((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
                          );
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : 'Failed to update');
                        }
                      }}
                      className={`flex items-center gap-2 text-sm font-bold ${
                        item.active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {item.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      {item.active ? 'Required' : 'Off'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Remove "${item.label}"?`)) return;
                        try {
                          await deleteVendorDocumentRequirement(item.id);
                          setDocs((prev) => prev.filter((i) => i.id !== item.id));
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : 'Failed to delete');
                        }
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {docs.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No document requirements configured.</div>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-white/50 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">Add document requirement</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Type (e.g. PROOF_OF_INSURANCE)"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label shown to vendors"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="Country (blank = all, e.g. United Kingdom)"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
              <select
                value={newAppliesTo}
                onChange={(e) => setNewAppliesTo(e.target.value as AppliesTo)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
              >
                <option value="ALL">Everyone</option>
                <option value="INDIVIDUAL">Individuals only</option>
                <option value="BUSINESS">Business signups only</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Guidance under the upload slot (optional)"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
              <button
                onClick={async () => {
                  if (!newType.trim() || !newLabel.trim()) return;
                  setSaving(true);
                  try {
                    const created = await createVendorDocumentRequirement(
                      newType.trim().toUpperCase().replace(/\s+/g, '_'),
                      newLabel.trim(),
                      {
                        country: newCountry.trim() || null,
                        appliesTo: newAppliesTo,
                        description: newDescription.trim() || null,
                      }
                    );
                    setDocs((prev) => [...prev, created]);
                    setNewType('');
                    setNewLabel('');
                    setNewCountry('');
                    setNewAppliesTo('ALL');
                    setNewDescription('');
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Failed to create');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                Add
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="glass-panel rounded-2xl border border-white/50 divide-y divide-white/40">
            {fields.map((item) => {
              const badge = scopeBadge(item.appliesTo);
              return (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.key}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {item.country || 'All countries'}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="text-xs text-gray-400 mt-1 max-w-xl">{item.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await updateVendorFieldRequirement(item.id, { active: !item.active });
                          setFields((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
                          );
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : 'Failed to update');
                        }
                      }}
                      className={`flex items-center gap-2 text-sm font-bold ${
                        item.active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {item.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      {item.active ? 'Required' : 'Off'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Remove "${item.label}"?`)) return;
                        try {
                          await deleteVendorFieldRequirement(item.id);
                          setFields((prev) => prev.filter((i) => i.id !== item.id));
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : 'Failed to delete');
                        }
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {fields.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                No field requirements yet — defaults seed on first load from the API.
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-white/50 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">Add profile / business field</p>
            <p className="text-xs text-gray-500">
              These feed Stripe Connect prefill (DOB, postcode, company reg, tax…). Toggle Off to stop
              asking vendors for that field.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={newFieldKey}
                onChange={(e) => {
                  setNewFieldKey(e.target.value);
                  setNewFieldLabel(e.target.value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
              >
                {FIELD_KEY_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Label shown to vendors"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newFieldCountry}
                onChange={(e) => setNewFieldCountry(e.target.value)}
                placeholder="Country (blank = all, e.g. United Kingdom)"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
              <select
                value={newFieldAppliesTo}
                onChange={(e) => setNewFieldAppliesTo(e.target.value as AppliesTo)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
              >
                <option value="ALL">Everyone</option>
                <option value="INDIVIDUAL">Individuals only</option>
                <option value="BUSINESS">Business signups only</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newFieldDescription}
                onChange={(e) => setNewFieldDescription(e.target.value)}
                placeholder="Why we ask (optional)"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
              <button
                onClick={async () => {
                  if (!newFieldKey.trim() || !newFieldLabel.trim()) return;
                  setSaving(true);
                  try {
                    const created = await createVendorFieldRequirement(
                      newFieldKey.trim(),
                      newFieldLabel.trim(),
                      {
                        country: newFieldCountry.trim() || null,
                        appliesTo: newFieldAppliesTo,
                        description: newFieldDescription.trim() || null,
                      }
                    );
                    setFields((prev) => [...prev, created]);
                    setNewFieldDescription('');
                    setNewFieldCountry('');
                    setNewFieldAppliesTo('ALL');
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Failed to create');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorDocumentRequirements;
