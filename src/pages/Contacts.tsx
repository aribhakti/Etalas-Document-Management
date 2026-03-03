import React, { useEffect, useState } from 'react';
import { User, Mail, Search, MoreVertical, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Contact {
  name: string;
  email: string;
  role: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => setContacts(data));
  }, []);

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500">Manage your address book</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 flex items-center gap-2 shadow-sm">
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <User size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No contacts found</h3>
            <p className="text-gray-500 mt-1">Contacts will appear here once you send envelopes to them.</p>
          </div>
        ) : (
          filteredContacts.map((contact, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex items-start justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <Mail size={14} />
                    {contact.email}
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                    {contact.role}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
