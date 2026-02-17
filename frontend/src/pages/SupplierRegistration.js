import React, { useState, useEffect } from 'react';
import { requestOTP, verifyOTP, registerSupplier, checkPhoneExists, getMasterData } from '../utils/api';

const SupplierRegistration = ({ onBack, onLogin, initialPhone = '', startAtDetails = false }) => {
  const [step, setStep] = useState('phone'); // phone, otp, details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState('en'); // en or hi
  const [masterData, setMasterData] = useState({});
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    organizationName: '',
    contactName: '',
    email: '',
    gstNumber: '',
    businessAddress: '',
    village: '',
    tehsil: '',
    district: '',
    state: '',
    pincode: '',
    supplierTypes: [],
    notes: ''
  });

  // Load master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const data = await getMasterData();
        if (data.success) {
          setMasterData(data.data);
        }
      } catch (error) {
        console.error('Failed to load master data:', error);
      }
    };
    fetchMasterData();
  }, []);

  const t = (enText, hiText) => language === 'hi' ? hiText : enText;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for phone number - auto-format
    if (name === 'phone') {
      let phoneValue = value.replace(/\D/g, '');
      if (phoneValue.startsWith('91')) {
        phoneValue = '+' + phoneValue;
      } else if (phoneValue && !phoneValue.startsWith('+')) {
        phoneValue = '+91' + phoneValue;
      }
      if (phoneValue.length > 13) phoneValue = phoneValue.slice(0, 13);
      
      setFormData({
        ...formData,
        [name]: phoneValue
      });
    } else if (type === 'checkbox' && name === 'supplierType') {
      setFormData(prev => {
        const types = prev.supplierTypes || [];
        if (checked) {
          return { ...prev, supplierTypes: [...types, value] };
        } else {
          return { ...prev, supplierTypes: types.filter(t => t !== value) };
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    setError('');
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const checkResponse = await checkPhoneExists(formData.phone);
      
      if (!checkResponse.success && !checkResponse.error?.message?.includes('not registered')) {
        setError(checkResponse.error?.message || t('Failed to validate phone number', 'फोन नंबर सत्यापित करने में विफल'));
        setLoading(false);
        return;
      }
      
      if (checkResponse.exists) {
        setError(t(
          'This number is already registered. Please login to check your account.',
          'यह नंबर पहले से पंजीकृत है। कृपया अपने खाते की जांच के लिए लॉगिन करें।'
        ));
        setLoading(false);
        return;
      }
      
      const response = await requestOTP(formData.phone, 'REGISTRATION');
      
      if (response && response.success) {
        const otpValue = response?.otp || response?.data?.otp || response?.result?.otp;
        if (otpValue) {
          setGeneratedOTP(otpValue);
          setSuccess(t(
            `OTP generated: ${otpValue}`,
            `OTP उत्पन्न: ${otpValue}`
          ));
        } else {
          setGeneratedOTP('');
          setSuccess(t(
            `OTP sent to ${formData.phone}`,
            `${formData.phone} पर OTP भेजा गया`
          ));
        }
        setStep('otp');
      } else {
        const errorMsg = response.error?.message || t('Failed to send OTP', 'OTP भेजने में विफल');
        if (errorMsg.includes('already registered')) {
          setError(t(
            'This number is already registered. Please login to check your account.',
            'यह नंबर पहले से पंजीकृत है। कृपया अपने खाते की जांच के लिए लॉगिन करें।'
          ));
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Error in handlePhoneSubmit:', err);
      const errorMsg = err.response?.data?.error?.message || err.message || t('Failed to send OTP', 'OTP भेजने में विफल');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // For REGISTRATION, use 'REGISTRATION' purpose
      const response = await verifyOTP(formData.phone, formData.otp, 'REGISTRATION');
      
      if (response && response.success) {
        // For REGISTRATION purpose, always proceed to details step
        // Don't call onLogin here - that should only happen after complete registration
        setSuccess(t('OTP verified! Please complete your registration.', 'OTP सत्यापित! कृपया अपना पंजीकरण पूरा करें।'));
        setStep('details');
      } else {
        setError(response.error?.message || t('Invalid OTP. Please try again.', 'अमान्य OTP। कृपया पुनः प्रयास करें।'));
      }
    } catch (err) {
      console.error('Error in handleOTPSubmit:', err);
      setError(err.response?.data?.error?.message || t('OTP verification failed', 'OTP सत्यापन विफल'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate supplier types
    if (!formData.supplierTypes || formData.supplierTypes.length === 0) {
      setError('Please select at least one supplier type');
      setLoading(false);
      return;
    }

    try {
      const supplierData = {
        phone: formData.phone,
        organizationName: formData.organizationName,
        email: formData.email,
        supplierTypes: formData.supplierTypes,
        contactName: formData.contactName,
        gstNumber: formData.gstNumber || undefined,
        businessAddress: formData.businessAddress || undefined,
        village: formData.village || undefined,
        tehsil: formData.tehsil || undefined,
        district: formData.district || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
        notes: formData.notes || undefined
      };

      const response = await registerSupplier(supplierData);
      
      if (response.success) {
        setSuccess('Registration successful! You can now login.');
        setTimeout(() => {
          if (onLogin && response.user) {
            onLogin(response);
          } else {
            alert('Registration completed! Please login.');
            onBack();
          }
        }, 2000);
      } else {
        setError(response.error?.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Error in handleRegistrationSubmit:', err);
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.organizationName && 
           formData.contactName && 
           formData.email && 
           formData.supplierTypes.length > 0 &&
           formData.village && 
           formData.tehsil && 
           formData.district && 
           formData.state;
  };

  return (
    <div className="registration-page">
      <div className="container">
        <div className="registration-card">
          <div className="card-header">
            <button className="back-btn" onClick={onBack}>← Back</button>
            
            <div className="language-toggle">
              <button
                type="button"
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => setLanguage('hi')}
              >
                हिं
              </button>
            </div>
            
            <h2>
              🏭 {t('Supplier Registration', 'आपूर्तिकर्ता पंजीकरण')}
            </h2>
            
            {/* Progress indicator */}
            <div className="progress-steps">
              <div className={`step-wrapper ${step === 'phone' ? 'active' : step !== 'phone' ? 'completed' : ''}`}>
                <div className={`step ${step === 'phone' ? 'active' : step !== 'phone' ? 'completed' : ''}`}>
                  {step !== 'phone' ? '✓' : '1'}
                </div>
                <span className="step-label">{t('Phone', 'फोन')}</span>
              </div>
              <div className={`step-connector ${step === 'details' ? 'completed' : ''}`}></div>
              <div className={`step-wrapper ${step === 'otp' ? 'active' : step === 'details' ? 'completed' : ''}`}>
                <div className={`step ${step === 'details' ? '✓' : '2'}`}>
                  {step === 'details' ? '✓' : '2'}
                </div>
                <span className="step-label">{t('Verify', 'सत्यापित')}</span>
              </div>
              <div className={`step-connector ${step === 'details' ? 'completed' : ''}`}></div>
              <div className={`step-wrapper ${step === 'details' ? 'active' : ''}`}>
                <div className={`step ${step === 'details' ? 'active' : ''}`}>3</div>
                <span className="step-label">{t('Details', 'विवरण')}</span>
              </div>
            </div>
          </div>

          <div className="card-body">
            {error && (
              <div className="alert alert-error">
                <div>
                  <div>{error}</div>
                </div>
              </div>
            )}
            {success && <div className="alert alert-success">{success}</div>}

            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit}>
                <h3>{t('Enter Your Phone Number', 'अपना फोन नंबर दर्ज करें')}</h3>
                <p>{t('We\'ll send you an OTP to verify your phone number', 'हम आपको आपके फोन नंबर को सत्यापित करने के लिए एक OTP भेजेंगे')}</p>
                
                {generatedOTP && (
                  <div className="otp-display-box" style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    color: '#14532d',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    {t('OTP generated:', 'OTP उत्पन्न:')} <strong>{generatedOTP}</strong>
                  </div>
                )}
                <div className="form-group">
                  <label>{t('Phone Number', 'फोन नंबर')} *</label>
                  <div className="phone-input-wrapper">
                    <div className="country-code">🇮🇳 +91</div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      required
                      pattern="^\+91[6-9]\d{9}$"
                      title={t('Enter valid Indian phone number', 'वैध भारतीय फोन नंबर दर्ज करें')}
                      disabled={startAtDetails}
                      className={formData.phone && /^\+91[6-9]\d{9}$/.test(formData.phone) ? 'valid' : ''}
                    />
                    {formData.phone && /^\+91[6-9]\d{9}$/.test(formData.phone) && (
                      <span className="validation-check">✓</span>
                    )}
                  </div>
                  <div className="helper-text">
                    {t('We will send an OTP to this number', 'हम इस नंबर पर एक OTP भेजेंगे')}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t('Sending OTP...', 'OTP भेजा जा रहा है...') : t('Send OTP', 'OTP भेजें')}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOTPSubmit}>
                <h3>{t('Verify OTP', 'OTP सत्यापित करें')}</h3>
                <p>{t(`Enter the 6-digit OTP sent to ${formData.phone}`, `${formData.phone} पर भेजा गया 6-अंकीय OTP दर्ज करें`)}</p>
                
                <div className="form-group">
                  <label>OTP *</label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    placeholder="123456"
                    maxLength="6"
                    required
                    pattern="\d{6}"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setStep('phone')}>
                    {t('Change Phone', 'फोन बदलें')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t('Verifying...', 'सत्यापन...') : t('Verify OTP', 'OTP सत्यापित करें')}
                  </button>
                </div>
              </form>
            )}

            {step === 'details' && (
              <form onSubmit={handleRegistrationSubmit} className="supplier-form">
                <h3>{t('Complete Your Organization Profile', 'अपनी संगठन प्रोफाइल पूरी करें')}</h3>

                <div className="details-grid">
                  <div className="form-section compact">
                    <h4>{t('Organization Information', 'संगठन जानकारी')}</h4>
                    <div className="form-group">
                      <label>{t('Organization / Company Name', 'संगठन / कंपनी नाम')} *</label>
                      <input
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        placeholder={t('Your company name', 'आपका कंपनी नाम')}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('Primary Contact Name', 'प्राथमिक संपर्क नाम')} *</label>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        placeholder={t('Contact person', 'संपर्क व्यक्ति')}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('Email', 'ईमेल')} *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@company.com"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('GST Number', 'GST नंबर')}</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        placeholder="09AAACH7409R1ZZ"
                      />
                    </div>
                  </div>

                  <div className="form-section compact">
                    <h4>{t('Location Information', 'स्थान की जानकारी')}</h4>
                    <div className="form-group">
                      <label>{t('Village', 'गांव')} *</label>
                      <input
                        type="text"
                        name="village"
                        value={formData.village}
                        onChange={handleInputChange}
                        placeholder={t('Village name', 'गांव का नाम')}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('Tehsil', 'तहसील')} *</label>
                      <input
                        type="text"
                        name="tehsil"
                        value={formData.tehsil}
                        onChange={handleInputChange}
                        placeholder={t('Tehsil name', 'तहसील का नाम')}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('District', 'जिला')} *</label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        placeholder={t('District name', 'जिले का नाम')}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('State', 'राज्य')} *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">{t('Select State', 'राज्य चुनें')}</option>
                        {masterData.states?.map(state => (
                          <option key={state.value} value={state.value}>
                            {language === 'hi' ? state.hindi : state.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{t('Pincode', 'पिन कोड')}</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="123456"
                        maxLength="6"
                      />
                    </div>
                  </div>

                  <div className="form-section compact">
                    <h4>{t('Supplier Types', 'आपूर्तिकर्ता प्रकार')} *</h4>
                    <p className="section-subtitle">
                      {t('Select at least one supplier type', 'कम से कम एक आपूर्तिकर्ता प्रकार चुनें')}
                    </p>
                    <div className="product-tiles-grid">
                      {['TEST', 'TRANSPORT', 'MACHINERY', 'LABOUR'].map(type => {
                        const checked = formData.supplierTypes.includes(type);
                        const labels = {
                          'TEST': { en: 'Quality Testing', hi: 'गुणवत्ता परीक्षण' },
                          'TRANSPORT': { en: 'Transport Services', hi: 'परिवहन सेवाएं' },
                          'MACHINERY': { en: 'Machinery Services', hi: 'मशीनरी सेवाएं' },
                          'LABOUR': { en: 'Labour Services', hi: 'श्रम सेवाएं' }
                        };
                        return (
                          <label 
                            key={type} 
                            className={`product-tile ${checked ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              name="supplierType"
                              value={type}
                              checked={checked}
                              onChange={handleInputChange}
                              className="product-tile-checkbox"
                            />
                            <span className="product-tile-label">
                              {language === 'hi' ? labels[type].hi : labels[type].en}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-section compact">
                    <h4>{t('Additional Information', 'अतिरिक्त जानकारी')}</h4>
                    <div className="form-group">
                      <label>{t('Business Address', 'व्यावसायिक पता')}</label>
                      <textarea
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        placeholder={t('Complete business address', 'पूरा व्यावसायिक पता')}
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('Notes', 'नोट्स')}</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder={t('Tell us about your offerings and preferred regions', 'अपने प्रस्तावों और पसंदीदा क्षेत्रों के बारे में बताएं')}
                      />
                    </div>
                  </div>
                </div>

                <div className="sticky-cta">
                  <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    disabled={loading || !isFormValid()}
                    title={!isFormValid() ? t('Please fill all required fields and select at least one supplier type', 'कृपया सभी आवश्यक फ़ील्ड भरें और कम से कम एक आपूर्तिकर्ता प्रकार चुनें') : ''}
                  >
                    {loading ?
                      t('Submitting...', 'जमा किया जा रहा है...') :
                      t('Complete Registration 🏭', 'पंजीकरण पूरा करें 🏭')
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierRegistration;
