import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignInModal from '../components/SignInModal';
import AboutModal from '../components/info/AboutModal';
import ContactModal from '../components/info/ContactModal';
import LegalModal from '../components/info/LegalModal';
import {
  Sparkles,
  Check,
  Star,
  ArrowRight,
  QrCode,
  Link as LinkIcon,
  Building,
  Zap,
  BarChart3,
  ShieldCheck,
  Users,
  Smartphone,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Lock,
  Globe
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [legalTab, setLegalTab] = useState(null); // 'privacy' or 'terms' or null
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('login') === 'true' || window.location.pathname === '/login') {
      setIsSignInOpen(true);
    }
  }, []);

  const handleOpenSignIn = () => {
    setIsSignInOpen(true);
  };

  const pricingDiscount = {
    monthly: 1,
    quarterly: 0.83,
    six_month: 0.74,
    yearly: 0.65
  };

  const getPrice = (basePrice) => {
    const mult = pricingDiscount[billingCycle];
    const finalPrice = Math.round(basePrice * mult);
    return finalPrice.toLocaleString('en-IN');
  };

  const faqs = [
    {
      q: 'How does RestoralAI Pay-In collection work?',
      a: 'RestoralAI provides instant UPI QR codes, Virtual Accounts, and Payment Links. When a customer pays, our sub-second webhooks notify your server and credit your settlement wallet automatically.'
    },
    {
      q: 'How fast are Pay-In webhook notifications?',
      a: 'Our high-performance HTTP webhooks are delivered within 300ms of payment authorization with multi-retry fallback.'
    },
    {
      q: 'Can I manage multi-tier merchant networks?',
      a: 'Yes! RestoralAI features full hierarchy management for Super Distributors, Distributors, and Retailers with automatic MDR commission distribution.'
    },
    {
      q: 'What is the starting fee for Pay-In processing?',
      a: 'Our Basic Pay-In plan starts as low as ₹100/month with transparent MDR rates starting from 0.5% and zero setup fees.'
    },
    {
      q: 'Is RestoralAI compliant with RBI and PCI-DSS standards?',
      a: 'Yes, 100%. All pay-in communications use 256-bit SSL encryption, tokenized payloads, and strict RBI data localization compliance.'
    }
  ];

  return (
    <div className="landing-root">
      {/* HEADER / NAVIGATION */}
      <header className="landing-header">
        <nav className="header-container">
          <a href="/" className="brand-logo">
            <span className="logo-icon-box">
              <Sparkles size={18} className="text-white" />
            </span>
            <span className="brand-name">
              Restoral<span className="brand-highlight">AI</span>
            </span>
          </a>

          <div className="nav-links desktop-only">
            <a href="#tools" className="nav-link">Pay-In Solutions</a>
            <button onClick={() => setIsAboutOpen(true)} className="nav-link nav-button-link">About</button>
            <a href="#pricing" className="nav-link">Pricing</a>
            <button onClick={() => setIsContactOpen(true)} className="nav-link nav-button-link">Contact</button>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          <div className="nav-actions desktop-only">
            <button onClick={handleOpenSignIn} className="nav-signin-link">
              Sign in
            </button>
            <button onClick={handleOpenSignIn} className="nav-cta-btn">
              Start for ₹100
            </button>
          </div>

          <button
            className="mobile-menu-toggle mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="mobile-dropdown animate-fade-in">
            <a href="#tools" onClick={() => setMobileMenuOpen(false)}>Pay-In Solutions</a>
            <button onClick={() => { setMobileMenuOpen(false); setIsAboutOpen(true); }} className="mobile-nav-btn">About Us</button>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <button onClick={() => { setMobileMenuOpen(false); setIsContactOpen(true); }} className="mobile-nav-btn">Contact Us</button>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="mobile-actions">
              <button onClick={() => { setMobileMenuOpen(false); handleOpenSignIn(); }} className="nav-cta-btn w-full">
                Sign in / Start for ₹100
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-bg-glow"></div>
        <div className="container hero-content">
          <div className="hero-badge animate-fade-up">
            <Sparkles size={14} className="badge-sparkle-icon" />
            <span>India's Premier Pay-In & Collection Gateway</span>
          </div>

          <h1 className="hero-title animate-fade-up">
            Instant Pay-In Solutions That<br />
            <span className="text-gradient">Grow Your Business</span>
          </h1>

          <p className="hero-subtitle animate-fade-up">
            Accept UPI, QR Code, Virtual Accounts & Card Pay-Ins with 99.99% success rate, instant webhooks, and zero hidden fees. Starting at just ₹100/month.
          </p>

          <div className="hero-actions animate-fade-up">
            <button onClick={handleOpenSignIn} className="hero-primary-btn">
              <span>Start for ₹100/month</span>
              <ArrowRight size={18} />
            </button>
            <a href="#pricing" className="hero-secondary-btn">
              View Plans
            </a>
          </div>

          <div className="hero-trust-list animate-fade-up">
            <span className="trust-item"><Check size={14} className="text-brand" /> Instant Settlement</span>
            <span className="trust-item"><Check size={14} className="text-brand" /> Real-time Webhooks</span>
            <span className="trust-item"><Check size={14} className="text-brand" /> 99.99% Uptime SLA</span>
            <span className="trust-item"><Check size={14} className="text-brand" /> Trusted by 10,000+ Merchants</span>
          </div>

          <div className="hero-rating-box animate-fade-up">
            <div className="star-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} className="star-filled" />
              ))}
            </div>
            <span className="rating-text">4.9/5 from 500+ merchant reviews</span>
          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE DASHBOARD PREVIEW CARD */}
      <section className="preview-section">
        <div className="container">
          <div className="window-card animate-fade-up">
            <div className="window-bar">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
              <div className="window-search-bar">restoralai.com/payin-dashboard</div>
            </div>

            <div className="window-body">
              {/* Stats Row */}
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Pay-In Volume</p>
                  <p className="stat-value">₹24.8L</p>
                  <p className="stat-change">+18% this month</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Successful Collections</p>
                  <p className="stat-value">1,420</p>
                  <p className="stat-change">99.8% Success Rate</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Active QR Terminals</p>
                  <p className="stat-value">340</p>
                  <p className="stat-change">+42 new this week</p>
                </div>
              </div>

              {/* Activity & Credits Grid */}
              <div className="preview-details-grid">
                <div className="activity-card">
                  <p className="card-mini-title">Live Pay-In Ticker</p>
                  <ul className="activity-list">
                    <li className="activity-item">
                      <span>💳 Dynamic UPI QR Pay-In Received (₹1,500)</span>
                      <span className="activity-time">Just now</span>
                    </li>
                    <li className="activity-item">
                      <span>🔗 Payment Link Settled (₹4,200)</span>
                      <span className="activity-time">2m ago</span>
                    </li>
                    <li className="activity-item">
                      <span>🏛️ Virtual Bank Collection Cleared (₹12,000)</span>
                      <span className="activity-time">5m ago</span>
                    </li>
                  </ul>
                </div>

                <div className="credits-card">
                  <p className="card-mini-title">Pay-In Channel Share</p>
                  <div className="progress-group">
                    <div className="progress-header">
                      <span>UPI & Dynamic QR</span>
                      <span>78%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div className="progress-group">
                    <div className="progress-header">
                      <span>Virtual Bank Accounts</span>
                      <span>15%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  <div className="progress-group">
                    <div className="progress-header">
                      <span>Payment Links & Cards</span>
                      <span>7%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: '7%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAY-IN SOLUTIONS SECTION */}
      <section id="tools" className="tools-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow-pill">Pay-In Solutions</span>
            <h2 className="section-title">Everything your collection system needs</h2>
            <p className="section-desc">A complete suite of payment collection tools to power your business pay-in infrastructure.</p>
          </div>

          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon-wrapper"><QrCode size={22} /></div>
              <h3 className="tool-name">Dynamic QR Pay-In</h3>
              <p className="tool-desc">Generate real-time UPI QR codes with exact order amounts for instant customer payment validation.</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon-wrapper"><LinkIcon size={22} /></div>
              <h3 className="tool-name">Pay-In Payment Links</h3>
              <p className="tool-desc">Send branded collection links via WhatsApp, SMS, or Email to receive payments from customers instantly.</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon-wrapper"><Building size={22} /></div>
              <h3 className="tool-name">Virtual Bank Accounts</h3>
              <p className="tool-desc">Provide dedicated NEFT/IMPS/RTGS bank account numbers for automated high-value customer collections.</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon-wrapper"><Zap size={22} /></div>
              <h3 className="tool-name">Sub-Second Webhooks</h3>
              <p className="tool-desc">Instant HTTP callback notifications delivered to your server within 300ms on every successful pay-in.</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon-wrapper"><BarChart3 size={22} /></div>
              <h3 className="tool-name">Pay-In Analytics</h3>
              <p className="tool-desc">Real-time conversion tracking, MDR fee breakdowns, daily collection logs, and settlement insights.</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon-wrapper"><ShieldCheck size={22} /></div>
              <h3 className="tool-name">Bank-grade Security</h3>
              <p className="tool-desc">PCI-DSS compliant 256-bit encryption with AI fraud prevention & automated transaction verification.</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon-wrapper"><Users size={22} /></div>
              <h3 className="tool-name">Merchant Hierarchy</h3>
              <p className="tool-desc">Configure commission slabs for Super Distributors, Distributors, and Retailers with auto-settlement.</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon-wrapper"><Smartphone size={22} /></div>
              <h3 className="tool-name">Mobile Pay-In POS</h3>
              <p className="tool-desc">Accept collections on the go using any mobile phone with zero additional hardware setup cost.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE SECTION */}
      <section id="audience" className="audience-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow-pill">Who It's For</span>
            <h2 className="section-title">Built for modern merchants</h2>
          </div>

          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-icon"><Sparkles size={24} /></div>
              <h3>Retail Merchants</h3>
              <p>Accept instant UPI pay-ins at checkout counters with dynamic QR codes and instant audio alerts.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon"><Globe size={24} /></div>
              <h3>E-Commerce Platforms</h3>
              <p>Integrate seamless pay-in checkout APIs and webhooks for sub-second order status updates.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon"><Users size={24} /></div>
              <h3>Distributors & Networks</h3>
              <p>Manage downline retailers, override pay-in commission slabs, and track network volume in real-time.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon"><Building size={24} /></div>
              <h3>Corporate Enterprises</h3>
              <p>Automate high-volume corporate collections via Virtual Accounts and direct bank reconciliation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SETUP PROCESS SECTION */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow-pill">Simple Setup</span>
            <h2 className="section-title">Start accepting pay-ins in minutes</h2>
          </div>

          <div className="process-grid">
            <div className="process-step">
              <span className="step-num">01</span>
              <h3>Choose a Plan</h3>
              <p>Pick the plan that fits your pay-in volume. Start as low as ₹100. Upgrade or downgrade anytime.</p>
            </div>

            <div className="process-step">
              <span className="step-num">02</span>
              <h3>Get API Keys & QR</h3>
              <p>Log into your merchant dashboard to generate API credentials, webhooks, and instant QR codes.</p>
            </div>

            <div className="process-step">
              <span className="step-num">03</span>
              <h3>Collect & Settle</h3>
              <p>Accept customer pay-ins automatically and enjoy instant settlements straight to your wallet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow-pill">Pricing</span>
            <h2 className="section-title">Start at just ₹100</h2>
            <p className="section-desc">Transparent pay-in processing. No lock-in. Cancel anytime.</p>
          </div>

          <div className="billing-toggle-container">
            <div className="billing-pills">
              <button
                className={`billing-pill ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`billing-pill ${billingCycle === 'quarterly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('quarterly')}
              >
                Quarterly <span className="discount-tag">Save 17%</span>
              </button>
              <button
                className={`billing-pill ${billingCycle === 'six_month' ? 'active' : ''}`}
                onClick={() => setBillingCycle('six_month')}
              >
                6 Months <span className="discount-tag">Save 26%</span>
              </button>
              <button
                className={`billing-pill ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly <span className="discount-tag">Save 35%</span>
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {/* Basic Plan */}
            <div className="plan-card">
              <h3 className="plan-name">Basic Merchant</h3>
              <p className="plan-sub">Perfect for small retailers</p>
              <div className="price-box">
                <span className="price-currency">₹</span>
                <span className="price-amount">{getPrice(100)}</span>
                <span className="price-period">/mo</span>
              </div>
              <p className="billing-note">Billed {billingCycle}</p>
              <button onClick={handleOpenSignIn} className="plan-btn plan-btn-secondary">
                Start for ₹100
              </button>
              <ul className="plan-features">
                <li><Check size={16} className="feature-check" /> Dynamic UPI QR Collections</li>
                <li><Check size={16} className="feature-check" /> Pay-In Payment Links</li>
                <li><Check size={16} className="feature-check" /> Low MDR Fees (0.5%)</li>
                <li><Check size={16} className="feature-check" /> Standard Settlement (T+1)</li>
                <li><Check size={16} className="feature-check" /> Email & Chat Support</li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="plan-card plan-featured">
              <span className="popular-badge">Most Popular</span>
              <h3 className="plan-name">Pro Merchant</h3>
              <p className="plan-sub">For growing businesses & networks</p>
              <div className="price-box">
                <span className="price-currency">₹</span>
                <span className="price-amount">{getPrice(1000)}</span>
                <span className="price-period">/mo</span>
              </div>
              <p className="billing-note">Billed {billingCycle}</p>
              <button onClick={handleOpenSignIn} className="plan-btn plan-btn-primary">
                Get Pro Merchant
              </button>
              <ul className="plan-features">
                <li><Check size={16} className="feature-check" /> Everything in Basic</li>
                <li><Check size={16} className="feature-check" /> Sub-Second Webhooks</li>
                <li><Check size={16} className="feature-check" /> Virtual Bank Account Pay-Ins</li>
                <li><Check size={16} className="feature-check" /> Instant Settlement (T+0)</li>
                <li><Check size={16} className="feature-check" /> Distributor Hierarchy Support</li>
                <li><Check size={16} className="feature-check" /> Priority 24/7 Helpline</li>
              </ul>
            </div>

            {/* Business Plan */}
            <div className="plan-card">
              <h3 className="plan-name">Enterprise Gateway</h3>
              <p className="plan-sub">Custom Pay-In stack for platforms</p>
              <div className="price-box">
                <span className="price-currency">₹</span>
                <span className="price-amount">{getPrice(10000)}</span>
                <span className="price-period">/mo</span>
              </div>
              <p className="billing-note">Billed {billingCycle}</p>
              <button onClick={handleOpenSignIn} className="plan-btn plan-btn-secondary">
                Go Enterprise
              </button>
              <ul className="plan-features">
                <li><Check size={16} className="feature-check" /> Everything in Pro</li>
                <li><Check size={16} className="feature-check" /> Custom Lowest MDR Rate</li>
                <li><Check size={16} className="feature-check" /> Unlimited Pay-In API Volume</li>
                <li><Check size={16} className="feature-check" /> Dedicated Account Manager</li>
                <li><Check size={16} className="feature-check" /> White-Label Merchant Portal</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow-pill">Testimonials</span>
            <h2 className="section-title">Trusted by thousands of merchants</h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="star-row">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} className="star-filled" />)}
              </div>
              <p className="quote">"RestoralAI's dynamic QR code pay-in system boosted our checkout speed dramatically. Webhook callbacks are blazingly fast."</p>
              <div className="author-row">
                <div>
                  <p className="author-name">Priya Sharma</p>
                  <p className="author-role">Operations Lead, Retail Pay</p>
                </div>
                <span className="plan-tag">Enterprise</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="star-row">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} className="star-filled" />)}
              </div>
              <p className="quote">"Managing distributor commissions on pay-ins was a headache before. RestoralAI automated the whole hierarchy slab system."</p>
              <div className="author-row">
                <div>
                  <p className="author-name">Arjun Mehta</p>
                  <p className="author-role">Super Distributor, North Zone</p>
                </div>
                <span className="plan-tag">Pro</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="star-row">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} className="star-filled" />)}
              </div>
              <p className="quote">"The Virtual Bank Account pay-in feature solved our B2B collection reconciliation. Settlement to bank happens instantly."</p>
              <div className="author-row">
                <div>
                  <p className="author-name">Sneha Reddy</p>
                  <p className="author-role">Finance Director, TechStart</p>
                </div>
                <span className="plan-tag">Enterprise</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="star-row">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} className="star-filled" />)}
              </div>
              <p className="quote">"Started with the Basic plan at ₹100 to test pay-in APIs. Upgraded to Pro within days. Highest transaction success rate in the market."</p>
              <div className="author-row">
                <div>
                  <p className="author-name">Vikram Patel</p>
                  <p className="author-role">CEO, Apex Merchant Solutions</p>
                </div>
                <span className="plan-tag">Pro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="faq-section">
        <div className="container max-w-3xl">
          <div className="section-header">
            <span className="eyebrow-pill">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${openFaq === idx ? 'faq-item-open' : ''}`}
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`faq-icon ${openFaq === idx ? 'rotate-180' : ''}`} />
                </div>
                {openFaq === idx && (
                  <div className="faq-answer animate-fade-in">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="final-cta-section">
        <div className="container">
          <div className="cta-box animate-fade-up">
            <h2 className="cta-title">Ready to accept Pay-Ins with RestoralAI?</h2>
            <p className="cta-subtitle">Join thousands of merchants, distributors, and enterprises processing pay-ins at scale.</p>
            <div className="cta-buttons">
              <button onClick={handleOpenSignIn} className="cta-btn-primary">
                <span>Start Accepting Pay-Ins for ₹100/mo</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <a href="/" className="brand-logo">
              <span className="logo-icon-box">
                <Sparkles size={16} className="text-white" />
              </span>
              <span className="brand-name">
                Restoral<span className="brand-highlight">AI</span>
              </span>
            </a>
            <p className="footer-tagline">
              An intelligent pay-in & financial collection gateway providing sub-second UPI QR codes, payment links, and virtual accounts.
            </p>
            <div className="footer-contact-snippets">
              <span className="snippet-item"><Mail size={14} /> support@restoralai.com</span>
              <span className="snippet-item"><Phone size={14} /> +91 (080) 4567-8900</span>
              <span className="snippet-item"><MapPin size={14} /> Outer Ring Road, Bengaluru, KA 560103</span>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Pay-In Platform</h4>
              <a href="#tools">Pay-In Solutions</a>
              <a href="#pricing">MDR Pricing</a>
              <button onClick={() => setIsAboutOpen(true)} className="footer-link-btn">About RestoralAI</button>
            </div>

            <div className="footer-col">
              <h4>Support & Legal</h4>
              <button onClick={() => setIsContactOpen(true)} className="footer-link-btn">Contact Us</button>
              <button onClick={() => setLegalTab('privacy')} className="footer-link-btn">Privacy Policy</button>
              <button onClick={() => setLegalTab('terms')} className="footer-link-btn">Terms of Service</button>
            </div>

            <div className="footer-col">
              <h4>Merchant Portal</h4>
              <button onClick={handleOpenSignIn} className="footer-link-btn">
                Merchant Sign In
              </button>
              <button onClick={handleOpenSignIn} className="footer-link-btn">
                Create Pay-In Account
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container bottom-row">
            <p>© {new Date().getFullYear()} RestoralAI Technologies Inc. All rights reserved. RBI & PCI-DSS Compliant Pay-In Gateway.</p>
            <div className="bottom-links">
              <button onClick={() => setLegalTab('privacy')} className="footer-bottom-btn">Privacy Policy</button>
              <button onClick={() => setLegalTab('terms')} className="footer-bottom-btn">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

      {/* POPUP MODALS */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <LegalModal
        isOpen={Boolean(legalTab)}
        initialTab={legalTab || 'privacy'}
        onClose={() => setLegalTab(null)}
      />
    </div>
  );
}
