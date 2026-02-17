import React, { useState } from 'react';
import { 
  checkPhoneExists,
  requestOTP, 
  verifyOTP, 
  requestBuyerOtp, 
  verifyBuyerOtp,
  requestSupplierOtp,
  verifySupplierOtp
} from '../utils/api';

const LoginPage = ({ onLogin, onBack, onStartFarmerRegistration }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState('FARMER'); // FARMER | BUYER | SUPPLIER
  const [step, setStep] = useState('request'); // request | verify
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    gst: '',
    otp: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
    setGeneratedOTP('');
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (role === 'FARMER') {
        // Validate phone number format first
        if (!formData.phone || formData.phone.trim() === '') {
          setError('Please enter a phone number');
          setLoading(false);
          return;
        }

        // Request OTP - backend will validate if phone is registered for LOGIN
        const response = await requestOTP(formData.phone, 'LOGIN');
        if (response.success) {
          const otpValue = response?.otp || response?.data?.otp || response?.result?.otp;
          if (otpValue) {
            setGeneratedOTP(otpValue);
            setSuccess('');
          } else {
            setGeneratedOTP('');
            setSuccess(`OTP sent to ${formData.phone}`);
          }
          setStep('verify');
        } else {
          // If OTP request fails, show the error message
          const errorMsg = response.error?.message || 'Failed to send OTP';
          // Check if it's a 404 (not registered) error
          if (errorMsg.includes('not registered') || errorMsg.includes('Please register first')) {
            setError('This number is not registered. Please create an account.');
          } else {
            setError(errorMsg);
          }
        }
      } else if (role === 'BUYER') {
        if (!formData.phone || !formData.gst) {
          setError('Both phone number and GST number are required');
          setLoading(false);
          return;
        }
        const response = await requestBuyerOtp(formData.phone, formData.gst);
        if (response.success) {
          const otpValue = response?.otp || response?.data?.otp || response?.result?.otp;
          if (otpValue) {
            setGeneratedOTP(otpValue);
            setSuccess('');
          } else {
            setGeneratedOTP('');
            setSuccess(`OTP sent to ${formData.phone}`);
          }
          setStep('verify');
        }
      } else if (role === 'SUPPLIER') {
        const response = await requestSupplierOtp(formData.gst);
        if (response.success) {
          const otpValue = response?.otp || response?.data?.otp || response?.result?.otp;
          if (otpValue) {
            setGeneratedOTP(otpValue);
            setSuccess('');
          } else {
            setGeneratedOTP('');
            setSuccess(`OTP sent to supplier phone for GST ${formData.gst}`);
          }
          setStep('verify');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (role === 'FARMER') {
        const response = await verifyOTP(formData.phone, formData.otp, 'LOGIN');
        if (response.success) {
          if (response.user) {
            // Existing user - login
            onLogin(response);
          } else if (response.newUser && response.phone) {
            // New user - redirect to registration
            if (onStartFarmerRegistration) {
              onStartFarmerRegistration(response.phone);
            } else {
              setError('Registration flow not available. Please contact support.');
            }
          } else {
            // Unexpected response - show error
            setError('Unexpected response from server. Please try again.');
          }
        } else {
          setError(response.error?.message || 'OTP verification failed');
        }
      } else if (role === 'BUYER') {
        if (!formData.phone || !formData.gst) {
          setError('Both phone number and GST number are required');
          setLoading(false);
          return;
        }
        const response = await verifyBuyerOtp(formData.phone, formData.gst, formData.otp);
        if (response.success && response.user) {
          onLogin(response);
        } else {
          setError(response.error?.message || 'Invalid or expired OTP');
        }
      } else if (role === 'SUPPLIER') {
        const response = await verifySupplierOtp(formData.gst, formData.otp);
        if (response.success && response.user) {
          onLogin(response);
        } else {
          setError(response.error?.message || 'Invalid or expired OTP');
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.error?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Mobile Header */}
        <div className="login-header-mobile">
          <button className="back-btn-mobile" onClick={onBack}>← Back</button>
          <h2>🔐 Login</h2>
        </div>

        {/* Desktop Split Layout */}
        <div className="login-split-layout">
          {/* Left Brand/Value Panel (Desktop only) */}
          <div className="login-brand-panel">
            <div className="brand-content">
              <div className="brand-logo">🌱</div>
              <h1>AgriSetu</h1>
              <p className="brand-subtitle">(किसान, खरीदार और सप्लायर को जोड़ने वाला मंच)</p>
              <div className="brand-values">
                <div className="value-item">
                  <div className="value-icon">🔒</div>
                  <div className="value-text">
                    <h3>Secure Login</h3>
                    <p>OTP-based authentication for your safety</p>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon">⚡</div>
                  <div className="value-text">
                    <h3>Quick Access</h3>
                    <p>Fast and easy login process</p>
                  </div>
                </div>
                <div className="value-item">
                  <div className="value-icon">🌾</div>
                  <div className="value-text">
                    <h3>Connect & Trade</h3>
                    <p>Join farmers, buyers, and suppliers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="login-card-wrapper">
            <div className="login-card">
              {/* Desktop Header */}
              <div className="login-header-desktop">
                <button className="back-btn-desktop" onClick={onBack}>← Back</button>
                <h2>🔐 Login</h2>
              </div>

              <div className="login-card-body">
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Role Selection - Segmented Control (Desktop) / Dropdown (Mobile/Tablet) */}
                <div className="role-selection">
                  <label className="role-label">Login as</label>
                  {/* Desktop: Segmented Control */}
                  <div className="role-segmented-control">
                    <button
                      type="button"
                      className={`role-segment ${role === 'FARMER' ? 'active' : ''}`}
                      onClick={() => {
                        setRole('FARMER');
                        setStep('request');
                        setFormData({ phone: '', gst: '', otp: '' });
                        setError('');
                        setSuccess('');
                        setGeneratedOTP('');
                      }}
                    >
                      🌾 Farmer
                    </button>
                    <button
                      type="button"
                      className={`role-segment ${role === 'BUYER' ? 'active' : ''}`}
                      onClick={() => {
                        setRole('BUYER');
                        setStep('request');
                        setFormData({ phone: '', gst: '', otp: '' });
                        setError('');
                        setSuccess('');
                        setGeneratedOTP('');
                      }}
                    >
                      🏢 Buyer
                    </button>
                    <button
                      type="button"
                      className={`role-segment ${role === 'SUPPLIER' ? 'active' : ''}`}
                      onClick={() => {
                        setRole('SUPPLIER');
                        setStep('request');
                        setFormData({ phone: '', gst: '', otp: '' });
                        setError('');
                        setSuccess('');
                        setGeneratedOTP('');
                      }}
                    >
                      🏭 Supplier
                    </button>
                  </div>
                  {/* Mobile/Tablet: Dropdown */}
                  <select
                    className="role-dropdown"
                    name="role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setStep('request');
                      setFormData({ phone: '', gst: '', otp: '' });
                      setError('');
                      setSuccess('');
                      setGeneratedOTP('');
                    }}
                  >
                    <option value="FARMER">🌾 Farmer</option>
                    <option value="BUYER">🏢 Buyer</option>
                    <option value="SUPPLIER">🏭 Supplier</option>
                  </select>
                </div>

                <form onSubmit={step === 'request' ? handleRequestOtp : handleVerifyOtp} className="login-form">
                  <div className="login-form-grid">
                    {role === 'FARMER' && (
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91XXXXXXXXXX"
                          required
                        />
                      </div>
                    )}

                    {role === 'BUYER' && step === 'request' && (
                      <>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91XXXXXXXXXX"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>GST Number</label>
                          <input
                            type="text"
                            name="gst"
                            value={formData.gst}
                            onChange={handleInputChange}
                            placeholder="Enter GST number"
                            required
                          />
                        </div>
                      </>
                    )}

                    {role === 'SUPPLIER' && (
                      <div className="form-group">
                        <label>GST Number</label>
                        <input
                          type="text"
                          name="gst"
                          value={formData.gst}
                          onChange={handleInputChange}
                          placeholder="Enter GST number"
                          required
                        />
                      </div>
                    )}

                    {step === 'verify' && (
                      <>
                        {generatedOTP && (
                          <div className="otp-display-box" style={{
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            color: '#14532d',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1rem'
                          }}>
                            OTP generated: <strong>{generatedOTP}</strong>
                          </div>
                        )}
                        <div className="form-group">
                          <label>Enter OTP</label>
                          <input
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleInputChange}
                            placeholder="6-digit OTP"
                            required
                            maxLength="6"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
                    {loading ? 'Please wait...' : step === 'request' ? 'Send OTP 🔐' : 'Verify OTP 🔐'}
                  </button>

                  {/* Security Messaging */}
                  {step === 'request' && (
                    <p className="security-message">
                      🔒 Your OTP will be sent securely. Never share it with anyone.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
