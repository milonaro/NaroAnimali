/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Segnala from './pages/Segnala';
import Mappa from './pages/Mappa';
import MiaArea from './pages/MiaArea';
import Guida from './pages/Guida';
import Operatori from './pages/Operatori';
import Config from './pages/admin/Config';
import AdminLogin from './pages/admin/Login';
import AdminRoute from './components/AdminRoute';
import DebugDb from './pages/DebugDb';
import { PrivacyPolicy, Accessibilita, CookiePolicy } from './pages/Compliance';

import { AccessibilityProvider } from './contexts/AccessibilityContext';
import ChatOverlay from './components/chat/ChatOverlay';
import BottomNavigation from './components/layout/BottomNavigation';
import CookieBanner from './components/CookieBanner';

export default function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans selection:bg-[#15803d]/30 selection:text-[#1e3a5f] pb-16 md:pb-0">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/segnala" element={<Segnala />} />
              <Route path="/mappa" element={<Mappa />} />
              <Route path="/mia-area" element={<MiaArea />} />
              <Route path="/guida" element={<Guida />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/operatori" element={<AdminRoute><Operatori /></AdminRoute>} />
              <Route path="/admin/config" element={<AdminRoute><Config /></AdminRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/accessibilita" element={<Accessibilita />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/debug-db" element={<DebugDb />} />
            </Routes>
          </main>
          <ChatOverlay />
          <BottomNavigation />
          <Footer />
          <CookieBanner />
        </div>
      </Router>
    </AccessibilityProvider>
  );
}

