import React, { useCallback, useEffect, useState } from 'react';
import { FileCheck, Loader, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  createVendorDocumentRequirement,
  deleteVendorDocumentRequirement,
  getVendorDocumentRequirements,
  updateVendorDocumentRequirement,
  VendorDocumentRequirement,
} from '../services/vendorService';

// Admin-controlled config for which document types a vendor must submit at
// onboarding (Part 1 of VENDOR_APP_FLOW_SPEC.md) - the Vendor app reads the
// active list dynamically instead of a hardcoded pair.
const VendorDocumentRequirements: React.FC = () => {
  const [items, setItems] = useState<VendorDocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newType, setNewType] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getVendorDocumentRequirements());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load document requirements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleActive = async (item: VendorDocumentRequirement) => {
    try {
      await updateVendorDocumentRequirement(item.id, { active: !item.active });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update requirement');
    }
  };

  const handleDelete = async (item: VendorDocumentRequirement) => {
    if (!window.confirm(`Remove "${item.label}" from vendor onboarding requirements?`)) return;
    try {
      await deleteVendorDocumentRequirement(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete requirement');
    }
  };

  const handleAdd = async () => {
    if (!newType.trim() || !newLabel.trim()) return;
    setSaving(true);
    try {
      const created = await createVendorDocumentRequirement(
        newType.trim().toUpperCase().replace(/\s+/g, '_'),
        newLabel.trim()
      );
      setItems((prev) => [...prev, created]);
      setNewType('');
      setNewLabel('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create requirement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
          <FileCheck className="text-red-600" />
          Vendor Document Requirements
        </h2>
        <p className="text-gray-600 text-sm mt-1 font-medium">
          Control which document types the Vendor app asks for during onboarding.
        </p>
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
      ) : (
        <div className="glass-panel rounded-2xl border border-white/50 divide-y divide-white/40">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void handleToggleActive(item)}
                  className={`flex items-center gap-2 text-sm font-bold ${item.active ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {item.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  {item.active ? 'Required' : 'Off'}
                </button>
                <button
                  onClick={() => void handleDelete(item)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No document requirements configured.</div>
          )}
        </div>
      )}

      <div className="glass-panel rounded-2xl border border-white/50 p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          placeholder="Type (e.g. PROOF_OF_INSURANCE)"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label shown to vendors (e.g. Proof of Insurance)"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50"
        >
          {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
          Add
        </button>
      </div>
    </div>
  );
};

export default VendorDocumentRequirements;
