import React, { useEffect, useState } from 'react';
import { FileText, Plus, Copy, Trash2, MoreVertical } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

interface Template {
  id: number;
  title: string;
  updated_at: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data));
  }, []);

  const handleUseTemplate = async (templateId: number) => {
    const res = await fetch(`/api/envelopes/from-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId })
    });
    const data = await res.json();
    showToast('Template loaded successfully');
    navigate(`/create?envelopeId=${data.id}&step=2`); // Go to recipients step
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500">Manage and use your reusable document templates</p>
        </div>
        <Link to="/create?type=template" className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 flex items-center gap-2">
          <Plus size={18} />
          Create Template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No templates yet</h3>
            <p className="text-gray-500 mt-1 mb-6">Save time by creating templates for frequently used documents.</p>
            <Link to="/create?type=template" className="text-emerald-600 font-medium hover:text-emerald-700">
              Create your first template
            </Link>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="h-40 bg-gray-100 flex items-center justify-center border-b border-gray-200 relative">
                <FileText size={48} className="text-gray-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button 
                    onClick={() => handleUseTemplate(template.id)}
                    className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-emerald-50"
                  >
                    Use Template
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{template.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Last updated: {new Date(template.updated_at).toLocaleDateString()}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
