import React, { useState, useEffect } from 'react';

const HomeDashboard = ({ user, onNavigate, language: externalLanguage, onLanguageChange }) => {
  const [language, setLanguage] = useState(externalLanguage || 'en'); // en, hi, or regional
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dailyRecommendations, setDailyRecommendations] = useState([]);
  const [contextualProducts, setContextualProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.user?.role || user?.role || 'FARMER';
  const userLocation = user?.user?.farmerProfile?.village || 
                     user?.user?.buyerProfile?.village || 
                     user?.user?.supplierProfile?.village || 
                     'Default Location';

  // Sync language when parent updates
  useEffect(() => {
    if (externalLanguage && externalLanguage !== language) {
      setLanguage(externalLanguage);
    }
  }, [externalLanguage, language]);

  const handleLanguageToggle = () => {
    const nextLanguage = language === 'en' ? 'hi' : 'en';
    setLanguage(nextLanguage);
    if (onLanguageChange) {
      onLanguageChange(nextLanguage);
    }
  };

  // Translation function
  const t = (en, hi = '') => {
    if (language === 'hi') return hi || en;
    return en;
  };

  // Role-based primary CTA
  const getPrimaryCTA = () => {
    switch (role) {
      case 'FARMER':
        return {
          text: t('What should I do today?', 'आज मुझे क्या करना चाहिए?'),
          icon: '🌾',
          action: () => onNavigate('recommendations')
        };
      case 'BUYER':
        return {
          text: t('Find produce near me', 'मेरे पास उत्पाद खोजें'),
          icon: '🔍',
          action: () => onNavigate('browse')
        };
      case 'SUPPLIER':
        return {
          text: t('Connect with farmers', 'किसानों से जुड़ें'),
          icon: '🤝',
          action: () => onNavigate('farmers')
        };
      default:
        return {
          text: t('Get Started', 'शुरू करें'),
          icon: '🚀',
          action: () => {}
        };
    }
  };

  // Mock data - Replace with actual API calls
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Simulate API calls
      setTimeout(() => {
        // Weather data
        setWeather({
          temperature: 28,
          condition: t('Sunny', 'धूप'),
          humidity: 65,
          windSpeed: 12,
          icon: '☀️',
          location: userLocation
        });

        // Mandi prices (mock)
        setMandiPrices([
          { crop: t('Wheat', 'गेहूं'), price: 2100, unit: 'quintal', change: '+2.5%', trend: 'up' },
          { crop: t('Rice', 'चावल'), price: 1850, unit: 'quintal', change: '-1.2%', trend: 'down' },
          { crop: t('Tomato', 'टमाटर'), price: 35, unit: 'kg', change: '+5.8%', trend: 'up' }
        ]);

        // Crop-specific advisories (only for farmers)
        const allAdvisories = [
          {
            id: 1,
            title: t('Irrigation Advisory', 'सिंचाई सलाह'),
            content: t('Water your wheat fields today. Optimal time: 6-8 AM', 'आज अपने गेहूं के खेतों में पानी दें। इष्टतम समय: सुबह 6-8 बजे'),
            crop: t('Wheat', 'गेहूं'),
            type: 'irrigation',
            verified: true,
            source: 'IMD',
            views: 234,
            playable: true
          },
          {
            id: 2,
            title: t('Spray Advisory', 'स्प्रे सलाह'),
            content: t('Avoid spraying today due to high wind speed. Wait for tomorrow.', 'उच्च हवा की गति के कारण आज स्प्रे करने से बचें। कल तक प्रतीक्षा करें।'),
            crop: t('Rice', 'चावल'),
            type: 'spray',
            verified: true,
            source: 'Agricultural Expert',
            views: 189,
            playable: true
          }
        ];
        
        // Filter advisories based on role - exclude irrigation and spray for buyers and suppliers
        const filteredAdvisories = (role === 'BUYER' || role === 'SUPPLIER')
          ? [] 
          : allAdvisories;
        setAdvisories(filteredAdvisories);

        // Alerts
        const allAlerts = [
          {
            id: 1,
            type: 'pest',
            severity: 'high',
            title: t('Pest Alert', 'कीट चेतावनी'),
            message: t('Locust activity detected in nearby areas. Take preventive measures.', 'पास के क्षेत्रों में टिड्डी गतिविधि का पता चला। निवारक उपाय करें।'),
            crop: t('Wheat', 'गेहूं'),
            location: userLocation,
            timestamp: new Date()
          },
          {
            id: 2,
            type: 'price',
            severity: 'medium',
            title: t('Price Alert', 'मूल्य चेतावनी'),
            message: t('Wheat prices increased by 2.5% in local mandi. Consider selling.', 'स्थानीय मंडी में गेहूं की कीमतें 2.5% बढ़ गईं। बेचने पर विचार करें।'),
            crop: t('Wheat', 'गेहूं'),
            location: userLocation,
            timestamp: new Date()
          }
        ];
        
        // Filter alerts based on role - exclude pest alerts for buyers and suppliers
        const filteredAlerts = (role === 'BUYER' || role === 'SUPPLIER')
          ? allAlerts.filter(alert => alert.type !== 'pest')
          : allAlerts;
        setAlerts(filteredAlerts);

        // Daily recommendations - role-specific
        let recommendations = [];
        
        if (role === 'BUYER') {
          // Buying-related recommendations for buyers
          recommendations = [
            {
              action: t('Browse Farmers', 'किसानों को ब्राउज़ करें'),
              crop: t('Wheat', 'गेहूं'),
              time: t('Today', 'आज'),
              reason: t('Best prices available in your area', 'आपके क्षेत्र में सर्वोत्तम कीमतें उपलब्ध')
            },
            {
              action: t('Place Bid', 'बोली लगाएं'),
              crop: t('Rice', 'चावल'),
              time: t('Today', 'आज'),
              reason: t('High quality produce available for bidding', 'बोली के लिए उच्च गुणवत्ता वाला उत्पाद उपलब्ध')
            },
            {
              action: t('Check Orders', 'ऑर्डर जांचें'),
              crop: t('All Products', 'सभी उत्पाद'),
              time: t('Today', 'आज'),
              reason: t('Track your pending orders', 'अपने लंबित ऑर्डर ट्रैक करें')
            }
          ];
        } else if (role === 'SUPPLIER') {
          // Supplier-specific recommendations
          recommendations = [
            {
              action: t('Update Machinery Availability', 'मशीनरी उपलब्धता अपडेट करें'),
              crop: t('Farming Equipment', 'कृषि उपकरण'),
              time: t('Today', 'आज'),
              reason: t('High demand for tractors in your area', 'आपके क्षेत्र में ट्रैक्टर की उच्च मांग')
            },
            {
              action: t('Check Transport Bookings', 'परिवहन बुकिंग जांचें'),
              crop: t('Transport Services', 'परिवहन सेवाएं'),
              time: t('Today', 'आज'),
              reason: t('3 pending transport requests need attention', '3 लंबित परिवहन अनुरोधों पर ध्यान देने की आवश्यकता')
            },
            {
              action: t('AI Yield Testing Available', 'AI उपज परीक्षण उपलब्ध'),
              crop: t('Quality Testing', 'गुणवत्ता परीक्षण'),
              time: t('Today', 'आज'),
              reason: t('New AI-powered yield prediction service available', 'नई AI-संचालित उपज भविष्यवाणी सेवा उपलब्ध')
            }
          ];
        } else {
          // Farming recommendations for farmers
          recommendations = [
            {
              action: t('Irrigate', 'सिंचाई करें'),
              crop: t('Wheat', 'गेहूं'),
              time: t('Today, 6-8 AM', 'आज, सुबह 6-8 बजे'),
              reason: t('Optimal weather conditions', 'इष्टतम मौसम की स्थिति')
            },
            {
              action: t('Don\'t Spray', 'स्प्रे न करें'),
              crop: t('Rice', 'चावल'),
              time: t('Next 48 hours', 'अगले 48 घंटे'),
              reason: t('High wind speed expected', 'उच्च हवा की गति की उम्मीद')
            },
            {
              action: t('Sell', 'बेचें'),
              crop: t('Wheat', 'गेहूं'),
              time: t('Today', 'आज'),
              reason: t('Price increased by 2.5%', 'मूल्य में 2.5% की वृद्धि')
            }
          ];
        }
        
        setDailyRecommendations(recommendations);

        // Context-aware product suggestions
        const products = [];
        
        if (role === 'BUYER') {
          // Buyer-specific product suggestions
          const priceAlert = alerts.find(a => a.type === 'price' && a.severity === 'medium');
          if (priceAlert) {
            products.push({
              id: 'prod_2',
              name: t('Quality Produce Available', 'गुणवत्ता वाला उत्पाद उपलब्ध'),
              reason: t('Good prices in your area - best time to buy', 'आपके क्षेत्र में अच्छी कीमतें - खरीदारी का सर्वोत्तम समय'),
              context: 'price_opportunity',
              category: t('Buying', 'खरीदारी')
            });
          }
        } else {
          // Farmer-specific product suggestions
          // If pest alert exists, suggest pest control products
          const pestAlert = alerts.find(a => a.type === 'pest');
          if (pestAlert) {
            products.push({
              id: 'prod_1',
              name: t('Organic Pest Control Spray', 'जैविक कीट नियंत्रण स्प्रे'),
              reason: t('Recommended due to pest alert in your area', 'आपके क्षेत्र में कीट चेतावनी के कारण अनुशंसित'),
              context: 'pest_alert',
              category: t('Pest Control', 'कीट नियंत्रण')
            });
          }

          // If price spike, suggest selling options
          const priceAlert = alerts.find(a => a.type === 'price' && a.severity === 'medium');
          if (priceAlert) {
            products.push({
              id: 'prod_2',
              name: t('Direct Selling Service', 'प्रत्यक्ष बिक्री सेवा'),
              reason: t('Price spike detected - maximize your profit', 'मूल्य वृद्धि का पता चला - अपना लाभ अधिकतम करें'),
              context: 'price_spike',
              category: t('Selling', 'बिक्री')
            });
          }
        }

        setContextualProducts(products);

        setLoading(false);
      }, 1000);
    };

    loadData();
  }, [userLocation, language, role]);

  // Text-to-speech for advisories
  const speakAdvisory = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const primaryCTA = getPrimaryCTA();

  if (loading) {
    return (
      <div className="home-dashboard">
        <div className="loading-state">
          <div className="spinner">🌱</div>
          <p>{t('Loading your dashboard...', 'आपका डैशबोर्ड लोड हो रहा है...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-dashboard">
      {/* Header with language toggle */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{t('Home', 'होम')}</h1>
          <div className="header-actions">
            <button 
              className="language-toggle"
              onClick={handleLanguageToggle}
            >
              {language === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Primary CTA */}
      <section className="primary-cta-section">
        <button 
          className="primary-cta-btn"
          onClick={primaryCTA.action}
        >
          <span className="cta-icon">{primaryCTA.icon}</span>
          <span className="cta-text">{primaryCTA.text}</span>
        </button>
      </section>

      {/* Weather Card */}
      {weather && (
        <div className="info-card weather-card">
          <div className="card-header">
            <h3>{t('Weather', 'मौसम')}</h3>
            <span className="weather-icon">{weather.icon}</span>
          </div>
          <div className="card-content">
            <div className="weather-main">
              <div className="temperature">{weather.temperature}°C</div>
              <div className="condition">{weather.condition}</div>
            </div>
            <div className="weather-details">
              <div className="detail-item">
                <span>{t('Humidity', 'नमी')}: {weather.humidity}%</span>
              </div>
              <div className="detail-item">
                <span>{t('Wind', 'हवा')}: {weather.windSpeed} km/h</span>
              </div>
            </div>
            <div className="location-badge">{weather.location}</div>
          </div>
        </div>
      )}

      {/* Mandi Prices Card - Hide for Suppliers */}
      {mandiPrices.length > 0 && role !== 'SUPPLIER' && (
        <div className="info-card mandi-card">
          <div className="card-header">
            <h3>{t('Mandi Prices', 'मंडी कीमतें')}</h3>
            <span className="card-source">{t('Source: Mandi Board', 'स्रोत: मंडी बोर्ड')}</span>
          </div>
          <div className="card-content">
            {mandiPrices.map((price, idx) => (
              <div key={idx} className="price-item">
                <div className="price-crop">{price.crop}</div>
                <div className="price-value">
                  ₹{price.price}/{price.unit}
                  <span className={`price-change ${price.trend}`}>
                    {price.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Recommendations */}
      {dailyRecommendations.length > 0 && (
        <div className="info-card recommendations-card">
          <div className="card-header">
            <h3>{t('What should I do today?', 'आज मुझे क्या करना चाहिए?')}</h3>
            <span className="card-badge">{t('Today', 'आज')}</span>
          </div>
          <div className="card-content">
            {dailyRecommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-item">
                <div className="rec-action">{rec.action}</div>
                <div className="rec-details">
                  <span className="rec-crop">{rec.crop}</span>
                  <span className="rec-time">{rec.time}</span>
                </div>
                <div className="rec-reason">{rec.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crop-Specific Advisories */}
      {advisories.map(advisory => (
        <div key={advisory.id} className="info-card advisory-card">
          <div className="card-header">
            <h3>{advisory.title}</h3>
            <div className="card-trust-signals">
              {advisory.verified && (
                <span className="trust-badge verified">
                  ✓ {t('Verified by Expert', 'विशेषज्ञ द्वारा सत्यापित')}
                </span>
              )}
            </div>
          </div>
          <div className="card-content">
            <p className="advisory-content">{advisory.content}</p>
            <div className="advisory-meta">
              <span className="advisory-crop">{advisory.crop}</span>
              <span className="advisory-source">{t('Source', 'स्रोत')}: {advisory.source}</span>
              <span className="advisory-views">
                {advisory.views} {t('farmers viewed today', 'किसानों ने आज देखा')}
              </span>
            </div>
            {advisory.playable && (
              <button 
                className="play-advisory-btn"
                onClick={() => speakAdvisory(advisory.content)}
              >
                🔊 {t('Play', 'चलाएं')}
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Alerts */}
      {alerts.map(alert => (
        <div key={alert.id} className={`info-card alert-card alert-${alert.severity}`}>
          <div className="card-header">
            <h3>{alert.title}</h3>
            <span className={`alert-badge ${alert.severity}`}>
              {alert.severity === 'high' ? '🔴' : '🟡'} {alert.severity.toUpperCase()}
            </span>
          </div>
          <div className="card-content">
            <p className="alert-message">{alert.message}</p>
            <div className="alert-meta">
              <span className="alert-crop">{alert.crop}</span>
              <span className="alert-location">{alert.location}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Context-Aware Product Suggestions */}
      {contextualProducts.length > 0 && (
        <div className="info-card products-card">
          <div className="card-header">
            <h3>{t('Recommended for You', 'आपके लिए अनुशंसित')}</h3>
            <span className="card-badge">{t('Contextual', 'संदर्भ-आधारित')}</span>
          </div>
          <div className="card-content">
            {contextualProducts.map(product => (
              <div key={product.id} className="contextual-product-item">
                <div className="product-header">
                  <h4>{product.name}</h4>
                  <span className="product-category">{product.category}</span>
                </div>
                <p className="product-reason">
                  <span className="reason-label">{t('Why am I seeing this?', 'मैं यह क्यों देख रहा हूं?')}</span>
                  {product.reason}
                </p>
                <button className="btn btn-sm btn-primary" onClick={() => onNavigate('products')}>
                  {t('View Details', 'विवरण देखें')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;
