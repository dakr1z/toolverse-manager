import React, { useMemo } from 'react';
import { Tool, ToolStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, Activity, Archive, Zap } from 'lucide-react';

interface DashboardProps {
  tools: Tool[];
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center">
    <div className={`p-4 rounded-full ${color} text-white mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ tools }) => {
  const stats = useMemo(() => {
    let monthlyCost = 0;
    let activeSubs = 0;
    
    tools.forEach(t => {
      if (t.hasSubscription && t.status === ToolStatus.ACTIVE) {
        activeSubs++;
        if (t.billingCycle === 'Monatlich') monthlyCost += t.price;
        if (t.billingCycle === 'Jährlich') monthlyCost += (t.price / 12);
      }
    });

    return {
      monthlyCost: monthlyCost.toFixed(2),
      activeSubs,
      totalTools: tools.length,
      testing: tools.filter(t => t.status === ToolStatus.TESTING).length
    };
  }, [tools]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tools.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [tools]);
  
  const statusData = useMemo(() => {
     const counts: Record<string, number> = {};
    tools.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  }, [tools]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Willkommen zurück!</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ø Monatliche Kosten" 
          value={`€${stats.monthlyCost}`} 
          icon={<DollarSign size={24} />} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Aktive Abos" 
          value={stats.activeSubs.toString()} 
          icon={<Zap size={24} />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Gesamte Tools" 
          value={stats.totalTools.toString()} 
          icon={<Archive size={24} />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Im Test" 
          value={stats.testing.toString()} 
          icon={<Activity size={24} />} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Kategorien Verteilung</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {categoryData.map((entry, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Status Bar Chart */}
        <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Status Übersicht</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent / Quick List */}
      <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
         <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Letzte Änderungen</h3>
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
               <tr>
                 <th className="px-6 py-3">Tool</th>
                 <th className="px-6 py-3">Kategorie</th>
                 <th className="px-6 py-3">Status</th>
                 <th className="px-6 py-3">Kosten</th>
               </tr>
             </thead>
             <tbody>
               {tools.slice(0, 5).map(tool => (
                 <tr key={tool.id} className="bg-white border-b dark:bg-card dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                   <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{tool.name}</td>
                   <td className="px-6 py-4">{tool.category}</td>
                   <td className="px-6 py-4">{tool.status}</td>
                   <td className="px-6 py-4">
                     {tool.hasSubscription ? `${tool.price} ${tool.currency}` : '-'}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;