import React, { useRef, useState, useEffect } from 'react';
import { X, Type, PenTool, Eraser } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
}

export default function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
      }
    }
  }, [isOpen, activeTab]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (activeTab === 'draw' && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    } else if (activeTab === 'type' && typedName) {
      // Create an image from text
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '48px "Dancing Script", cursive, serif'; // Fallback to serif if font not loaded
        ctx.fillStyle = '#000';
        ctx.fillText(typedName, 20, 60);
        onSave(canvas.toDataURL());
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create Signature</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors
                ${activeTab === 'draw' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <PenTool size={16} /> Draw
            </button>
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors
                ${activeTab === 'type' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Type size={16} /> Type
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 h-64 flex items-center justify-center relative overflow-hidden">
            {activeTab === 'draw' ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={256}
                  className="w-full h-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button 
                  onClick={clearCanvas}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-red-500"
                  title="Clear"
                >
                  <Eraser size={16} />
                </button>
              </>
            ) : (
              <div className="w-full px-8">
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your name"
                  className="w-full text-4xl text-center bg-transparent border-b-2 border-gray-300 focus:border-emerald-500 focus:outline-none py-2 font-serif italic"
                />
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-400 mt-2 text-center">
            By clicking Create, I agree that the signature will be the electronic representation of my signature.
          </p>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={activeTab === 'type' && !typedName}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
