import React, { useState, useEffect, useRef } from 'react';
import { getFarmers, placeBid, getBuyerProfile, updateBuyerProfile, getMasterData, getBuyerBids } from '../utils/api';
import HomeDashboard from './HomeDashboard';
import PaymentPage from '../components/PaymentPage';
import { bidToPaymentItems } from '../utils/paymentService';
import { getStoredLanguage, saveLanguage, t as translate } from '../utils/language';

const BuyerDashboard = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('browse');
  const [language, setLanguage] = useState(getStoredLanguage());
  
  // Translation function
  const t = (en, hi = '') => translate(en, hi, language);
  
  // Handle language toggle
  const handleLanguageToggle = () => {
    const newLanguage = language === 'en' ? 'hi' : 'en';
    setLanguage(newLanguage);
    saveLanguage(newLanguage);
  };
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [placingBid, setPlacingBid] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [masterData, setMasterData] = useState({});
  const [locationFilter, setLocationFilter] = useState({ country: '', state: '', district: '', tehsil: '' });
  const [paymentBidId, setPaymentBidId] = useState(null);
  const addressRef = useRef();
  const villageRef = useRef();
  const tehsilRef = useRef();
  const districtRef = useRef();
  const stateRef = useRef();
  const pincodeRef = useRef();
  const contactPersonRef = useRef();
  const emailRef = useRef();

  // Load master data for location filters
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const res = await getMasterData();
        if (res?.success && res?.data) setMasterData(res.data || {});
      } catch (e) { console.debug('Master data load skipped:', e?.message); }
    };
    if (activeSection === 'browse') loadMaster();
  }, [activeSection]);

  // Load buyer profile when profile section is active
  useEffect(() => {
    if (activeSection === 'profile' && user?.user?.id) {
      const loadProfile = async () => {
        setProfileLoading(true);
        try {
          const res = await getBuyerProfile(user.user.id);
          if (res?.success && res?.buyer) {
            setBuyerProfile(res.buyer);
          }
        } catch (err) {
          console.error('Error loading buyer profile:', err);
        } finally {
          setProfileLoading(false);
        }
      };
      loadProfile();
    }
  }, [activeSection, user?.user?.id]);

  // Load bids on mount to ensure they're available for all sections
  useEffect(() => {
    if (user?.user?.id) {
      loadBids();
    }
  }, [user?.user?.id]);

  // Load farmers with available products on mount and when browse section is active
  useEffect(() => {
    if (activeSection === 'browse') {
      loadFarmers();
      loadBids(); // Reload to ensure fresh data
    }
  }, [activeSection]);
  
  // Load selected farmers from bids when selected section is active
  const loadSelectedFarmers = async () => {
    if (!user?.user?.id || bids.length === 0) {
      setSelectedFarmersData([]);
      return;
    }
    
    setLoadingSelected(true);
    try {
      // Get unique farmers from bids
      const farmersWithBids = new Map();
      
      // Load farmers data
      const farmerResponse = await fetch(`/api/farmers`);
      if (farmerResponse.ok) {
        const farmerData = await farmerResponse.json();
        if (farmerData.success && farmerData.farmers) {
          bids.forEach(bid => {
            const farmer = farmerData.farmers.find(f => f.id === bid.farmerId);
            if (farmer) {
              if (!farmersWithBids.has(bid.farmerId)) {
                farmersWithBids.set(bid.farmerId, {
                  ...farmer,
                  bids: [bid]
                });
              } else {
                const existingFarmer = farmersWithBids.get(bid.farmerId);
                existingFarmer.bids.push(bid);
              }
            }
          });
        }
      }
      
      setSelectedFarmersData(Array.from(farmersWithBids.values()));
    } catch (error) {
      console.error('Error loading selected farmers:', error);
      setSelectedFarmersData([]);
    } finally {
      setLoadingSelected(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'selected' && user?.user?.id) {
      loadSelectedFarmers();
    }
  }, [activeSection, bids, user?.user?.id]);
  
  // Ensure bids are loaded before rendering browse section
  useEffect(() => {
    if (activeSection === 'browse' && user?.user?.id) {
      // Always reload bids when entering browse section to ensure fresh data
      loadBids();
    }
  }, [activeSection, user?.user?.id]);

  // Load existing bids for the current buyer
  const loadBids = async () => {
    if (!user?.user?.id) return;
    try {
      const data = await getBuyerBids(user.user.id);
      if (data?.success && data?.bids) {
        setBids(data.bids);
      }
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  };

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const response = await getFarmers();
      if (response.success && response.farmers) {
        // Filter farmers who have at least one product available for browse
        const farmersWithProducts = response.farmers.filter(farmer => 
          farmer.products && farmer.products.length > 0
        );
        setFarmers(farmersWithProducts);
      }
    } catch (error) {
      console.error('Error loading farmers:', error);
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSelected = (farmer) => {
    if (!selectedFarmers.find(f => f.id === farmer.id)) {
      setSelectedFarmers([...selectedFarmers, farmer]);
    }
  };

  const handleRemoveFromSelected = (farmerId) => {
    setSelectedFarmers(selectedFarmers.filter(f => f.id !== farmerId));
  };

  const handlePlaceBid = async (farmer, product, bidData) => {
    if (!user?.user?.id) {
      alert('Please login to place a bid');
      return;
    }

    setPlacingBid(true);
    try {
      const bidPayload = {
        buyerId: user.user.id,
        farmerId: farmer.id,
        productId: product.id,
        offeredPrice: bidData.bidPrice,
        quantity: bidData.quantity,
        message: bidData.message || ''
      };

      const response = await placeBid(bidPayload);
      
      if (response.success) {
        alert('Bid placed successfully!');
        
        // Reload bids to get fresh data from backend (this will update button states)
        await loadBids();
        
        // Reload farmers to update button states
        await loadFarmers();
      } else {
        alert(response.error?.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to place bid. Please try again.';
      alert(errorMessage);
    } finally {
      setPlacingBid(false);
    }
  };

  // Check if a bid exists for a product (pending farmer response)
  const hasBidForProduct = (productId) => {
    const now = new Date();
    return bids.some(bid => {
      if (bid.productId !== productId) return false;
      // PLACED, PENDING, COUNTERED = awaiting farmer response
      if (bid.status === 'PLACED' || bid.status === 'PENDING' || bid.status === 'COUNTERED') {
        // Check if bid has expired (48 hours passed)
        if (bid.expiresAt) {
          const expiresAt = new Date(bid.expiresAt);
          if (now < expiresAt) {
            // Bid is still valid (within 48 hours)
            return true;
          }
          // Bid has expired, allow new bid
          return false;
        }
        // If no expiresAt, assume bid is still valid
        return true;
      }
      
      // If bid is ACCEPTED, REJECTED, or EXPIRED, allow new bid
      return false;
    });
  };
  
  const getBidStatusForProduct = (productId) => {
    const now = new Date();
    const bid = bids.find(b => b.productId === productId);
    
    if (!bid) return null;
    
    // Check if bid has expired
    if (bid.expiresAt) {
      const expiresAt = new Date(bid.expiresAt);
      const timeRemaining = expiresAt - now;
      const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
      const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
      
      if (timeRemaining <= 0) {
        return { expired: true, status: 'EXPIRED' };
      }
      
      return {
        expired: false,
        status: bid.status,
        timeRemaining: { hours: hoursRemaining, minutes: minutesRemaining }
      };
    }
    
    return { expired: false, status: bid.status };
  };

  const renderBrowse = () => {
    if (loading) {
      return (
        <div className="dashboard-section">
          <h3>🔍 Browse Farmers</h3>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading farmers...</p>
          </div>
        </div>
      );
    }

    // Filter farmers by location
    const filteredFarmers = farmers.filter(f => {
      if (locationFilter.state) {
        const fState = (f.state || '').trim();
        const sel = (masterData.states || []).find(s => (s.value || '') === locationFilter.state);
        const matchState = fState === locationFilter.state || (sel && (fState === (sel.label || '') || fState === (sel.value || '')));
        if (!matchState) return false;
      }
      if (locationFilter.district) {
        const fd = (f.district || '').trim();
        if (fd !== locationFilter.district) return false;
      }
      if (locationFilter.tehsil) {
        const ft = (f.tehsil || '').trim();
        const fv = (f.village || '').trim();
        const selT = locationFilter.tehsil.trim();
        if ((!ft || ft !== selT) && (!fv || fv !== selT)) return false;
      }
      return true;
    });

    // Unique districts and tehsils from farmers for filter dropdowns
    const uniqueDistricts = [...new Set(farmers.map(f => f.district).filter(Boolean))].sort();
    const uniqueTehsils = [...new Set(farmers.flatMap(f => [f.tehsil, f.village]).filter(Boolean))].sort();

    return (
      <div className="dashboard-section">
        <h3>🔍 Browse Farmers</h3>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Browse farmers who have made their products available for bidding
        </p>

        {/* Location search filter */}
        <div className="browse-location-filter" style={{ 
          display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem',
          padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb'
        }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>{t('Filter by:', 'फ़िल्टर:')}</span>
          <select
            value={locationFilter.country}
            onChange={(e) => setLocationFilter(prev => ({ ...prev, country: e.target.value }))}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '120px' }}
          >
            <option value="">{t('Country', 'देश')}</option>
            <option value="IN">India</option>
          </select>
          <select
            value={locationFilter.state}
            onChange={(e) => setLocationFilter(prev => ({ ...prev, state: e.target.value, district: '', tehsil: '' }))}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '160px' }}
          >
            <option value="">{t('State', 'राज्य')}</option>
            {(masterData.states || []).map(s => (
              <option key={s.value} value={s.value}>{s.label || s.value}</option>
            ))}
          </select>
          <select
            value={locationFilter.district}
            onChange={(e) => setLocationFilter(prev => ({ ...prev, district: e.target.value, tehsil: '' }))}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '140px' }}
          >
            <option value="">{t('District', 'जिला')}</option>
            {uniqueDistricts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={locationFilter.tehsil}
            onChange={(e) => setLocationFilter(prev => ({ ...prev, tehsil: e.target.value }))}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '140px' }}
          >
            <option value="">{t('Tehsil/Village', 'तहसील/गाँव')}</option>
            {uniqueTehsils.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {(locationFilter.state || locationFilter.district || locationFilter.tehsil || locationFilter.country) && (
            <button
              type="button"
              onClick={() => setLocationFilter({ country: '', state: '', district: '', tehsil: '' })}
              style={{ padding: '0.5rem 0.75rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              {t('Clear', 'साफ़ करें')}
            </button>
          )}
        </div>
        
        {farmers.length === 0 ? (
          <div className="empty-state">
            <p>No farmers with available products found. Check back later.</p>
          </div>
        ) : (
          <div className="farmers-grid">
            {filteredFarmers.length === 0 ? (
              <div className="empty-state">
                <p>{t('No farmers match the selected filters. Try changing location filters.', 'चयनित फ़िल्टर से मेल खाने वाले कोई किसान नहीं। लोकेशन फ़िल्टर बदलें।')}</p>
              </div>
            ) : filteredFarmers.map(farmer => {
              const landArea = farmer.landDetails?.area || farmer.landArea || 'N/A';
              const landUnit = farmer.landDetails?.unit || farmer.landUnit || '';
              const rating = farmer.rating || 0;
              
              return (
                <div key={farmer.id} className="farmer-card">
                  <div className="farmer-header">
                    <h4>{farmer.name || 'Farmer'}</h4>
                    {rating > 0 && (
                      <div className="farmer-rating">⭐ {rating}</div>
                    )}
                  </div>
                  
                  <div className="farmer-location">
                    📍 {farmer.village || 'N/A'}, {farmer.district || 'N/A'}, {farmer.state || 'N/A'}
                  </div>
                  
                  {landArea !== 'N/A' && (
                    <div className="farmer-land">
                      🏞️ Land: {landArea} {landUnit}
                    </div>
                  )}
                  
                  {farmer.products && farmer.products.length > 0 && (
                    <div className="farmer-products">
                      <h5>Available Products:</h5>
                      {farmer.products.map(product => {
                        const hasBid = hasBidForProduct(product.id);
                        const bidStatus = getBidStatusForProduct(product.id);
                        const isBidExpired = bidStatus?.expired === true;
                        const canPlaceBid = !hasBid || isBidExpired;
                        
                        // Format time remaining for display
                        const formatTimeRemaining = (timeRemaining) => {
                          if (!timeRemaining) return '';
                          const { hours, minutes } = timeRemaining;
                          if (hours > 0) {
                            return `${hours}h ${minutes}m`;
                          }
                          return `${minutes}m`;
                        };
                        
                        return (
                          <div key={product.id} className={`product-item ${hasBid && !isBidExpired ? 'bid-placed' : ''}`}>
                            <span className="product-name">{product.name || product.nameEn || 'Product'}</span>
                            <span className="product-quantity">{product.quantity || 0} {product.unit || 'unit'}</span>
                            <span className="product-price">₹{product.expectedPrice || product.price || 0}/{product.unit || 'unit'}</span>
                            {hasBid && !isBidExpired ? (
                              <span className="bid-placed-label" style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                                {bidStatus?.timeRemaining ? `Bid Placed · ⏰ ${formatTimeRemaining(bidStatus.timeRemaining)} left` : t('Bid Placed', 'बोली लगाई गई')}
                              </span>
                            ) : canPlaceBid ? (
                              <button 
                                className="btn btn-xs btn-primary"
                                disabled={placingBid}
                                onClick={() => {
                                  const quantity = prompt('Enter quantity needed:');
                                  if (!quantity) return;
                                  const price = prompt('Enter your bid price:');
                                  if (!price) return;
                                  const message = prompt('Enter message (optional):') || '';
                                  handlePlaceBid(farmer, product, {
                                    quantity: parseFloat(quantity),
                                    bidPrice: parseFloat(price),
                                    message
                                  });
                                }}
                              >
                                {t('Place Bid', 'बोली लगाएं')}
                              </button>
                            ) : (
                              <span className="bid-expired-label" style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{t('Bid Expired', 'बोली समाप्त')}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderOrders = () => (
    <div className="dashboard-section">
      <h3>📦 Orders</h3>
      <p>Your order history and status</p>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet. Your completed bids will appear here as orders.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h4>Order #{order.id}</h4>
                <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-details">
                <p><strong>Farmer:</strong> {order.farmerName}</p>
                <p><strong>Product:</strong> {order.productName}</p>
                <p><strong>Quantity:</strong> {order.quantity} units</p>
                <p><strong>Total Amount:</strong> ₹{order.totalAmount || 0}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleUpdateProfile = async () => {
    const buyerId = user?.user?.id;
    if (!buyerId) return;
    setProfileUpdating(true);
    try {
      const res = await updateBuyerProfile(buyerId, {
        email: emailRef.current?.value ?? undefined,
        buyerProfile: {
          businessAddress: addressRef.current?.value ?? undefined,
          village: villageRef.current?.value ?? undefined,
          tehsil: tehsilRef.current?.value ?? undefined,
          district: districtRef.current?.value ?? undefined,
          state: stateRef.current?.value ?? undefined,
          pincode: pincodeRef.current?.value ?? undefined,
          contactPerson: contactPersonRef.current?.value ?? undefined
        }
      });
      if (res?.success && res?.buyer) {
        setBuyerProfile(res.buyer);
        alert('Profile updated successfully!');
      } else {
        alert(res?.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating buyer profile:', err);
      alert(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setProfileUpdating(false);
    }
  };

  const renderProfile = () => {
    const profile = buyerProfile || user?.user;
    const bp = profile?.buyerProfile || user?.user?.buyerProfile || {};
    return (
      <div className="dashboard-section">
        <h3>👤 Buyer Profile</h3>
        {profileLoading ? (
          <p>Loading profile...</p>
        ) : (
          <>
            <div className="profile-grid">
              <div className="profile-card">
                <h4>Business Information</h4>
                <div className="profile-info">
                  <div className="info-item">
                    <label>Business Name:</label>
                    <input type="text" value={profile?.name || ''} readOnly className="read-only-input" title="Cannot be changed" />
                    <span className="read-only-hint">(Cannot be changed)</span>
                  </div>
                  <div className="info-item">
                    <label>GST Number:</label>
                    <span>{bp?.gstNumber || bp?.gst || ''} (Cannot be changed)</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <input type="email" ref={emailRef} defaultValue={profile?.email} />
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <input type="tel" value={profile?.phone || ''} readOnly className="read-only-input" title="Cannot be changed" />
                    <span className="read-only-hint">(Cannot be changed)</span>
                  </div>
                  <div className="info-item">
                    <label>Registration Date:</label>
                    <span>
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="profile-card">
                <h4>Business Address</h4>
                <div className="profile-info">
                  <div className="info-item">
                    <label>Address:</label>
                    <textarea ref={addressRef} defaultValue={bp?.businessAddress || ''} placeholder="Complete business address" />
                  </div>
                  <div className="info-item">
                    <label>Village:</label>
                    <input type="text" ref={villageRef} defaultValue={bp?.village || ''} placeholder="Village" />
                  </div>
                  <div className="info-item">
                    <label>Tehsil:</label>
                    <input type="text" ref={tehsilRef} defaultValue={bp?.tehsil || ''} placeholder="Tehsil" />
                  </div>
                  <div className="info-item">
                    <label>District:</label>
                    <input type="text" ref={districtRef} defaultValue={bp?.district || ''} placeholder="District" />
                  </div>
                  <div className="info-item">
                    <label>State:</label>
                    <input type="text" ref={stateRef} defaultValue={bp?.state || ''} placeholder="State" />
                  </div>
                  <div className="info-item">
                    <label>Pincode:</label>
                    <input type="text" ref={pincodeRef} defaultValue={bp?.pincode || ''} placeholder="Pincode" />
                  </div>
                  <div className="info-item">
                    <label>Contact Person:</label>
                    <input type="text" ref={contactPersonRef} defaultValue={bp?.contactPerson || ''} placeholder="Contact person" />
                  </div>
                </div>
              </div>
            </div>
            
            <button
              className="btn btn-primary"
              onClick={handleUpdateProfile}
              disabled={profileUpdating}
            >
              {profileUpdating ? 'Updating...' : 'Update Profile'}
            </button>
          </>
        )}
      </div>
    );
  };

  const renderBids = () => (
    <div className="dashboard-section">
      <h3>💰 {t('My Bids', 'मेरी बोलियाँ')}</h3>
      <p className="section-subtitle" style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
        {t('Products you have bid on. Proceed to payment when offer is accepted.', 'जिन उत्पादों पर आपने बोली लगाई है। ऑफ़र स्वीकृत होने पर भुगतान के लिए आगे बढ़ें।')}
      </p>
      
      {bids.length === 0 ? (
        <div className="empty-state">
          <p>{t('No bids placed yet. Browse farmers and place bids on their products.', 'अभी तक कोई बोली नहीं लगाई। किसानों को ब्राउज़ करें और उनके उत्पादों पर बोली लगाएं।')}</p>
          <button className="btn btn-primary" onClick={() => setActiveSection('browse')} style={{ marginTop: '1rem' }}>
            {t('Browse Farmers', 'किसानों को ब्राउज़ करें')}
          </button>
        </div>
      ) : (
        <div className="bids-table-wrapper">
          <table className="bids-table">
            <thead>
              <tr>
                <th>{t('Farmer', 'किसान')}</th>
                <th>{t('Product', 'उत्पाद')}</th>
                <th>{t('Qty', 'मात्रा')}</th>
                <th>{t('Unit Price', 'इकाई मूल्य')}</th>
                <th>{t('Total', 'कुल')}</th>
                <th>{t('Status', 'स्थिति')}</th>
                <th>{t('Action', 'कार्रवाई')}</th>
              </tr>
            </thead>
            <tbody>
              {bids.map(bid => {
                const bidPrice = bid.bidPrice ?? bid.offeredPrice ?? 0;
                const qty = bid.quantity ?? 0;
                const total = bidPrice * qty;
                const farmerName = bid.farmerName ?? bid.farmer?.user?.name ?? 'Farmer';
                const productName = bid.productName ?? bid.product?.name ?? 'Product';
                const isAccepted = bid.status === 'ACCEPTED';
                const statusLabel = isAccepted ? t('Offer Accepted', 'ऑफ़र स्वीकृत') : 
                  bid.status === 'PLACED' || bid.status === 'COUNTERED' ? t('Bid Placed', 'बोली लगाई') : bid.status;
                return (
                  <tr key={bid.id} className={isAccepted ? 'bid-row-accepted' : ''}>
                    <td data-label={t('Farmer', 'किसान')}>{farmerName}</td>
                    <td data-label={t('Product', 'उत्पाद')}>{productName}</td>
                    <td data-label={t('Qty', 'मात्रा')}>{qty}</td>
                    <td data-label={t('Unit Price', 'इकाई मूल्य')}>₹{Number(bidPrice).toLocaleString()}</td>
                    <td data-label={t('Total', 'कुल')}>₹{total.toLocaleString()}</td>
                    <td data-label={t('Status', 'स्थिति')}>
                      <span className={`status-badge status-${bid.status.toLowerCase()}`}>{statusLabel}</span>
                    </td>
                    <td data-label={t('Action', 'कार्रवाई')}>
                      {isAccepted ? (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => setPaymentBidId(bid.id)}
                        >
                          {t('Proceed to Payment', 'भुगतान करें')}
                        </button>
                      ) : (
                        <span className="bid-action-pending" style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                          {bid.status === 'PLACED' || bid.status === 'COUNTERED' 
                            ? t('Awaiting farmer', 'किसान की प्रतीक्षा') 
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Updated menu order: Profile, Browse, Selected, Place Bid, Orders
  // Bottom navigation items (mobile-first)
  const bottomNavItems = [
    { id: 'home', label: t('Home', 'होम'), icon: '🏠' },
    { id: 'browse', label: t('Market', 'बाज़ार'), icon: '🛒' },
    { id: 'learn', label: t('Learn', 'सीखें'), icon: '📚' },
    { id: 'community', label: t('Community', 'समुदाय'), icon: '👥' },
    { id: 'profile', label: t('Profile', 'प्रोफ़ाइल'), icon: '👤' }
  ];

  const menuItems = [
    { id: 'home', label: t('Home', 'होम'), icon: '🏠' },
    { id: 'profile', label: t('Profile', 'प्रोफ़ाइल'), icon: '👤' },
    { id: 'browse', label: t('Browse', 'ब्राउज़ करें'), icon: '🔍' },
    { id: 'bids', label: t('My Bids', 'मेरी बोलियाँ'), icon: '💰' },
    { id: 'orders', label: t('Orders', 'ऑर्डर'), icon: '📦' }
  ];

  const renderLearn = () => (
    <div className="dashboard-section">
      <h3>📚 Learn</h3>
      <p>Educational content and market insights coming soon...</p>
    </div>
  );

  const renderCommunity = () => (
    <div className="dashboard-section">
      <h3>👥 Community</h3>
      <p>Connect with other buyers and farmers...</p>
    </div>
  );

  const renderPayment = () => {
    const bid = bids.find(b => b.id === paymentBidId);
    if (!bid) return renderBids();
    const items = bidToPaymentItems(bid);
    const recipientName = bid.farmerName ?? bid.farmer?.user?.name ?? null;
    return (
      <PaymentPage
        items={items}
        recordParams={{
          bidId: bid.id,
          payerUserId: user?.user?.id,
          payerRole: 'BUYER'
        }}
        onComplete={() => {
          alert(t('Payment simulation complete! Order will be confirmed.', 'भुगतान सिमुलेशन पूर्ण! ऑर्डर पुष्टि होगा।'));
          setPaymentBidId(null);
          setActiveSection('bids');
          loadBids();
        }}
        onBack={() => { setPaymentBidId(null); setActiveSection('bids'); loadBids(); }}
        t={t}
        context="bid"
        payerRole="BUYER"
        recipientName={recipientName}
      />
    );
  };

  const renderSection = () => {
    if (paymentBidId) return renderPayment();
    switch (activeSection) {
      case 'home': return <HomeDashboard user={user} onNavigate={setActiveSection} />;
      case 'profile': return renderProfile();
      case 'browse': return renderBrowse();
      case 'bids': return renderBids();
      case 'orders': return renderOrders();
      case 'learn': return renderLearn();
      case 'community': return renderCommunity();
      default: return <HomeDashboard user={user} onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="buyer-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="user-info">
              <div className="user-avatar">
                🏢
              </div>
              <div className="user-details">
                <h3>{t('Welcome', 'स्वागत है')}, {user.user?.name}!</h3>
                <p>{t('Buyer Dashboard', 'खरीदार डैशबोर्ड')} • GST: {user.user?.buyerProfile?.gst}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
              <button 
                className="language-toggle"
                onClick={handleLanguageToggle}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.6)',
                  background: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {language === 'en' ? 'हिंदी' : 'English'}
              </button>
              <button 
                className="btn btn-secondary logout-top-right" 
                onClick={onLogout}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(100,116,139,0.5)',
                  background: '#6b7280',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="dashboard-nav">
        <div className="container">
          <div className="nav-menu">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id && !paymentBidId ? 'active' : ''}`}
                onClick={() => { setPaymentBidId(null); setActiveSection(item.id); }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        <div className="container">
          {activeSection === 'home' ? (
            <HomeDashboard 
              user={user} 
              onNavigate={setActiveSection}
              language={language}
              onLanguageChange={setLanguage}
            />
          ) : (
            renderSection()
          )}
        </div>
      </div>

      {/* Bottom Navigation (Mobile-First) */}
      <div className="bottom-nav">
        {bottomNavItems.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BuyerDashboard;
