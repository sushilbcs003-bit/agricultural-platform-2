import React, { useState, useEffect, useMemo } from 'react';
import { requestOTP, verifyOTP, registerFarmer, checkPhoneExists, getMasterData } from '../utils/api';
import logger from '../utils/logger';
import { sanitizeFormData, sanitizePhone, sanitizeString } from '../utils/sanitize';

const FarmerRegistration = ({ onLogin, onBack, initialPhone = '', startAtDetails = false, fromLogin = false }) => {
  const [step, setStep] = useState('phone'); // phone, otp, details
  const [loading, setLoading] = useState(false);
  // Initialize error as empty and use a function to filter "not registered" errors
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Wrapper function to set error that filters out "not registered" messages
  const setErrorSafe = (errorMsg) => {
    if (errorMsg && typeof errorMsg === 'string') {
      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes('not registered')) {
        logger.warn('⚠️ Registration: Blocked "not registered" error from being set:', errorMsg);
        setError(''); // Clear instead of setting (use setError directly to avoid recursion)
        return;
      }
    }
    setError(errorMsg);
  };
  
  // Force clear error on component mount - critical for registration page
  React.useEffect(() => {
    setErrorSafe('');
    setSuccess('');
  }, []); // Empty dependency array - runs once on mount
  const [language, setLanguage] = useState('en'); // en or hi
  const [masterData, setMasterData] = useState({});
  const [generatedOTP, setGeneratedOTP] = useState('');
  
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    name: '',
    dateOfBirth: '',
    village: '',
    tehsil: '',
    district: '',
    state: '',
    aadhaar: '',
    email: '',
    selectedProducts: {},
    customProducts: [],
    landName: '',
    landArea: '',
    landUnit: 'HECTARE',
    khasraNumber: '',
    mainRoadConnectivity: false,
    irrigationSource: '',
    ownershipType: '',
    about: ''
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for phone number - auto-format
    if (name === 'phone') {
      // Remove all non-digits
      let phoneValue = value.replace(/\D/g, '');
      // If starts with 91, add + prefix
      if (phoneValue.startsWith('91')) {
        phoneValue = '+' + phoneValue;
      } else if (phoneValue && !phoneValue.startsWith('+')) {
        // If user types digits without +91, add it
        phoneValue = '+91' + phoneValue;
      }
      // Limit to 13 characters (+91XXXXXXXXXX)
      if (phoneValue.length > 13) phoneValue = phoneValue.slice(0, 13);
      
      setFormData({
        ...formData,
        [name]: phoneValue
      });
    } else if (name === 'aadhaar') {
      // Aadhaar: numeric only, max 12 digits
      const aadhaarValue = value.replace(/\D/g, '').slice(0, 12);
      setFormData({
        ...formData,
        [name]: aadhaarValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    setErrorSafe('');
  };

  // Translation function - MUST be defined early as it's used in useEffect and productCategories
  const t = (enText, hiText) => language === 'hi' ? hiText : enText;

  useEffect(() => {
    // ALWAYS clear error messages when component mounts or when navigating to registration
    // This ensures no error from previous navigation persists
    // Force clear multiple times to ensure it's cleared
    setErrorSafe('');
    setSuccess('');
    
    // Use setTimeout to clear again after render, in case error was set during render
    const timeoutId = setTimeout(() => {
      setErrorSafe('');
    }, 0);
    
    if (initialPhone) {
      setFormData(prev => ({ ...prev, phone: initialPhone }));
    }
    if (startAtDetails) {
      setStep('details');
      setSuccess(t(
        'OTP verified! Please complete your registration.',
        'OTP सत्यापित! कृपया अपना पंजीकरण पूरा करें।'
      ));
    }
    // Note: We don't show any error message when coming from login
    // The user should just proceed with registration
    
    return () => {
      clearTimeout(timeoutId);
      setErrorSafe(''); // Clear on unmount too
    };
  }, [initialPhone, startAtDetails, fromLogin, language]); // t is a pure function of language, no need to include it

  // Product name translations (English -> Hindi)
  const productTranslations = {
    // Cereals
    'Rice': 'चावल',
    'Wheat': 'गेहूं',
    'Maize': 'मक्का',
    'Jowar (Sorghum)': 'ज्वार',
    'Bajra (Pearl Millet)': 'बाजरा',
    'Ragi (Finger Millet)': 'रागी',
    // Pulses
    'Tur (Pigeon Pea)': 'अरहर',
    'Moong (Green Gram)': 'मूंग',
    'Urad (Black Gram)': 'उड़द',
    'Chana (Chickpea)': 'चना',
    'Masoor (Lentil)': 'मसूर',
    // Fibre
    'Cotton': 'कपास',
    'Jute': 'जूट',
    // Oilseeds
    'Groundnut (Peanut)': 'मूंगफली',
    'Soybean': 'सोयाबीन',
    'Mustard': 'सरसों',
    'Linseed': 'अलसी',
    'Castor': 'अरंडी',
    // Sugarcane & Tobacco
    'Sugarcane': 'गन्ना',
    'Tobacco': 'तम्बाकू',
    // Plantation Beverages
    'Tea': 'चाय',
    'Coffee': 'कॉफी',
    // Plantation Other
    'Coconut': 'नारियल',
    'Rubber': 'रबर',
    'Areca nut': 'सुपारी',
    // Fruits
    'Mango': 'आम',
    'Banana': 'केला',
    'Apple': 'सेब',
    'Grapes': 'अंगूर',
    'Citrus': 'नींबू',
    'Papaya': 'पपीता',
    'Guava': 'अमरूद',
    // Vegetables
    'Potato': 'आलू',
    'Tomato': 'टमाटर',
    'Onion': 'प्याज',
    'Eggplant': 'बैंगन',
    'Cabbage': 'पत्तागोभी',
    'Cauliflower': 'फूलगोभी',
    'Gourds': 'लौकी/कद्दू',
    'Leafy greens': 'पत्तेदार सब्जियां',
    // Spices
    'Cardamom': 'इलायची',
    'Pepper': 'काली मिर्च',
    'Turmeric': 'हल्दी',
    'Chillies': 'मिर्च',
    'Ginger': 'अदरक'
  };

  // Helper function to get product name in current language
  const getProductName = (englishName) => {
    if (language === 'hi' && productTranslations[englishName]) {
      return productTranslations[englishName];
    }
    return englishName;
  };

  const productCategories = [
    {
      key: 'FOOD_CEREALS',
      label: t('Food Grains - Cereals (अनाज)', 'Food Grains - Cereals (अनाज)'),
      options: ['Rice', 'Wheat', 'Maize', 'Jowar (Sorghum)', 'Bajra (Pearl Millet)', 'Ragi (Finger Millet)']
    },
    {
      key: 'FOOD_PULSES',
      label: t('Food Grains - Pulses (दालें)', 'Food Grains - Pulses (दालें)'),
      options: ['Tur (Pigeon Pea)', 'Moong (Green Gram)', 'Urad (Black Gram)', 'Chana (Chickpea)', 'Masoor (Lentil)']
    },
    {
      key: 'CASH_FIBRE',
      label: t('Cash Crops - Fibre (रेशेदार)', 'Cash Crops - Fibre (रेशेदार)'),
      options: ['Cotton', 'Jute']
    },
    {
      key: 'CASH_OILSEEDS',
      label: t('Cash Crops - Oilseeds (तिलहन)', 'Cash Crops - Oilseeds (तिलहन)'),
      options: ['Groundnut (Peanut)', 'Soybean', 'Mustard', 'Linseed', 'Castor']
    },
    {
      key: 'CASH_SUGARCANE',
      label: t('Cash Crops - Sugarcane (गन्ना)', 'Cash Crops - Sugarcane (गन्ना)'),
      options: ['Sugarcane']
    },
    {
      key: 'CASH_TOBACCO',
      label: t('Cash Crops - Tobacco (तम्बाकू)', 'Cash Crops - Tobacco (तम्बाकू)'),
      options: ['Tobacco']
    },
    {
      key: 'PLANTATION_BEVERAGES',
      label: t('Plantation - Beverages (पेय)', 'Plantation - Beverages (पेय)'),
      options: ['Tea', 'Coffee']
    },
    {
      key: 'PLANTATION_OTHER',
      label: t('Plantation - Other (अन्य)', 'Plantation - Other (अन्य)'),
      options: ['Coconut', 'Rubber', 'Areca nut']
    },
    {
      key: 'HORT_FRUITS',
      label: t('Horticulture - Fruits (फल)', 'Horticulture - Fruits (फल)'),
      options: ['Mango', 'Banana', 'Apple', 'Grapes', 'Citrus', 'Papaya', 'Guava']
    },
    {
      key: 'HORT_VEGETABLES',
      label: t('Horticulture - Vegetables (सब्जियां)', 'Horticulture - Vegetables (सब्जियां)'),
      options: ['Potato', 'Tomato', 'Onion', 'Eggplant', 'Cabbage', 'Cauliflower', 'Gourds', 'Leafy greens']
    },
    {
      key: 'SPICES_OTHERS',
      label: t('Spices & Others (मसाले)', 'Spices & Others (मसाले)'),
      options: ['Cardamom', 'Pepper', 'Turmeric', 'Chillies', 'Ginger']
    }
  ];

  const toggleProductSelection = (categoryKey, option, checked) => {
    setFormData(prev => {
      const current = prev.selectedProducts[categoryKey] || [];
      const next = checked
        ? Array.from(new Set([...current, option]))
        : current.filter(item => item !== option);
      return {
        ...prev,
        selectedProducts: {
          ...prev.selectedProducts,
          [categoryKey]: next
        }
      };
    });
  };

  const [activeTab, setActiveTab] = useState('details'); // details | products | about
  
  // Validation function to check if form is ready to submit (must be defined before useMemo)
  const isFormValid = () => {
    // Check Personal & Location Details (required)
    const hasPersonalDetails = formData.name && formData.dateOfBirth && formData.aadhaar;
    const hasLocationDetails = formData.village && formData.district && formData.state;
    
    // Land details are optional for initial registration - farmers can update later
    // const hasLandDetails = formData.landArea && formData.landUnit && formData.ownershipType;
    
    // Check Products - at least one product must be selected
    // Check all categories in selectedProducts
    const hasProducts = Object.keys(formData.selectedProducts || {}).some(
      category => {
        const products = formData.selectedProducts[category];
        return Array.isArray(products) && products.length > 0;
      }
    ) || (Array.isArray(formData.customProducts) && formData.customProducts.length > 0);
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Form Validation]', {
        hasPersonalDetails,
        hasLocationDetails,
        hasProducts,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        aadhaar: formData.aadhaar,
        village: formData.village,
        district: formData.district,
        state: formData.state,
        selectedProducts: formData.selectedProducts,
        customProducts: formData.customProducts,
        isValid: hasPersonalDetails && hasLocationDetails && hasProducts
      });
    }
    
    return hasPersonalDetails && hasLocationDetails && hasProducts;
  };
  
  // Track form validity state to ensure button updates when products are selected
  // Use useMemo to compute validity and ensure it updates when formData changes
  const formValid = useMemo(() => {
    return isFormValid();
  }, [formData.name, formData.dateOfBirth, formData.aadhaar, 
      formData.village, formData.district, formData.state,
      JSON.stringify(formData.selectedProducts), 
      JSON.stringify(formData.customProducts)]);
  
  // Clear success and error messages when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSuccess(''); // Clear success message when navigating between tabs
    setErrorSafe(''); // Clear error message when navigating between tabs
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorSafe('');
    setSuccess('');

    try {
      // Ensure phone is in +91XXXXXXXXXX format before sending
      let phoneToSend = (formData.phone || '').trim().replace(/\s/g, '');
      if (phoneToSend && !phoneToSend.startsWith('+')) {
        phoneToSend = phoneToSend.replace(/\D/g, '');
        if (phoneToSend.startsWith('91') && phoneToSend.length >= 12) phoneToSend = '+' + phoneToSend;
        else if (phoneToSend.length === 10) phoneToSend = '+91' + phoneToSend;
      }
      if (!/^\+91[6-9]\d{9}$/.test(phoneToSend)) {
        setErrorSafe(t('Enter a valid 10-digit Indian phone number', 'वैध 10-अंकीय भारतीय फोन नंबर दर्ज करें'));
        setLoading(false);
        return;
      }
      // Request OTP - backend will validate if phone is already registered
      const response = await requestOTP(phoneToSend, 'REGISTRATION');

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
        // If OTP request fails, show the error message
        const errorMsg = response.error?.message || t('Failed to send OTP', 'OTP भेजने में विफल');
        setErrorSafe(errorMsg);
      }
    } catch (err) {
      logger.error('❌ Registration: Error in handlePhoneSubmit:', err);
      const errorMsg = err.response?.data?.error?.message || err.message || t('Failed to send OTP', 'OTP भेजने में विफल');
      
      // Check if it's a 409 (phone already registered) or 404 (not registered) error
      const status = err.response?.status;
      if (status === 409) {
        // Phone already registered - show error with Hindi translation if available
        const errorData = err.response?.data?.error;
        const message = errorData?.messageHi && language === 'hi' 
          ? errorData.messageHi 
          : (errorData?.message || errorMsg);
        setError(message);
      } else if (status === 404) {
        // Phone not registered - this shouldn't happen on registration page, but handle it
        const errorData = err.response?.data?.error;
        const message = errorData?.messageHi && language === 'hi' 
          ? errorData.messageHi 
          : (errorData?.message || errorMsg);
        setError(message);
      } else {
        // Other errors
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorSafe('');

    try {
      const response = await verifyOTP(formData.phone, formData.otp, 'REGISTRATION');
      if (response.success) {
        // Don't check phone existence here - let the backend handle it during final registration
        // The OTP bypass might create temporary users, causing false positives
        
        // For REGISTRATION purpose, proceed to details step
        // Don't call onLogin here - that should only happen after complete registration
        setSuccess(t(
          'OTP verified! Please complete your registration.',
          'OTP सत्यापित! कृपया अपना पंजीकरण पूरा करें।'
        ));
        setStep('details');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || t('Invalid OTP', 'अमान्य OTP'));
    } finally {
      setLoading(false);
    }
  };


  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorSafe('');

    try {
      // Map frontend field names to backend canonical field names
      const payload = {
        ...formData,
        landAreaValue: formData.landArea ? parseFloat(formData.landArea) : null,
        landAreaUnit: formData.landUnit || null,
        // Remove old field names to avoid confusion
        landArea: undefined,
        landUnit: undefined
      };
      delete payload.landArea;
      delete payload.landUnit;
      
      const response = await registerFarmer(payload);
      if (response.success) {
        setSuccess(t(
          'Registration successful! Welcome to the platform!',
          'पंजीकरण सफल! मंच पर आपका स्वागत है!'
        ));
        setTimeout(() => onLogin(response), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || t('Registration failed', 'पंजीकरण विफल'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="registration-page">
      <div className="container">
        <div className="registration-card">
          <div className="card-header">
            <div className="header-controls">
              <button className="back-btn" onClick={onBack}>
                ← {t('Back', 'वापस')}
              </button>
              
              <div className="language-toggle">
                <button 
                  className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
                <button 
                  className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                  onClick={() => setLanguage('hi')}
                >
                  हिं
                </button>
              </div>
            </div>
            
            <h2>
              🌾 {t('Farmer Registration', 'किसान / कृषक पंजीकरण')}
            </h2>
            
            {/* Enhanced Progress indicator with labels */}
            <div className="progress-steps">
              <div className={`step-wrapper ${step === 'phone' ? 'active' : step !== 'phone' ? 'completed' : ''}`}>
                <div className={`step ${step === 'phone' ? 'active' : step !== 'phone' ? 'completed' : ''}`}>
                  {step !== 'phone' ? '✓' : '1'}
                </div>
                <span className="step-label">{t('Phone', 'फोन')}</span>
              </div>
              <div className={`step-connector ${step === 'details' ? 'completed' : ''}`}></div>
              <div className={`step-wrapper ${step === 'otp' ? 'active' : step === 'details' ? 'completed' : ''}`}>
                <div className={`step ${step === 'otp' ? 'active' : step === 'details' ? 'completed' : ''}`}>
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
            {/* Explicitly filter out "not registered" error - should NEVER appear on registration page */}
            {error && typeof error === 'string' && !error.toLowerCase().includes('not registered') && error.trim() !== '' && (
              <div className="alert alert-error">
                <div>
                  <div>{error}</div>
                  {error.toLowerCase().includes('network') || error.toLowerCase().includes('connection') ? (
                    <>
                      <div className="error-helper">
                        {t('Please check your internet connection and try again', 'कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें')}
                      </div>
                      <button 
                        type="button" 
                        className="retry-btn"
                        onClick={() => {
                          setError('');
                          if (step === 'phone') {
                            handlePhoneSubmit({ preventDefault: () => {} });
                          } else if (step === 'otp') {
                            // Retry OTP verification if needed
                            setError('');
                          }
                        }}
                      >
                        {t('Retry', 'पुनः प्रयास करें')}
                      </button>
                    </>
                  ) : null}
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
                <form onSubmit={handleRegistrationSubmit} className="farmer-form">
                  <h3>{t('Complete Your Profile', 'अपनी प्रोफाइल पूरी करें')}</h3>

                  <div className="tabs">
                    {[
                      { key: 'details', label: t('Details (Personal, Location, Land)', 'विवरण (व्यक्तिगत, स्थान, भूमि)') },
                      { key: 'products', label: t('Products', 'उत्पाद') },
                      { key: 'about', label: t('About', 'परिचय') },
                    ].map(tab => (
                      <button
                        type="button"
                        key={tab.key}
                        className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'details' && (
                    <div className="details-grid">
                      <div className="form-section compact">
                        <h4>{t('Personal Information', 'व्यक्तिगत जानकारी')}</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>{t('Full Name', 'पूरा नाम')} *</label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder={t('Enter your full name', 'अपना पूरा नाम दर्ज करें')}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>{t('Date of Birth', 'जन्म तिथि')} *</label>
                            <input
                              type="date"
                              name="dateOfBirth"
                              value={formData.dateOfBirth}
                              onChange={handleInputChange}
                              max={new Date().toISOString().split('T')[0]}
                              required
                            />
                            <div className="trust-indicator">
                              <span className="icon">🔒</span>
                              <span>{t('Your date of birth is secure and encrypted', 'आपकी जन्म तिथि सुरक्षित और एन्क्रिप्टेड है')}</span>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>{t('Aadhaar Number', 'आधार संख्या')} *</label>
                            <input
                              type="text"
                              name="aadhaar"
                              value={formData.aadhaar}
                              onChange={handleInputChange}
                              placeholder="123456789012"
                              pattern="\d{12}"
                              maxLength="12"
                              required
                            />
                            <div className="trust-indicator">
                              <span className="icon">🛡️</span>
                              <span>{t('Your Aadhaar is encrypted and never shared', 'आपका आधार एन्क्रिप्टेड है और कभी साझा नहीं किया जाता')}</span>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>{t('Email Address (Optional)', 'ईमेल पता (वैकल्पिक)')}</label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="farmer@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-section compact">
                        <h4>{t('Location Information', 'स्थान की जानकारी')}</h4>
                        <div className="form-grid">
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
                            <label>{t('Khasra Number', 'खसरा नंबर')}</label>
                            <input
                              type="text"
                              name="khasraNumber"
                              value={formData.khasraNumber}
                              onChange={handleInputChange}
                              placeholder={t('Enter Khasra Number', 'खसरा नंबर दर्ज करें')}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-section compact">
                        <h4>{t('Agricultural Land Details', 'कृषि भूमि विवरण')}</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>{t('Land Name', 'भूमि का नाम')}</label>
                            <input
                              type="text"
                              name="landName"
                              value={formData.landName}
                              onChange={handleInputChange}
                              placeholder={t('e.g., Main Farm, Canal Field', 'जैसे, मुख्य खेत')}
                            />
                            <span className="field-hint">{t('Optional - defaults to village name', 'वैकल्पिक - डिफ़ॉल्ट गांव का नाम')}</span>
                          </div>
                          <div className="form-group">
                            <label>{t('Land Area', 'भूमि क्षेत्र')}</label>
                            <input
                              type="number"
                              name="landArea"
                              value={formData.landArea}
                              onChange={handleInputChange}
                              placeholder="5.5"
                              step="0.1"
                            />
                          </div>

                          <div className="form-group">
                            <label>{t('Unit', 'इकाई')}</label>
                            <select
                              name="landUnit"
                              value={formData.landUnit}
                              onChange={handleInputChange}
                            >
                              {masterData.landUnits?.map(unit => (
                                <option key={unit.value} value={unit.value}>
                                  {language === 'hi' ? unit.hindi : unit.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label>{t('Irrigation Source', 'सिंचाई स्रोत')}</label>
                            <select
                              name="irrigationSource"
                              value={formData.irrigationSource}
                              onChange={handleInputChange}
                            >
                              <option value="">{t('Select Source', 'स्रोत चुनें')}</option>
                              {masterData.irrigationSources?.map(source => (
                                <option key={source.value} value={source.value}>
                                  {language === 'hi' ? source.hindi : source.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label>{t('Ownership Type', 'स्वामित्व प्रकार')}</label>
                            <select
                              name="ownershipType"
                              value={formData.ownershipType}
                              onChange={handleInputChange}
                            >
                              <option value="">{t('Select Type', 'प्रकार चुनें')}</option>
                              {masterData.ownershipTypes?.map(type => (
                                <option key={type.value} value={type.value}>
                                  {language === 'hi' ? type.hindi : type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className={`product-tile ${formData.mainRoadConnectivity ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              name="mainRoadConnectivity"
                              checked={formData.mainRoadConnectivity}
                              onChange={handleInputChange}
                              className="product-tile-checkbox"
                            />
                            <span className="product-tile-label">
                              {t('Connected to main road', 'मुख्य सड़क से जुड़ा हुआ')}
                            </span>
                          </label>
                          <div className="helper-text" style={{ marginTop: '0.5rem' }}>
                            {t('Helps buyers understand transport access', 'खरीदारों को परिवहन पहुंच समझने में मदद करता है')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'products' && (
                    <div>
                      <div className="form-section compact" style={{ marginBottom: '1.5rem' }}>
                        <h4>{t('Select Agricultural Products', 'कृषि उत्पाद चुनें')}</h4>
                        <p className="section-subtitle">
                          {t('Select what you grow (multiple selections allowed)', 'आप क्या उगाते हैं चुनें (कई चुन सकते हैं)')}
                        </p>
                      </div>
                      
                      <div className="details-grid">
                      {/* Food Grains Section */}
                      <div className="form-section compact product-section-group">
                        <h4 className="section-group-title">{t('Food Grains', 'खाद्यान्न')}</h4>
                        
                        {/* Cereals Sub-section */}
                        {(() => {
                          const category = productCategories.find(c => c.key === 'FOOD_CEREALS');
                          if (!category) return null;
                          const selectedCount = (formData.selectedProducts[category.key] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Cereals', 'अनाज')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {category.options.map(option => {
                                  const checked = (formData.selectedProducts[category.key] || []).includes(option);
                                  return (
                                    <label 
                                      key={option} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection(category.key, option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Pulses Sub-section */}
                        {(() => {
                          const category = productCategories.find(c => c.key === 'FOOD_PULSES');
                          if (!category) return null;
                          const selectedCount = (formData.selectedProducts[category.key] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Pulses', 'दालें')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {category.options.map(option => {
                                  const checked = (formData.selectedProducts[category.key] || []).includes(option);
                                  return (
                                    <label 
                                      key={option} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection(category.key, option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Cash Crops Section */}
                      <div className="form-section compact product-section-group">
                        <h4 className="section-group-title">{t('Cash Crops', 'नकदी फसलें')}</h4>
                        
                        {/* Fibre Sub-section */}
                        {(() => {
                          const category = productCategories.find(c => c.key === 'CASH_FIBRE');
                          if (!category) return null;
                          const selectedCount = (formData.selectedProducts[category.key] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Fibre', 'रेशेदार')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {category.options.map(option => {
                                  const checked = (formData.selectedProducts[category.key] || []).includes(option);
                                  return (
                                    <label 
                                      key={option} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection(category.key, option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Oilseeds Sub-section */}
                        {(() => {
                          const category = productCategories.find(c => c.key === 'CASH_OILSEEDS');
                          if (!category) return null;
                          const selectedCount = (formData.selectedProducts[category.key] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Oilseeds', 'तिलहन')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {category.options.map(option => {
                                  const checked = (formData.selectedProducts[category.key] || []).includes(option);
                                  return (
                                    <label 
                                      key={option} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection(category.key, option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Sugarcane and Tobacco Together Sub-section */}
                        {(() => {
                          const sugarcaneCategory = productCategories.find(c => c.key === 'CASH_SUGARCANE');
                          const tobaccoCategory = productCategories.find(c => c.key === 'CASH_TOBACCO');
                          const combinedOptions = [
                            ...(sugarcaneCategory?.options || []),
                            ...(tobaccoCategory?.options || [])
                          ];
                          if (combinedOptions.length === 0) return null;
                          const selectedCount = (formData.selectedProducts['CASH_SUGARCANE'] || []).length + 
                                               (formData.selectedProducts['CASH_TOBACCO'] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Sugarcane & Tobacco', 'गन्ना और तम्बाकू')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {sugarcaneCategory && sugarcaneCategory.options.map(option => {
                                  const checked = (formData.selectedProducts['CASH_SUGARCANE'] || []).includes(option);
                                  return (
                                    <label 
                                      key={`CASH_SUGARCANE_${option}`} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection('CASH_SUGARCANE', option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                                {tobaccoCategory && tobaccoCategory.options.map(option => {
                                  const checked = (formData.selectedProducts['CASH_TOBACCO'] || []).includes(option);
                                  return (
                                    <label 
                                      key={`CASH_TOBACCO_${option}`} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection('CASH_TOBACCO', option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Plantation Sub-section - Combined Beverages and Other */}
                        {(() => {
                          const beveragesCategory = productCategories.find(c => c.key === 'PLANTATION_BEVERAGES');
                          const otherCategory = productCategories.find(c => c.key === 'PLANTATION_OTHER');
                          const combinedOptions = [
                            ...(beveragesCategory?.options || []),
                            ...(otherCategory?.options || [])
                          ];
                          if (combinedOptions.length === 0) return null;
                          const selectedCount = (formData.selectedProducts['PLANTATION_BEVERAGES'] || []).length + 
                                               (formData.selectedProducts['PLANTATION_OTHER'] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Plantation', 'बागान')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {beveragesCategory && beveragesCategory.options.map(option => {
                                  const checked = (formData.selectedProducts['PLANTATION_BEVERAGES'] || []).includes(option);
                                  return (
                                    <label 
                                      key={`PLANTATION_BEVERAGES_${option}`} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection('PLANTATION_BEVERAGES', option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                                {otherCategory && otherCategory.options.map(option => {
                                  const checked = (formData.selectedProducts['PLANTATION_OTHER'] || []).includes(option);
                                  return (
                                    <label 
                                      key={`PLANTATION_OTHER_${option}`} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection('PLANTATION_OTHER', option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Horticulture Section */}
                      <div className="form-section compact product-section-group">
                        <h4 className="section-group-title">{t('Horticulture', 'बागवानी')}</h4>
                        
                        {/* Fruits Sub-section */}
                        {(() => {
                          const category = productCategories.find(c => c.key === 'HORT_FRUITS');
                          if (!category) return null;
                          const selectedCount = (formData.selectedProducts[category.key] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Fruits', 'फल')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {category.options.map(option => {
                                  const checked = (formData.selectedProducts[category.key] || []).includes(option);
                                  return (
                                    <label 
                                      key={option} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection(category.key, option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Vegetables Sub-section */}
                        {(() => {
                          const category = productCategories.find(c => c.key === 'HORT_VEGETABLES');
                          if (!category) return null;
                          const selectedCount = (formData.selectedProducts[category.key] || []).length;
                          return (
                            <div className="product-subsection">
                              <h5 className="subsection-title">
                                {t('Vegetables', 'सब्जियां')}
                                {selectedCount > 0 && (
                                  <span className="selection-count"> ({selectedCount} {t('selected', 'चुने गए')})</span>
                                )}
                              </h5>
                              <div className="product-tiles-grid">
                                {category.options.map(option => {
                                  const checked = (formData.selectedProducts[category.key] || []).includes(option);
                                  return (
                                    <label 
                                      key={option} 
                                      className={`product-tile ${checked ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleProductSelection(category.key, option, e.target.checked)}
                                        className="product-tile-checkbox"
                                      />
                                      <span className="product-tile-label">{getProductName(option)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="form-section compact">
                      <h4>{t('About Your Farming', 'आपकी खेती के बारे में')}</h4>
                      <div className="form-group">
                        <textarea
                          name="about"
                          value={formData.about}
                          onChange={handleInputChange}
                          placeholder={t('Tell us about your farming practices, experience, etc.', 'अपनी खेती की प्रथाओं, अनुभव आदि के बारे में बताएं')}
                          rows="3"
                        />
                      </div>
                    </div>
                  )}

                  <div className="tab-actions">
                    {activeTab !== 'details' && (
                      <button type="button" className="btn btn-outline" onClick={() => handleTabChange('details')}>
                        {t('Back to Details', 'विवरण पर वापस')}
                      </button>
                    )}
                    {activeTab !== 'products' && (
                      <button type="button" className="btn btn-secondary" onClick={() => handleTabChange('products')}>
                        {t('Go to Products', 'उत्पाद पर जाएं')}
                      </button>
                    )}
                    {activeTab !== 'about' && (
                      <button type="button" className="btn btn-secondary" onClick={() => handleTabChange('about')}>
                        {t('Go to About', 'परिचय पर जाएं')}
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className={`btn btn-primary btn-large ${loading ? 'loading' : ''} ${!formValid ? 'disabled' : ''}`} 
                      disabled={loading || !formValid}
                      title={!formValid ? t('Please fill: Name, Date of Birth, Aadhaar, Village, District, State, and select at least one Product', 'कृपया भरें: नाम, जन्मतिथि, आधार, गाँव, जिला, राज्य, और कम से कम एक उत्पाद चुनें') : ''}
                    >
                      {loading ? 
                        t('Creating Account...', 'खाता बनाया जा रहा है...') : 
                        t('Complete Registration 🌾', 'पंजीकरण पूरा करें 🌾')
                      }
                    </button>
                  </div>
                  
                  {/* Show missing fields hint when form is invalid */}
                  {!formValid && (
                    <div className="validation-hint" style={{ 
                      marginTop: '1rem', 
                      padding: '0.75rem 1rem', 
                      background: '#fef3c7', 
                      border: '1px solid #f59e0b',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#92400e'
                    }}>
                      <strong>{t('Missing required fields:', 'आवश्यक फ़ील्ड अधूरे हैं:')}</strong>
                      <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
                        {!formData.name && <li>{t('Full Name', 'पूरा नाम')}</li>}
                        {!formData.dateOfBirth && <li>{t('Date of Birth', 'जन्म तिथि')}</li>}
                        {!formData.aadhaar && <li>{t('Aadhaar Number', 'आधार संख्या')}</li>}
                        {!formData.village && <li>{t('Village', 'गाँव')}</li>}
                        {!formData.district && <li>{t('District', 'जिला')}</li>}
                        {!formData.state && <li>{t('State', 'राज्य')}</li>}
                        {!Object.keys(formData.selectedProducts || {}).some(
                          cat => (formData.selectedProducts[cat] || []).length > 0
                        ) && !((formData.customProducts || []).length > 0) && (
                          <li>{t('At least one Product', 'कम से कम एक उत्पाद')}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerRegistration;
