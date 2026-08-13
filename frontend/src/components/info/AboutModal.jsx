import React from 'react';
import { X, Sparkles, ShieldCheck, Zap, TrendingUp, Building2, Users, Award } from 'lucide-react';
import './InfoModal.css';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="info-modal-container animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="info-modal-header">
          <div className="info-badge">
            <Sparkles size={16} className="text-brand" /> About RestoralAI
          </div>
          <h2 className="info-title">Powering Next-Gen Pay-In & Payment Solutions</h2>
          <p className="info-subtitle">Building India's fastest, most reliable financial collection infrastructure for merchants and businesses.</p>
        </div>

        <div className="info-modal-body">
          <div className="info-stats-grid">
            <div className="info-stat-card">
              <span className="stat-num">99.99%</span>
              <span className="stat-desc">Pay-In Uptime SLA</span>
            </div>
            <div className="info-stat-card">
              <span className="stat-num">10,000+</span>
              <span className="stat-desc">Active Merchants</span>
            </div>
            <div className="info-stat-card">
              <span className="stat-num">₹500Cr+</span>
              <span className="stat-desc">Monthly Pay-In Volume</span>
            </div>
          </div>

          <div className="info-section">
            <h3 className="info-section-heading">Our Mission</h3>
            <p className="info-paragraph">
              RestoralAI Technologies provides enterprise-grade Pay-In and payment collection APIs designed to maximize conversion rates, automate customer settlements, and streamline multi-tier merchant hierarchy commissions.
            </p>
          </div>

          <div className="info-features-grid">
            <div className="info-feature-box">
              <div className="feature-icon-wrapper"><Zap size={20} /></div>
              <h4>Sub-Second Collections</h4>
              <p>Instant UPI QR generation and real-time webhook callback notifications within 300ms.</p>
            </div>
            <div className="info-feature-box">
              <div className="feature-icon-wrapper"><ShieldCheck size={20} /></div>
              <h4>Bank-Grade Security</h4>
              <p>PCI-DSS compliant 256-bit SSL encryption with automated AI fraud detection.</p>
            </div>
            <div className="info-feature-box">
              <div className="feature-icon-wrapper"><Building2 size={20} /></div>
              <h4>Direct Bank Routing</h4>
              <p>Multi-bank redundant routing ensuring maximum transaction success rates across India.</p>
            </div>
            <div className="info-feature-box">
              <div className="feature-icon-wrapper"><Users size={20} /></div>
              <h4>Merchant Hierarchy</h4>
              <p>Complete role-based management for Super Distributors, Distributors, and Retailers.</p>
            </div>
          </div>
        </div>

        <div className="info-modal-footer">
          <button className="info-btn-primary" onClick={onClose}>Close Overview</button>
        </div>
      </div>
    </div>
  );
}
