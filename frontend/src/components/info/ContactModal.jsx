import React, { useState } from 'react';
import { X, Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import './InfoModal.css';

export default function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    volume: 'Below ₹10 Lakhs',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', phone: '', volume: 'Below ₹10 Lakhs', message: '' });
  };

  return (
    <div className="info-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="info-modal-container animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="info-modal-header">
          <div className="info-badge">
            <Mail size={16} className="text-brand" /> Contact Support & Sales
          </div>
          <h2 className="info-title">Get in Touch with RestoralAI Pay-In Team</h2>
          <p className="info-subtitle">Have questions about API integration, custom MDR rates, or merchant accounts?</p>
        </div>

        <div className="info-modal-body">
          {submitted ? (
            <div className="contact-success-state">
              <CheckCircle2 size={48} className="text-success" />
              <h3>Message Sent Successfully!</h3>
              <p>Thank you for reaching out. Our Pay-In account specialist will review your request and contact you within 2 business hours.</p>
              <button className="info-btn-primary mt-4" onClick={handleReset}>Send Another Message</button>
            </div>
          ) : (
            <div className="contact-grid">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Monthly Pay-In Volume</label>
                    <select
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      className="form-input form-select"
                    >
                      <option value="Below ₹10 Lakhs">Below ₹10 Lakhs</option>
                      <option value="₹10 Lakhs - ₹50 Lakhs">₹10 Lakhs - ₹50 Lakhs</option>
                      <option value="₹50 Lakhs - ₹2 Crores">₹50 Lakhs - ₹2 Crores</option>
                      <option value="Above ₹2 Crores">Above ₹2 Crores</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Message / Integration Inquiry *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us about your business model and pay-in requirements..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="form-input form-textarea"
                  ></textarea>
                </div>

                <button type="submit" className="info-btn-primary w-full" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Inquiry'} <Send size={16} />
                </button>
              </form>

              <div className="contact-info-panel">
                <div className="contact-card">
                  <Mail size={18} className="text-brand" />
                  <div>
                    <p className="card-label">Email Support</p>
                    <p className="card-val">support@restoralai.com</p>
                  </div>
                </div>

                <div className="contact-card">
                  <Phone size={18} className="text-brand" />
                  <div>
                    <p className="card-label">Helpline</p>
                    <p className="card-val">+91 (080) 4567-8900</p>
                  </div>
                </div>

                <div className="contact-card">
                  <Clock size={18} className="text-brand" />
                  <div>
                    <p className="card-label">Working Hours</p>
                    <p className="card-val">24/7 Priority Support</p>
                  </div>
                </div>

                <div className="contact-card">
                  <MapPin size={18} className="text-brand" />
                  <div>
                    <p className="card-label">Headquarters</p>
                    <p className="card-val">RestoralAI Technologies, Outer Ring Road, Bengaluru, KA 560103</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
