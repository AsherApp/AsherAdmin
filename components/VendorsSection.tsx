import React, { useState } from 'react';
import { Wrench, ShieldCheck, FileCheck } from 'lucide-react';
import VendorManagement from './VendorManagement';
import VendorVerificationReview from './VendorVerificationReview';
import VendorDocumentRequirements from './VendorDocumentRequirements';

type VendorsTab = 'directory' | 'verification' | 'document-requirements';

// Groups the three vendor-facing admin pages that were previously separate
// top-level nav items ("Vendors" + "Vendor Verification" + "Vendor
// Onboarding") under one section: directory, the pending-approval queue,
// and the onboarding document-requirements config.
const VendorsSection: React.FC = () => {
  const [tab, setTab] = useState<VendorsTab>('directory');

  const tabs: { id: VendorsTab; label: string; icon: React.ElementType }[] = [
    { id: 'directory', label: 'Directory', icon: Wrench },
    { id: 'verification', label: 'Verification Queue', icon: ShieldCheck },
    { id: 'document-requirements', label: 'Document Requirements', icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100/70 p-1.5 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === id ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'directory' && <VendorManagement />}
      {tab === 'verification' && <VendorVerificationReview />}
      {tab === 'document-requirements' && <VendorDocumentRequirements />}
    </div>
  );
};

export default VendorsSection;
