import React from 'react';

const HomePage = ({ onNavigate, apiStatus, onSelectLoginRole, onAdminLogin }) => {
  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">AgriSetu</span>
            <span className="logo-subtitle">(किसान, खरीदार और सप्लायर को जोड़ने वाला मंच)</span>
          </div>
          <div className="admin-login-link">
            <button
              onClick={onAdminLogin || (() => window.location.href = '/admin-login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
                e.currentTarget.style.color = '#5568d3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>⚙️</span>
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Connecting Farmers with Buyers using Suppliers</h1>
            <h2 className="hindi-subtitle">किसानों को खरीदारों से सप्लायर के माध्यम से जोड़ना</h2>
            
            {/* Who Does What Section */}
            <div className="who-does-what">
              <div className="role-cards">
                <div className="role-card role-farmer">
                  <div className="role-icon">🌾</div>
                  <div className="role-label">Farmers grow & Sell</div>
                  <div className="role-label-hindi">किसान उगाएँ और बेचें</div>
                </div>
                <div className="role-card role-buyer">
                  <div className="role-icon">🏬</div>
                  <div className="role-label">Buyers trade</div>
                  <div className="role-label-hindi">खरीदार खरीदें</div>
                </div>
                <div className="role-card role-supplier">
                  <div className="role-icon">🏭</div>
                  <div className="role-label">Suppliers support</div>
                  <div className="role-label-hindi">सप्लायर सहयोग करें</div>
                </div>
              </div>
            </div>
            
            <div className="cta-buttons">
              <button 
                className="btn btn-primary farmer-btn"
                onClick={() => onNavigate('farmer-register')}
              >
                <span className="btn-icon">🌾</span>
                <div className="btn-text">
                  <div>Register as Farmer</div>
                  <div className="btn-hindi">किसान के रूप में पंजीकरण</div>
                </div>
              </button>
              
              <button 
                className="btn btn-secondary buyer-btn"
                onClick={() => onNavigate('buyer-register')}
              >
                <span className="btn-icon">🏢</span>
                <div className="btn-text">
                  <div>Register as Buyer</div>
                  <div className="btn-hindi">खरीदार के रूप में पंजीकरण</div>
                </div>
              </button>

              <button 
                className="btn btn-tertiary supplier-btn"
                onClick={() => onNavigate('supplier-register')}
              >
                <span className="btn-icon">🏭</span>
                <div className="btn-text">
                  <div>Register as Supplier</div>
                  <div className="btn-hindi">आपूर्तिकर्ता के रूप में पंजीकरण</div>
                </div>
              </button>
            </div>

            <div className="login-section">
              <p className="login-section-title">Already have an account? / पहले से खाता है?</p>
              <div className="login-buttons">
                <button
                  className="btn btn-primary-outline login-btn"
                  onClick={() => onNavigate('login')}
                >
                  <span className="btn-icon">🔐</span>
                  <div className="btn-text">
                    <div>Login</div>
                    <div className="btn-hindi">लॉगिन</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose Our Platform?</h2>
          <h3 className="features-hindi">हमारे मंच को क्यों चुनें?</h3>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Easy Registration</h3>
              <h4>आसान पंजीकरण</h4>
              <p>Simple OTP-based registration for farmers and GST-based registration for buyers</p>
              <p className="feature-hindi">किसानों के लिए सरल OTP-आधारित पंजीकरण और खरीदारों के लिए GST-आधारित पंजीकरण</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Fair Pricing</h3>
              <h4>उचित मूल्य निर्धारण</h4>
              <p>Transparent bidding system ensuring fair prices for both farmers and buyers</p>
              <p className="feature-hindi">पारदर्शी बोली प्रणाली किसानों और खरीदारों दोनों के लिए उचित मूल्य सुनिश्चित करती है</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Transactions</h3>
              <h4>सुरक्षित लेनदेन</h4>
              <p>Secure platform with verified users and protected transactions</p>
              <p className="feature-hindi">सत्यापित उपयोगकर्ताओं और संरक्षित लेनदेन के साथ सुरक्षित मंच</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Direct Connection</h3>
              <h4>प्रत्यक्ष संपर्क</h4>
              <p>Connect directly with farmers and buyers, eliminating middlemen</p>
              <p className="feature-hindi">बिचौलियों को समाप्त करते हुए, किसानों और खरीदारों से सीधे जुड़ें</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <h3 className="hindi-title">यह कैसे काम करता है</h3>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4>Register</h4>
              <p className="step-hindi">पंजीकरण करें</p>
              <p>Farmers register with OTP, Buyers with GST</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h4>List Products</h4>
              <p className="step-hindi">उत्पाद सूचीबद्ध करें</p>
              <p>Farmers add their crops and produce</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h4>Connect & Trade</h4>
              <p className="step-hindi">जुड़ें और व्यापार करें</p>
              <p>Buyers find farmers and make direct purchases</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>🌱 AgriSetu</h4>
              <p>(किसान, खरीदार और सप्लायर को जोड़ने वाला मंच)</p>
              <p>Empowering farmers and buyers across India</p>
              <p className="footer-hindi">भारत भर में किसानों और खरीदारों को सशक्त बनाना</p>
            </div>
            
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><button onClick={() => onNavigate('farmer-register')}>Farmer Registration</button></li>
                <li><button onClick={() => onNavigate('buyer-register')}>Buyer Registration</button></li>
                <li><button onClick={() => onNavigate('supplier-register')}>Supplier Registration</button></li>
                <li><button onClick={() => onNavigate('login')}>Login</button></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Support</h4>
              <p>📞 1800-XXX-XXXX</p>
              <p>📧 support@agriplatform.in</p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 AgriSetu. Made with ❤️ for farmers and buyers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
