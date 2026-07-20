/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Segnala from './pages/Segnala';
import Mappa from './pages/Mappa';
import MiaArea from './pages/MiaArea';
import Guida from './pages/Guida';
import Faq from './pages/Faq';
import Operatori from './pages/Operatori';
import Config from './pages/admin/Config';
import AdminLogin from './pages/admin/Login';
import SetupWizard from './pages/admin/SetupWizard';
import AdminRoute from './components/AdminRoute';
import DebugDb from './pages/DebugDb';
import { PrivacyPolicy, Accessibilita, CookiePolicy } from './pages/Compliance';
import StatisticheCatasto from './pages/StatisticheCatasto';
import AssistenteAI from './pages/AssistenteAI';

import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { LanguageProvider } from './contexts/LanguageContext';
import BottomNavigation from './components/layout/BottomNavigation';
import CookieBanner from './components/CookieBanner';
import GlobalPopupModal from './components/GlobalPopupModal';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function FirstRunRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isConfigured = localStorage.getItem('animalhub_configured');
    // Exempt setup and essential compliance pages from auto-redirect to avoid infinite loops or blocking legal documents
    const exemptPaths = ['/admin/setup', '/privacy-policy', '/cookie-policy', '/accessibilita'];
    if (!isConfigured && !exemptPaths.includes(location.pathname)) {
      navigate('/admin/setup');
    }
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  useEffect(() => {
    const initComuniCache = async () => {
      try {
        const res = await fetch('/api/comuni');
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              localStorage.setItem('cached_comuni', JSON.stringify(data));
            }
          }
        }
      } catch (e) {
        console.error("Errore nel recupero dinamico dei comuni:", e);
      }
    };
    initComuniCache();
  }, []);

  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <Router>
          <ScrollToTop />
          <FirstRunRedirector />
          <div className="flex flex-col min-h-screen bg-gray-50 font-sans selection:bg-[#15803d]/30 selection:text-[#1e3a5f] pb-16 md:pb-0">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/segnala" element={<Segnala />} />
                <Route path="/mappa" element={<Mappa />} />
                <Route path="/mia-area" element={<MiaArea />} />
                <Route path="/guida" element={<Guida />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/setup" element={<SetupWizard />} />
                <Route path="/operatori" element={<AdminRoute><Operatori /></AdminRoute>} />
                <Route path="/admin/config" element={<AdminRoute><Config /></AdminRoute>} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/accessibilita" element={<Accessibilita />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/statistiche-catasto" element={<StatisticheCatasto />} />
                <Route path="/debug-db" element={<DebugDb />} />
                <Route path="/assistente-ai" element={<AssistenteAI />} />
              </Routes>
            </main>
            <BottomNavigation />
            <Footer />
            <CookieBanner />
            <GlobalPopupModal />
          </div>
        </Router>
      </AccessibilityProvider>
    </LanguageProvider>
  );
}

