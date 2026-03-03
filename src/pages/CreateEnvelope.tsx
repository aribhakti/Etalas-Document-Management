import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, UserPlus, FileText, Send, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import DocumentEditor from '../components/DocumentEditor';
import { useToast } from '../components/Toast';

export default function CreateEnvelope() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [envelopeId, setEnvelopeId] = useState<number | null>(null);
  const [file, setFile] = useState<File | string | null>(null);
  const [recipients, setRecipients] = useState<{ id?: number; email: string; name: string; role: string }[]>([{ email: '', name: '', role: 'signer' }]);
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    const envId = searchParams.get('envelopeId');
    const stepParam = searchParams.get('step');
    
    if (envId) {
      setEnvelopeId(Number(envId));
      fetch(`/api/envelopes/${envId}`)
        .then(res => res.json())
        .then(data => {
          if (data.documents && data.documents.length > 0) {
            setFile(`/uploads/${data.documents[0].filename}`);
          }
          let loadedRecipients: any[] = [];
          if (data.recipients && data.recipients.length > 0) {
            // Filter out empty recipients if any (from template copy)
            const validRecipients = data.recipients.map((r: any) => ({
              id: r.id,
              email: r.email || '',
              name: r.name || '',
              role: r.role || 'signer'
            }));
            if (validRecipients.length > 0) {
              setRecipients(validRecipients);
              loadedRecipients = validRecipients;
            }
          }
          if (data.fields) {
            // Map DB recipient_id to UI index
            const mappedFields = data.fields.map((f: any) => {
              const recipientIndex = loadedRecipients.findIndex(r => r.id === f.recipient_id);
              return {
                ...f,
                recipientId: recipientIndex >= 0 ? recipientIndex : 0
              };
            });
            setFields(mappedFields);
          }
        });
    }

    if (stepParam) {
      setStep(Number(stepParam));
    }
  }, [searchParams]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create envelope draft
      const res = await fetch('/api/envelopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selectedFile.name })
      });
      const data = await res.json();
      setEnvelopeId(data.id);

      // Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);
      await fetch(`/api/envelopes/${data.id}/documents`, {
        method: 'POST',
        body: formData
      });

      setStep(2);
      showToast('Document uploaded successfully');
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { email: '', name: '', role: 'signer' }]);
  };

  const updateRecipient = (index: number, field: string, value: string) => {
    const newRecipients = [...recipients];
    // @ts-ignore
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    setRecipients(newRecipients);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const saveRecipients = async () => {
    if (!envelopeId) return;
    
    // Save recipients to backend
    // We need to update the state with the IDs returned from backend if they are new
    // But for simplicity in this prototype, we'll just refetch or rely on the fact that
    // we don't need the IDs immediately for the next step (DocumentEditor uses indices).
    // However, for saving fields later, we DO need the IDs.
    
    const updatedRecipients = [...recipients];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      if (recipient.email) {
        if (recipient.id) {
          // Update existing recipient
          await fetch(`/api/envelopes/${envelopeId}/recipients/${recipient.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipient)
          });
        } else {
          // Create new recipient
          const res = await fetch(`/api/envelopes/${envelopeId}/recipients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipient)
          });
          const data = await res.json();
          updatedRecipients[i].id = data.id;
        }
      }
    }
    setRecipients(updatedRecipients);
    setStep(3);
    showToast('Recipients saved');
  };

  const handleSend = async (asTemplate = false) => {
    if (!envelopeId) return;

    // Map UI index back to DB recipient_id
    // Also ensure document_id is set (we assume 1st doc for now)
    // We need to fetch the document ID first or assume it from loaded data.
    // For this prototype, let's fetch the envelope to get doc ID if we don't have it.
    // Or better, just fetch documents list.
    
    const docRes = await fetch(`/api/envelopes/${envelopeId}`);
    const docData = await docRes.json();
    const documentId = docData.documents?.[0]?.id;

    if (!documentId) {
      showToast('Error: No document found', 'error');
      return;
    }

    const fieldsToSave = fields.map(f => ({
      ...f,
      recipient_id: recipients[f.recipientId]?.id,
      document_id: documentId
    }));

    // Save fields
    await fetch(`/api/envelopes/${envelopeId}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fieldsToSave })
    });

    // Update status
    await fetch(`/api/envelopes/${envelopeId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: asTemplate ? 'template' : 'pending' })
    });

    showToast(asTemplate ? 'Template saved successfully' : 'Envelope sent successfully');
    navigate(asTemplate ? '/templates' : '/');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= s ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <Upload size={40} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Document</h2>
          <p className="text-gray-500 mb-8">Drag and drop your file here, or click to browse</p>
          <label className="inline-block">
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.png,.jpg" />
            <span className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium cursor-pointer hover:bg-emerald-600 transition-colors">
              Choose File
            </span>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Recipients</h2>
          <div className="space-y-4">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Full Name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={recipient.role}
                    onChange={(e) => updateRecipient(index, 'role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="signer">Signer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                {recipients.length > 1 && (
                  <button onClick={() => removeRecipient(index)} className="mt-7 text-gray-400 hover:text-red-500">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addRecipient} className="mt-4 flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700">
            <UserPlus size={18} /> Add Recipient
          </button>
          
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Back</button>
            <button onClick={saveRecipients} className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="h-[calc(100vh-200px)]">
          <DocumentEditor 
            file={file} 
            recipients={recipients} 
            fields={fields} 
            setFields={setFields} 
            onSend={() => handleSend(false)}
            onSaveTemplate={() => handleSend(true)}
            onBack={() => setStep(2)}
          />
        </div>
      )}
    </div>
  );
}
