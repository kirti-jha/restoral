import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale, CheckCircle } from 'lucide-react';
import './InfoModal.css';

export default function LegalModal({ isOpen, onClose, initialTab = 'privacy' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="info-modal-container legal-modal-container animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="info-modal-header">
          <div className="info-legal-tabs">
            <button
              className={`legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <ShieldCheck size={16} /> Privacy Policy
            </button>
            <button
              className={`legal-tab ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => setActiveTab('terms')}
            >
              <FileText size={16} /> Terms of Service
            </button>
          </div>
        </div>

        <div className="info-modal-body legal-modal-body">
          {activeTab === 'privacy' ? (
            <div className="legal-content animate-fade-in">
              <h2 className="legal-heading">RestoralAI Pay-In Privacy Policy</h2>
              <p className="legal-date">Last Updated: August 2026 • Compliant with RBI Guidelines & Data Protection Norms</p>

              <section className="legal-section">
                <h3>1. Collection of Pay-In Data</h3>
                <p>
                  RestoralAI Technologies collects customer payment information solely for processing Pay-In transactions, UPI QR generation, Virtual Account reconciliation, and automated settlement payouts. This includes customer name, transaction amount, VPA/UPI ID, timestamp, and bank reference numbers.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Security & Encryption Standards</h3>
                <p>
                  All Pay-In payload data transmitted through RestoralAI APIs and webhooks is encrypted using 256-bit SSL encryption. Merchant API keys and transaction pins are stored using SHA-256 salted hashes. We do not store raw card numbers or confidential customer banking passwords.
                </p>
              </section>

              <section className="legal-section">
                <h3>3. Webhooks & Third-Party Integrations</h3>
                <p>
                  Pay-In transaction status callbacks are delivered directly to the merchant's configured webhook endpoint. Webhook payloads contain verified signatures to ensure payload integrity and prevent tamper/replay attacks.
                </p>
              </section>

              <section className="legal-section">
                <h3>4. Data Retention</h3>
                <p>
                  Financial transaction logs and account ledgers are retained in compliance with Reserve Bank of India (RBI) and Prevention of Money Laundering Act (PMLA) regulations for audited financial reporting.
                </p>
              </section>
            </div>
          ) : (
            <div className="legal-content animate-fade-in">
              <h2 className="legal-heading">RestoralAI Pay-In Merchant Terms of Service</h2>
              <p className="legal-date">Last Updated: August 2026 • Pay-In Merchant Agreement</p>

              <section className="legal-section">
                <h3>1. Pay-In Services & MDR Rates</h3>
                <p>
                  By utilizing RestoralAI Pay-In services, merchants agree to the applicable Merchant Discount Rates (MDR) and commission slab structures assigned to their account level (Admin, Super, Distributor, Retailer). Pay-In fees are deducted automatically upon successful transaction clearance.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Settlement Timelines</h3>
                <p>
                  Successful Pay-In funds are credited to the merchant's RestoralAI wallet instantaneously. Bank wallet-to-bank settlements are processed according to the chosen settlement schedule (Instant T+0 or Daily T+1).
                </p>
              </section>

              <section className="legal-section">
                <h3>3. Prohibited Transactions</h3>
                <p>
                  Merchants are strictly prohibited from using RestoralAI Pay-In solutions for illegal activities, unauthorized gambling, fraudulent collection schemes, or unauthorized third-party fund collection. Accounts violating PMLA or RBI norms will face immediate suspension.
                </p>
              </section>

              <section className="legal-section">
                <h3>4. Webhook Reliability & Downtime</h3>
                <p>
                  While RestoralAI guarantees a 99.99% Pay-In system uptime SLA, merchants are required to implement idempotent webhook handlers to gracefully process retry notifications.
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="info-modal-footer">
          <button className="info-btn-primary" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </div>
  );
}
