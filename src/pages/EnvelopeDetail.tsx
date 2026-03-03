import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, Download, Send, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function EnvelopeDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [envelope, setEnvelope] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetch(`/api/envelopes/${id}`)
      .then(res => res.json())
      .then(data => setEnvelope(data));
  }, [id]);

  if (!envelope) return <div className="p-8 text-center">Loading...</div>;

  const handleDownload = () => {
    showToast('Download started');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
        <ChevronLeft size={18} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{envelope.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(envelope.status)}`}>
              {envelope.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">Created on {new Date(envelope.created_at).toLocaleDateString()} at {new Date(envelope.created_at).toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-3">
          {envelope.documents && envelope.documents.length > 0 && (
            <a 
              href={`/uploads/${envelope.documents[0].filename}`} 
              download 
              onClick={handleDownload}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download size={16} /> Download
            </a>
          )}
          {envelope.status === 'pending' && (
            <Link to={`/sign/${envelope.id}`} className="px-4 py-2 bg-emerald-500 rounded-lg text-sm font-medium text-white hover:bg-emerald-600 flex items-center gap-2">
              <FileText size={16} /> Sign Now
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {['summary', 'recipients', 'audit_log'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors
                ${activeTab === tab 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
        {activeTab === 'summary' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h3>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center border border-dashed border-gray-300 relative min-h-[600px] overflow-auto">
              {envelope.documents && envelope.documents.length > 0 ? (
                <div className="relative shadow-lg bg-white max-w-full">
                  <img 
                    src={`/uploads/${envelope.documents[0].filename}`} 
                    alt="Document" 
                    className="max-w-full h-auto select-none pointer-events-none"
                  />
                  {/* Render fields overlay */}
                  {envelope.fields?.map((field: any) => (
                    <div
                      key={field.id}
                      className="absolute flex items-center justify-center pointer-events-none"
                      style={{
                        left: field.x,
                        top: field.y,
                        minWidth: '120px',
                        minHeight: '40px',
                        padding: '4px',
                        zIndex: 10
                      }}
                    >
                      {field.value && (
                        (field.type === 'signature' || field.type === 'initial') ? (
                          <img src={field.value} alt="Signature" className="h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center px-2 text-sm font-medium text-gray-900 bg-white/50 border border-transparent rounded">
                            {field.value}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-medium text-gray-900">No documents attached</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recipients' && (
          <div className="divide-y divide-gray-100">
            {envelope.recipients?.map((recipient: any) => (
              <div key={recipient.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-medium">
                    {recipient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{recipient.name}</p>
                    <p className="text-sm text-gray-500">{recipient.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 capitalize">{recipient.role}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${recipient.status === 'signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {recipient.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audit_log' && (
          <div className="p-6">
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
              {envelope.audit_logs && envelope.audit_logs.length > 0 ? (
                envelope.audit_logs.map((log: any) => (
                  <div key={log.id} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white
                      ${log.action === 'completed' ? 'bg-emerald-500' : 
                        log.action === 'declined' ? 'bg-red-500' : 
                        log.action === 'sent' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                    </div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{log.action.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 pl-8">No audit logs available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
