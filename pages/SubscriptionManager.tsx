import React from 'react';
import { Tool, ToolStatus } from '../types';
import { AlertCircle, Calendar } from 'lucide-react';

interface SubscriptionManagerProps {
  tools: Tool[];
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ tools }) => {
  const subscriptions = tools.filter(t => t.hasSubscription);
  const totalMonthly = subscriptions
    .filter(t => t.status === ToolStatus.ACTIVE)
    .reduce((acc, t) => acc + (t.billingCycle === 'Jährlich' ? t.price / 12 : t.price), 0);

  const sortedByDate = [...subscriptions].sort((a, b) => {
    if (!a.renewalDate) return 1;
    if (!b.renewalDate) return -1;
    return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
  });

  return (
    <div className="space-y-8">
       <div className="bg-gradient-to-r from-secondary to-primary p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-center">
         <div>
           <h2 className="text-2xl font-bold mb-2">Monatliche Fixkosten</h2>
           <p className="opacity-90">Basierend auf aktiven Abos (Jahreszahlungen anteilig).</p>
         </div>
         <div className="text-4xl font-bold mt-4 md:mt-0">
           €{totalMonthly.toFixed(2)}<span className="text-lg opacity-70">/mo</span>
         </div>
       </div>

       <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Anstehende Zahlungen</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Datum</th>
                <th className="px-6 py-3">Tool</th>
                <th className="px-6 py-3">Zyklus</th>
                <th className="px-6 py-3">Betrag</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedByDate.map(sub => {
                const daysUntil = sub.renewalDate 
                  ? Math.ceil((new Date(sub.renewalDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                  : null;
                
                const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;

                return (
                  <tr key={sub.id} className="bg-white border-b dark:bg-card dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                     <td className="px-6 py-4 flex items-center">
                       {sub.renewalDate || 'N/A'}
                       {isUrgent && (
                         <span className="ml-2 text-red-500 animate-pulse" title="Verlängert sich bald!">
                           <AlertCircle size={16} />
                         </span>
                       )}
                     </td>
                     <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sub.name}</td>
                     <td className="px-6 py-4">{sub.billingCycle}</td>
                     <td className="px-6 py-4 font-bold">{sub.price} {sub.currency}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs border ${
                         sub.status === ToolStatus.ACTIVE ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-500'
                       }`}>
                         {sub.status}
                       </span>
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default SubscriptionManager;