import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   Animated Counter Hook
───────────────────────────────────────────────────────────── */
function useAnimatedCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, hasStarted]);

  return { count, start: () => setHasStarted(true) };
}

/* ─────────────────────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────────────────────── */
const Icons = {
  chart: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  shield: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  users: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  zap: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  arrowRight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   Mock Dashboard Preview Component
───────────────────────────────────────────────────────────── */
function DashboardPreview() {
  return (
    <div className="dashboard-preview" aria-hidden="true">
      <div className="preview-topbar">
        <div className="preview-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <span className="preview-title">FinTrack Dashboard</span>
      </div>
      
      <div className="preview-content">
        {/* KPI Row */}
        <div className="preview-kpi-row">
          <div className="preview-kpi income">
            <span className="preview-kpi-label">Income</span>
            <span className="preview-kpi-value">$124,500</span>
            <span className="preview-kpi-delta positive">+12.4%</span>
          </div>
          <div className="preview-kpi expense">
            <span className="preview-kpi-label">Expenses</span>
            <span className="preview-kpi-value">$89,200</span>
            <span className="preview-kpi-delta negative">+3.2%</span>
          </div>
          <div className="preview-kpi net">
            <span className="preview-kpi-label">Net Profit</span>
            <span className="preview-kpi-value">$35,300</span>
            <span className="preview-kpi-delta positive">+28.1%</span>
          </div>
        </div>

        {/* Chart */}
        <div className="preview-chart">
          <div className="chart-header">
            <span>Revenue Trends</span>
            <span className="chart-period">Last 6 months</span>
          </div>
          <svg className="chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 Q30,70 60,65 T120,50 T180,35 T240,45 T300,20 L300,100 L0,100 Z"
              fill="url(#chartGradient)"
            />
            <path
              d="M0,80 Q30,70 60,65 T120,50 T180,35 T240,45 T300,20"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Recent Activity */}
        <div className="preview-activity">
          <span className="activity-title">Recent Activity</span>
          <div className="activity-item">
            <span className="activity-icon income">↗</span>
            <span className="activity-text">Payment received</span>
            <span className="activity-amount">+$2,400</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon expense">↘</span>
            <span className="activity-text">Software subscription</span>
            <span className="activity-amount">-$199</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon income">↗</span>
            <span className="activity-text">Client invoice</span>
            <span className="activity-amount">+$8,500</span>
          </div>
        </div>
      </div>

      {/* Floating elements for depth */}
      <div className="preview-float preview-float-1" />
      <div className="preview-float preview-float-2" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Testimonial Component
───────────────────────────────────────────────────────────── */
function Testimonial({ quote, author, role, company }: { quote: string; author: string; role: string; company: string }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="star">{Icons.star}</span>
        ))}
      </div>
      <blockquote className="testimonial-quote">"{quote}"</blockquote>
      <div className="testimonial-author">
        <div className="author-avatar">{author.charAt(0)}</div>
        <div className="author-info">
          <span className="author-name">{author}</span>
          <span className="author-role">{role}, {company}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Landing Page Component
