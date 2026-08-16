import React, { useState } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import UserManagement from './UserManagement';
import IdentityVerificationReview from './IdentityVerificationReview';

type LandlordsTab = 'directory' | 'identity-verification';

// Groups the two landlord-facing admin pages that were previously separate
// top-level nav items ("User Directory" + "Identity Review") under one
// section, since UserManagement.tsx is landlord-only (getAllLandlords) and
// IdentityVerificationReview is the approve/reject queue for that same
// landlord population.
const LandlordsSection: React.FC = () => {
  const [tab, setTab] = useState<LandlordsTab>('directory');

  const tabs: { id: LandlordsTab; label: string; icon: React.ElementType }[] = [
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'identity-verification', label: 'Identity Verification', icon: ShieldCheck },
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

      {tab === 'directory' ? <UserManagement /> : <IdentityVerificationReview />}
    </div>
  );
};

export default LandlordsSection;
