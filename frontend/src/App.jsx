import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Commissions from './pages/Commissions';
import CommissionReport from './pages/CommissionReport';
import Wallet from './pages/Wallet';
import BankVerify from './pages/BankVerify';
import Payout from './pages/Payout';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import FundRequests from './pages/FundRequests';
import KycVerification from './pages/KycVerification';

function App() {
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const redirect = url.searchParams.get('redirect');

    if (!redirect) {
      return;
    }

    url.searchParams.delete('redirect');
    const nextUrl = new URL(redirect, window.location.origin);
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />
          
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/funds" element={<FundRequests />} />
            <Route path="/kyc-verification" element={<KycVerification />} />
            <Route path="/bank-verify" element={<BankVerify />} />
            <Route path="/payout" element={<Payout />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/commission-report" element={<CommissionReport />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
