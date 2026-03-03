import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Reports() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center">Loading...</div>;

  // Process activity data for chart
  const activityData = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    
    const sentCount = stats.activity.find((a: any) => a.date === dateStr && a.action === 'sent')?.count || 0;
    const completedCount = stats.activity.find((a: any) => a.date === dateStr && a.action === 'completed')?.count || 0;
    
    activityData.push({
      name: dayName,
      sent: sentCount,
      completed: completedCount
    });
  }

  const pieData = [
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Declined', value: stats.declined, color: '#ef4444' },
    { name: 'Draft', value: stats.draft, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Overview of your document activity and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Envelopes</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Completion Rate</h3>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Of total envelopes</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting signature</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Declined</h3>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <XCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.declined}</p>
          <p className="text-xs text-gray-500 mt-1">Rejected by signer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Activity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Envelope Status</h3>
          <div className="h-80 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-center">
                <p>No data available yet</p>
                <p className="text-sm mt-2">Create and send envelopes to see stats</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
