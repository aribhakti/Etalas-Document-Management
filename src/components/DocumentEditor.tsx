import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { FileText, Type, Calendar, PenTool, Mail, Hash, CheckSquare, Send, ChevronLeft } from 'lucide-react';

interface Field {
  id: string;
  type: string;
  x: number;
  y: number;
  label: string;
  recipientId: number; // Index of recipient
}

interface DocumentEditorProps {
  file: File | string | null;
  recipients: any[];
  fields: any[];
  setFields: (fields: any[]) => void;
  onSend: () => void;
  onSaveTemplate: () => void;
  onBack: () => void;
}

const FIELD_TYPES = [
  { type: 'signature', label: 'Signature', icon: PenTool },
  { type: 'initial', label: 'Initial', icon: Type },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'text', label: 'Textbox', icon: FileText },
  { type: 'email', label: 'Email', icon: Mail },
];

export default function DocumentEditor({ file, recipients, fields, setFields, onSend, onSaveTemplate, onBack }: DocumentEditorProps) {
  const [selectedRecipient, setSelectedRecipient] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getFileUrl = () => {
    if (!file) return '';
    if (typeof file === 'string') return file;
    return URL.createObjectURL(file);
  };

  const getFileName = () => {
    if (!file) return '';
    if (typeof file === 'string') return file.split('/').pop();
    return file.name;
  };

  const addField = (type: string, label: string) => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label,
      x: 100, // Default position
      y: 100,
      recipientId: selectedRecipient,
      page: 1
    };
    setFields([...fields, newField]);
  };

  const updateFieldPosition = (id: string, x: number, y: number) => {
    setFields(fields.map(f => f.id === id ? { ...f, x, y } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  return (
    <div className="flex h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
      {/* Left Sidebar - Fields */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-500 mb-2">FIELDS FOR</label>
          <select 
            value={selectedRecipient} 
            onChange={(e) => setSelectedRecipient(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {recipients.map((r, i) => (
              <option key={i} value={i}>{r.name || r.email}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {FIELD_TYPES.map((field) => (
              <button
                key={field.type}
                onClick={() => addField(field.type, field.label)}
                className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
              >
                <field.icon size={18} className="text-gray-500" />
                {field.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button onClick={onBack} className="flex items-center justify-center gap-2 w-full text-gray-600 hover:text-gray-900 py-2 mb-2">
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 bg-gray-100 overflow-auto p-8 relative" ref={containerRef}>
        <div className="max-w-[800px] mx-auto bg-white shadow-lg min-h-[1000px] relative">
          {/* Document Preview */}
          {file ? (
            <img src={getFileUrl()} alt="Document" className="w-full h-auto" />
          ) : (
            <div className="w-full h-[1000px] flex items-center justify-center bg-gray-50 text-gray-400">
              <div className="text-center">
                <FileText size={64} className="mx-auto mb-4 opacity-20" />
                <p>Document Preview Placeholder</p>
                <p className="text-sm">(PDF rendering requires complex setup, using placeholder for prototype)</p>
                <p className="text-xs mt-2">{getFileName()}</p>
              </div>
            </div>
          )}

          {/* Fields Layer */}
          {fields.map((field) => (
            <motion.div
              key={field.id}
              drag
              dragMomentum={false}
              dragConstraints={containerRef}
              onDragEnd={(_, info) => {
                // Calculate position relative to container
                // This is a simplified version; in production, use getBoundingClientRect
                // For now, we just update state to simulate persistence
              }}
              initial={{ x: field.x, y: field.y }}
              className={`absolute cursor-move flex items-center gap-2 px-3 py-2 rounded border shadow-sm text-sm font-medium
                ${field.recipientId === 0 ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 
                  field.recipientId === 1 ? 'bg-blue-100 border-blue-300 text-blue-800' : 
                  'bg-purple-100 border-purple-300 text-purple-800'}`}
              style={{ top: 0, left: 0 }} // Position controlled by motion
            >
              {FIELD_TYPES.find(t => t.type === field.type)?.icon({ size: 14 })}
              {field.label}
              <button 
                onClick={() => removeField(field.id)}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Actions */}
      <div className="w-64 bg-white border-l border-gray-200 p-6 flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Recipients</span>
            <span className="font-medium">{recipients.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Fields</span>
            <span className="font-medium">{fields.length}</span>
          </div>
        </div>

        <button 
          onClick={onSend}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Send size={18} />
          Send Envelope
        </button>

        <button 
          onClick={onSaveTemplate}
          className="w-full mt-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <CheckSquare size={18} />
          Save as Template
        </button>
      </div>
    </div>
  );
}
