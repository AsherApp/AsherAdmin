import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Wallet } from 'lucide-react';
import FinancialReports from './FinancialReports';
import PlatformFinance from './PlatformFinance';

type FinanceTab = 'summary' | 'payments';

const FinanceSection: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab: FinanceTab = params.get('tab') === 'payments' ? 'payments' : 'summary';

  const tabs: { id: FinanceTab; label: string; icon: React.ElementType }[] = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
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
      {tab === 'summary' ? <FinancialReports /> : <PlatformFinance />}
    </div>
  );
};

export default FinanceSection;
