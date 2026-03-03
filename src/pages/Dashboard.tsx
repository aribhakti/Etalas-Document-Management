import React, { useEffect, useState } from 'react';
import { Plus, FileText, Clock, CheckCircle, XCircle, MoreVertical, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [envelopes, setEnvelopes] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/envelopes')
      .then(res => res.json())
      .then(data => setEnvelopes(data));

    fetch('/api/activity')
      .then(res => res.json())
      .then(data => setActivity(data));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEnvelopes = envelopes.filter(env => {
    const matchesFilter = filter === 'all' || env.status === filter;
    const matchesSearch = env.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex gap-8 h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back, Demo User</p>
          </div>
          <div className="flex gap-3">
            <Link to="/templates" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Use Template
            </Link>
            <Link to="/create" className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2">
              <Plus size={18} />
              New Envelope
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            {['all', 'pending', 'completed', 'draft'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search envelopes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-medium text-gray-500 text-sm">Document</th>
                  <th className="px-6 py-4 font-medium text-gray-500 text-sm">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-500 text-sm">Last Updated</th>
                  <th className="px-6 py-4 font-medium text-gray-500 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnvelopes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={48} className="text-gray-200 mb-4" />
                        <p className="font-medium text-gray-900">No envelopes found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or create a new envelope.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEnvelopes.map((env) => (
                    <tr key={env.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                            <FileText size={20} />
                          </div>
                          <div>
                            <Link to={`/envelopes/${env.id}`} className="font-medium text-gray-900 hover:text-emerald-600 transition-colors">
                              {env.title}
                            </Link>
                            <p className="text-xs text-gray-500">ID: #{env.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(env.status)}`}>
                          {env.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(env.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/envelopes/${env.id}`} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full inline-block">
                          <MoreVertical size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Sidebar */}
      <div className="w-80 hidden xl:flex flex-col gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-6 overflow-y-auto pr-2 flex-1">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="flex gap-3 relative pb-6 last:pb-0">
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-100 last:hidden"></div>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10 border-2 border-white shadow-sm
                    ${item.action === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                      item.action === 'declined' ? 'bg-red-100 text-red-600' : 
                      item.action === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {item.action === 'completed' ? <CheckCircle size={14} /> :
                     item.action === 'declined' ? <XCircle size={14} /> :
                     item.action === 'sent' ? <Clock size={14} /> : <FileText size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <span className="capitalize">{item.action.replace('_', ' ')}</span>
                      <span className="text-gray-500 font-normal"> - Envelope #{item.envelope_id}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