───────────────────────────────────────────────────────────── */
export function LandingPage() {
  const tracked = useAnimatedCounter(2300000000, 2500);
  const transactions = useAnimatedCounter(847000, 2000);
  const companies = useAnimatedCounter(12400, 1800);

  // Start counters when component mounts (could use IntersectionObserver for scroll-trigger)
  useEffect(() => {
    const timer = setTimeout(() => {
      tracked.start();
      transactions.start();
      companies.start();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <span className="brand-icon">◆</span>
            <span className="brand-text">FinTrack</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#demo" className="nav-link">Demo</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/register" className="btn-primary">
              <span>Get Started</span>
              {Icons.arrowRight}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-grid" />
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-dot" />
              <span>Trusted by 12,400+ companies worldwide</span>
            </div>
            
            <h1 className="hero-title">
              Financial clarity,<br />
              <span className="gradient-text">delivered instantly.</span>
            </h1>
            
            <p className="hero-subtitle">
              Stop drowning in spreadsheets. FinTrack gives you real-time visibility into your 
              business finances with beautiful dashboards, intelligent insights, and enterprise-grade security.
            </p>

            <div className="hero-cta">
              <Link to="/register" className="btn-primary btn-large">
                <span>Start Free Trial</span>
                {Icons.arrowRight}
              </Link>
              <a href="#demo" className="btn-ghost btn-large">
                <span>Watch Demo</span>
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">{formatCurrency(tracked.count)}</span>
                <span className="stat-label">Tracked Annually</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-value">{formatNumber(transactions.count)}</span>
                <span className="stat-label">Transactions/Month</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-value">{formatNumber(companies.count)}</span>
                <span className="stat-label">Happy Companies</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="social-proof">
        <p className="social-proof-text">Trusted by finance teams at</p>
        <div className="logo-grid">
          <div className="logo-placeholder">Stripe</div>
          <div className="logo-placeholder">Shopify</div>
          <div className="logo-placeholder">Notion</div>
          <div className="logo-placeholder">Linear</div>
          <div className="logo-placeholder">Vercel</div>
          <div className="logo-placeholder">Figma</div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="story-section">
        <div className="story-content">
          <span className="section-badge">The Problem</span>
          <h2 className="section-title">
            Your finances shouldn't feel like <span className="text-negative">archaeology.</span>
          </h2>
          <p className="section-text">
            You know the drill. End of month hits, and suddenly you're digging through 
            17 spreadsheets, 4 bank statements, and that one receipt you definitely 
            saved somewhere. By the time you figure out where your money went, 
            it's already gone.
          </p>
        </div>
        
        <div className="story-content">
          <span className="section-badge positive">The Solution</span>
          <h2 className="section-title">
            See everything. <span className="text-positive">Instantly.</span>
          </h2>
          <p className="section-text">
            FinTrack connects to your financial data and transforms it into actionable 
            insights in real-time. No more guessing. No more spreadsheet gymnastics. 
            Just clear, beautiful dashboards that tell you exactly what's happening 
            with your money—and what to do about it.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything you need to master your finances.</h2>
          <p className="section-subtitle">
            Powerful tools designed for modern businesses, from startups to enterprise.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon accent">{Icons.chart}</div>
            <h3 className="feature-title">Real-Time Analytics</h3>
            <p className="feature-text">
              Watch your financial health update in real-time with beautiful charts, 
              trend analysis, and category breakdowns.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon positive">{Icons.shield}</div>
            <h3 className="feature-title">Bank-Grade Security</h3>
            <p className="feature-text">
              256-bit encryption, SOC 2 compliance, and role-based access control 
              keep your financial data locked down.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon warning">{Icons.users}</div>
            <h3 className="feature-title">Team Collaboration</h3>
            <p className="feature-text">
              Invite your team with granular permissions. Viewers see reports, 
              analysts dig deeper, admins control everything.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon negative">{Icons.zap}</div>
            <h3 className="feature-title">Lightning Fast</h3>
            <p className="feature-text">
              Built on modern infrastructure for sub-100ms response times. 
              No more waiting for reports to load.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo-section" id="demo">
        <div className="demo-content">
          <span className="section-badge">See It In Action</span>
          <h2 className="section-title">Your dashboard, reimagined.</h2>
          <p className="section-text">
            Track income and expenses, analyze trends over time, and export reports 
            with a single click. Here's what your new financial command center looks like.
          </p>
          
          <div className="demo-features">
            <div className="demo-feature">
              {Icons.check}
              <span>Monthly comparison with delta indicators</span>
            </div>
            <div className="demo-feature">
              {Icons.check}
              <span>Category breakdown with visual charts</span>
            </div>
            <div className="demo-feature">
              {Icons.check}
              <span>Trend analysis with smooth bezier curves</span>
            </div>
            <div className="demo-feature">
              {Icons.check}
              <span>One-click CSV and TXT exports</span>
            </div>
          </div>

          <Link to="/register" className="btn-primary btn-large">
            <span>Try It Free</span>
            {Icons.arrowRight}
          </Link>
        </div>

        <div className="demo-visual">
          <DashboardPreview />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <span className="section-badge">Testimonials</span>
          <h2 className="section-title">Loved by finance teams everywhere.</h2>
        </div>

        <div className="testimonials-grid">
          <Testimonial
            quote="FinTrack replaced 6 different tools we were using. Our month-end close went from 5 days to 5 hours."
            author="Sarah Chen"
            role="CFO"
            company="TechFlow Inc."
          />
          <Testimonial
            quote="The real-time dashboards changed how we make decisions. We can finally see where every dollar goes."
            author="Marcus Johnson"
            role="Finance Director"
            company="ScaleUp Labs"
          />
          <Testimonial
            quote="Best investment we made this year. ROI was positive within the first month."
            author="Elena Rodriguez"
            role="CEO"
            company="Bright Ventures"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <span className="section-badge">Pricing</span>
          <h2 className="section-title">Simple, transparent pricing.</h2>
          <p className="section-subtitle">Start free, upgrade when you're ready.</p>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3 className="pricing-name">Starter</h3>
              <div className="pricing-price">
                <span className="price-amount">$0</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-desc">Perfect for getting started</p>
            </div>
            <ul className="pricing-features">
              <li>{Icons.check} Up to 100 transactions/month</li>
              <li>{Icons.check} Basic dashboard</li>
              <li>{Icons.check} CSV export</li>
              <li>{Icons.check} 1 user</li>
            </ul>
            <Link to="/register" className="btn-ghost btn-full">Get Started</Link>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-header">
              <h3 className="pricing-name">Pro</h3>
              <div className="pricing-price">
                <span className="price-amount">$29</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-desc">For growing businesses</p>
            </div>
            <ul className="pricing-features">
              <li>{Icons.check} Unlimited transactions</li>
              <li>{Icons.check} Advanced analytics</li>
              <li>{Icons.check} Trend analysis</li>
              <li>{Icons.check} Up to 10 users</li>
              <li>{Icons.check} Priority support</li>
            </ul>
            <Link to="/register" className="btn-primary btn-full">Start Free Trial</Link>
          </div>

          <div className="pricing-card">
            <div className="pricing-header">
              <h3 className="pricing-name">Enterprise</h3>
              <div className="pricing-price">
                <span className="price-amount">Custom</span>
              </div>
              <p className="pricing-desc">For large organizations</p>
            </div>
            <ul className="pricing-features">
              <li>{Icons.check} Everything in Pro</li>
              <li>{Icons.check} Unlimited users</li>
              <li>{Icons.check} SSO / SAML</li>
              <li>{Icons.check} Dedicated support</li>
              <li>{Icons.check} Custom integrations</li>
            </ul>
            <a href="mailto:sales@fintrack.io" className="btn-ghost btn-full">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to take control of your finances?</h2>
          <p className="cta-text">
            Join 12,400+ companies who've already made the switch. 
            Start your free trial today—no credit card required.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="btn-primary btn-large">
              <span>Start Free Trial</span>
              {Icons.arrowRight}
            </Link>
            <Link to="/login" className="btn-ghost btn-large">
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-brand">
              <span className="brand-icon">◆</span>
              <span className="brand-text">FinTrack</span>
            </div>
            <p className="footer-tagline">Financial clarity, delivered instantly.</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#demo">Demo</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 FinTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
