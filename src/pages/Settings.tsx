import React from 'react';
import { User, Lock, Bell, Shield } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { showToast } = useToast();

  const handleSave = () => {
    showToast('Settings saved successfully');
  };

  const handleUpdatePassword = () => {
    showToast('Password update link sent to email', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User size={20} className="text-gray-400" />
            Personal Profile
          </h2>
          <button 
            onClick={handleSave}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Save Changes
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold">
              DU
            </div>
            <div>
              <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Change Photo</button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" defaultValue="Demo User" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" defaultValue="demo@etalas.com" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield size={20} className="text-gray-400" />
            Security
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" onChange={() => showToast('2FA settings updated')} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-500">Update your password regularly</p>
            </div>
            <button 
              onClick={handleUpdatePassword}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
