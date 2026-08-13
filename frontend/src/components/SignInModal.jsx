import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, Eye, EyeOff, X, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import './SignInModal.css';

export default function SignInModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      onClose();
      navigate('/dashboard');
    } else {
      setError(res.message || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-container animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-logo-badge">
            <span className="logo-sparkle-icon">
              <Sparkles size={20} />
            </span>
          </div>
          <h2 className="modal-title">Sign In to <span className="text-brand-accent">RestoralAI</span></h2>
          <p className="modal-subtitle">Access your AI dashboard, tools, and business suite</p>
        </div>

        {error && (
          <div className="modal-error-alert animate-shake">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                placeholder="admin@payoutpayin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex-between">
              <label className="form-label">Password</label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); setError('Use admin demo credentials below.'); }} className="form-forgot-link">
                Forgot password?
              </a>
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-signin-btn" disabled={loading}>
            {loading ? (
              <span className="flex-center gap-2">
                <span className="spinner-sm"></span> Authenticating...
              </span>
            ) : (
              <span className="flex-center gap-2">
                Sign In to Dashboard <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="quick-login-section">
          <div className="quick-login-header">
            <UserCheck size={14} className="text-brand-accent" />
            <span>Admin Credentials Quick-Fill</span>
          </div>
          <div className="quick-roles-single">
            <button
              type="button"
              className="quick-role-chip admin-chip full-width-chip"
              onClick={() => handleQuickLogin('admin@payoutpayin.com', 'admin123')}
            >
              <div className="chip-left">
                <span className="chip-role">ADMIN</span>
                <span className="chip-email">admin@payoutpayin.com</span>
              </div>
              <span className="chip-action">Auto-fill</span>
            </button>
          </div>
        </div>

        <div className="modal-footer-note">
          <ShieldCheck size={14} className="text-success" />
          <span>Secured with 256-bit encryption. Password: <strong>admin123</strong></span>
        </div>
      </div>
    </div>
  );
}
