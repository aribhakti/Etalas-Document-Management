/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateEnvelope from './pages/CreateEnvelope';
import EnvelopeDetail from './pages/EnvelopeDetail';
import SignEnvelope from './pages/SignEnvelope';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Contacts from './pages/Contacts';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route path="/sign/:id" element={<SignEnvelope />} />
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create" element={<CreateEnvelope />} />
                <Route path="/envelopes/:id" element={<EnvelopeDetail />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

