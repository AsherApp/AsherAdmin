import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Wrench } from 'lucide-react';
import LandlordsSection from './LandlordsSection';
import VendorsSection from './VendorsSection';

type UsersTab = 'landlords' | 'vendors';

const UsersSection: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab: UsersTab = params.get('tab') === 'vendors' ? 'vendors' : 'landlords';

  const tabs: { id: UsersTab; label: string; icon: React.ElementType }[] = [
    { id: 'landlords', label: 'Landlords', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800">Users</h2>
        <p className="mt-1 text-sm font-medium text-gray-600">Landlords and vendors, including checks, storage, and the documents they must send.</p>
      </div>
      <div className="flex gap-2 bg-gray-100/70 p-1.5 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setParams({ tab: id })}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === id ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {tab === 'landlords' ? <LandlordsSection /> : <VendorsSection />}
    </div>
  );
};

export default UsersSection;
