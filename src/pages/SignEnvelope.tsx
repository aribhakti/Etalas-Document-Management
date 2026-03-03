import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, PenTool, Type, Calendar, Mail } from 'lucide-react';
import SignatureModal from '../components/SignatureModal';
import { useToast } from '../components/Toast';

export default function SignEnvelope() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [envelope, setEnvelope] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/envelopes/${id}`)
      .then(res => res.json())
      .then(data => {
        setEnvelope(data);
        setFields(data.fields || []);
        // Initialize field values if they exist
        const initialValues: Record<string, string> = {};
        data.fields?.forEach((f: any) => {
          if (f.value) initialValues[f.id] = f.value;
        });
        setFieldValues(initialValues);
      });
  }, [id]);

  const handleFieldClick = (field: any) => {
    if (field.type === 'signature' || field.type === 'initial') {
      setActiveFieldId(field.id);
      setIsSignatureModalOpen(true);
    } else {
      // For text fields, focus is handled by input element
    }
  };

  const handleSignatureSave = (signature: string) => {
    if (activeFieldId) {
      setFieldValues(prev => ({ ...prev, [activeFieldId]: signature }));
      setIsSignatureModalOpen(false);
      setActiveFieldId(null);
      showToast('Signature applied');
    }
  };

  const handleTextChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFinish = async () => {
    // 1. Save field values
    await fetch(`/api/envelopes/${id}/fields/values`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: fieldValues })
    });
    
    // 2. Update status
    await fetch(`/api/envelopes/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    showToast('Document signed successfully');
    navigate('/');
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this envelope?')) return;
    
    await fetch(`/api/envelopes/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'declined' })
    });
    showToast('Document declined', 'info');
    navigate('/');
  };

  if (!envelope) return <div className="p-8 text-center">Loading...</div>;

  const completedCount = Object.keys(fieldValues).length;
  const progress = Math.round((completedCount / fields.length) * 100) || 0;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{envelope.title}</h1>
          <p className="text-xs text-gray-500">Please review and sign the document</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 mb-1">{completedCount} of {fields.length} fields completed</p>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button 
            onClick={handleDecline}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors mr-2"
          >
            Decline
          </button>
          <button 
            onClick={handleFinish}
            disabled={completedCount < fields.length}
            className={`px-6 py-2 rounded-lg font-medium transition-colors shadow-sm
              ${completedCount === fields.length 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Finish
          </button>
        </div>
      </header>

      {/* Document Viewer */}
      <div className="flex-1 p-8 overflow-auto bg-gray-100">
        <div className="max-w-[800px] mx-auto bg-white shadow-lg min-h-[1000px] relative">
           {/* Document Content */}
           {envelope.documents && envelope.documents.length > 0 ? (
             <img 
               src={`/uploads/${envelope.documents[0].filename}`} 
               alt="Document" 
               className="w-full h-auto select-none pointer-events-none"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
               }}
             />
           ) : (
             <div className="w-full h-[1000px] flex items-center justify-center bg-gray-50 text-gray-400">
                <div className="text-center">
                  <FileText size={64} className="mx-auto mb-4 opacity-20" />
                  <p>Document Content</p>
                </div>
              </div>
           )}

            {/* Interactive Fields */}
            {fields.map((field) => {
              const value = fieldValues[field.id];
              const isCompleted = !!value;
              
              const commonStyle = {
                left: field.x, 
                top: field.y,
                minWidth: '120px',
                minHeight: '40px',
              };

              if (field.type === 'signature' || field.type === 'initial') {
                return (
                  <div
                    key={field.id}
                    onClick={() => handleFieldClick(field)}
                    className={`absolute cursor-pointer flex items-center justify-center border-2 rounded transition-all group
                      ${isCompleted 
                        ? 'bg-white border-emerald-500 text-emerald-700' 
                        : 'bg-yellow-50/80 border-yellow-400 text-yellow-700 hover:bg-yellow-100'}`}
                    style={{ ...commonStyle, padding: '4px' }}
                  >
                    {isCompleted ? (
                      <img src={value} alt="Signature" className="h-full object-contain" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <PenTool size={16} />
                        <span className="text-sm font-medium">{field.label}</span>
                      </div>
                    )}
                    {!isCompleted && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={field.id}
                  className={`absolute border-2 rounded transition-all bg-white
                    ${isCompleted ? 'border-emerald-500' : 'border-gray-300 focus-within:border-blue-500'}`}
                  style={commonStyle}
                >
                  <input
                    type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                    value={value || ''}
                    onChange={(e) => handleTextChange(field.id, e.target.value)}
                    placeholder={field.label}
                    className="w-full h-full px-2 py-1 bg-transparent focus:outline-none text-sm"
                  />
                </div>
              );
            })}
        </div>
      </div>

      <SignatureModal 
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />
    </div>
  );
}
