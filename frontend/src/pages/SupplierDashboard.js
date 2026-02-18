import React, { useState, useEffect } from 'react';
import HomeDashboard from './HomeDashboard';
import { getSupplierProfile, getSupplierMachinery, updateSupplierProfile, getSupplierTypeMaster } from '../utils/api';
import { getStoredLanguage, saveLanguage, t as translate } from '../utils/language';

const SupplierDashboard = ({ user, onLogout }) => {
  const [language, setLanguage] = useState(getStoredLanguage());
  const t = (en, hi = '') => translate(en, hi, language);
  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguage(next);
    saveLanguage(next);
  };
  const [activeSection, setActiveSection] = useState('home');
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    organizationName: '',
    contactName: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: '',
    businessAddress: '',
    village: '',
    tehsil: '',
    district: '',
    state: '',
    pincode: '',
    website: '',
    supplierTypes: []
  });
  
  // Supplier type master (for Edit Profile - services offered)
  const [typeMasterList, setTypeMasterList] = useState([]);
  // Machinery state
  const [machinery, setMachinery] = useState([]);
  const [activeMachineryType, setActiveMachineryType] = useState('farming'); // 'farming' or 'transport'
  const [activeServiceTab, setActiveServiceTab] = useState(null); // code: FARMING_MACHINERY, TRANSPORT_MACHINERY, LABOUR_SERVICES
  const [showMachineryModal, setShowMachineryModal] = useState(false);
  const [editingMachinery, setEditingMachinery] = useState(null);
  const [machineryForm, setMachineryForm] = useState({
    machineryType: '',
    quantity: '',
    coverageArea: '',
    availability: 'AVAILABLE',
    // Transport specific
    capacity: '',
    hasRefrigeration: false,
    // Farming specific
    horsepower: '',
    suitableCrops: []
  });
  
  // Orders state
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    loadSupplierData();
  }, [user]);

  useEffect(() => {
    getSupplierTypeMaster().then(res => {
      if (res?.success && res?.types) setTypeMasterList(res.types);
    }).catch(() => {});
  }, []);
  
  const loadSupplierData = async () => {
    const supplierId = user?.user?.id || user?.id;
    if (!supplierId) return;
    setLoading(true);
    try {
      const [profileRes, machineryRes] = await Promise.all([
        getSupplierProfile(supplierId),
        getSupplierMachinery(supplierId)
      ]);
      if (profileRes?.success && profileRes?.supplier) {
        const s = profileRes.supplier;
        const sp = s.supplierProfile || {};
        const types = (sp.supplierTypes || []).map(st => ({
          code: st?.typeMaster?.code || st,
          name: st?.typeMaster?.name || (st?.typeMaster?.code || st)?.replace(/_/g, ' ') || String(st)
        }));
        setProfile({
          organizationName: sp.organizationName || s.name,
          contactName: sp.contactName || s.name,
          phone: s.phone,
          email: s.email,
          gstNumber: sp.gstNumber || s.gst,
          website: sp.website,
          supplierTypes: types,
          registeredOn: s.createdAt,
          businessAddress: sp.businessAddress,
          village: sp.village,
          tehsil: sp.tehsil,
          district: sp.district,
          state: sp.state,
          pincode: sp.pincode
        });
        if (types.length > 0) setActiveServiceTab(prev => (prev && types.some(t => t.code === prev)) ? prev : types[0].code);
      }
      if (machineryRes?.success && machineryRes?.machinery) {
        setMachinery(machineryRes.machinery);
      } else {
        setMachinery([]);
      }
      setOrders([]);
    } catch (error) {
      console.error('Error loading supplier data:', error);
      setProfile(null);
      setMachinery([]);
    } finally {
      setLoading(false);
    }
  };
  
  const serviceNavLabel = profile?.supplierTypes?.length > 0 ? t('Services', 'सेवाएं') : t('Market', 'बाज़ार');
  const bottomNavItems = [
    { id: 'home', label: t('Home', 'होम'), icon: '🏠' },
    { id: 'machinery', label: serviceNavLabel, icon: '🛒' },
    { id: 'learn', label: t('Learn', 'सीखें'), icon: '📚' },
    { id: 'community', label: t('Community', 'समुदाय'), icon: '👥' },
    { id: 'profile', label: t('Profile', 'प्रोफ़ाइल'), icon: '👤' }
  ];

  const menuItems = [
    { id: 'home', label: t('Home', 'होम'), icon: '🏠' },
    { id: 'profile', label: t('Profile', 'प्रोफ़ाइल'), icon: '👤' },
    { id: 'machinery', label: profile?.supplierTypes?.length > 0 ? t('Services', 'सेवाएं') : t('Machinery', 'मशीनरी'), icon: '🚜' },
    { id: 'orders', label: t('Orders', 'ऑर्डर'), icon: '📦' }
  ];
  
  const farmingMachineryTypes = [
    'TRACTOR', 'POWER_TILLER', 'ROTAVATOR', 'SEED_DRILL',
    'SPRAYER', 'HARVESTER', 'THRESHER', 'CULTIVATOR'
  ];
  
  const transportMachineryTypes = [
    'MINI_TRUCK', 'TRACTOR_TROLLEY', '6_WHEELER_TRUCK',
    '10_WHEELER_TRUCK', 'REFRIGERATED_VAN', 'BULK_CARRIER', 'TEMPO'
  ];
  
  const handleSaveProfile = async () => {
    const supplierId = user?.user?.id || user?.id;
    if (!supplierId) return;
    try {
      const res = await updateSupplierProfile(supplierId, {
        name: profileForm.organizationName,
        email: profileForm.email,
        supplierProfile: {
          organizationName: profileForm.organizationName,
          contactName: profileForm.contactName,
          website: profileForm.website || null,
          businessAddress: profileForm.businessAddress || profileForm.address || null,
          village: profileForm.village || null,
          tehsil: profileForm.tehsil || null,
          district: profileForm.district || null,
          state: profileForm.state || null,
          pincode: profileForm.pincode || null,
          supplierTypes: Array.isArray(profileForm.supplierTypes) ? profileForm.supplierTypes : []
        }
      });
      if (res?.success && res?.supplier) {
        const s = res.supplier;
        const sp = s.supplierProfile || {};
        const types = (sp.supplierTypes || []).map(st => ({
          code: st?.typeMaster?.code || st,
          name: st?.typeMaster?.name || (st?.typeMaster?.code || st)?.replace(/_/g, ' ') || String(st)
        }));
        setProfile({
          ...profile,
          email: s.email,
          website: sp.website,
          businessAddress: sp.businessAddress,
          village: sp.village,
          tehsil: sp.tehsil,
          district: sp.district,
          state: sp.state,
          pincode: sp.pincode,
          supplierTypes: types
        });
        if (types.length > 0) {
          setActiveServiceTab(prev => (prev && types.some(t => t.code === prev)) ? prev : types[0].code);
        } else {
          setActiveServiceTab(null);
        }
      }
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error?.message || 'Failed to update profile');
    }
  };
  
  const handleAddMachinery = () => {
    setEditingMachinery(null);
    setMachineryForm({
      machineryType: '',
      quantity: '',
      coverageArea: '',
      availability: 'AVAILABLE',
      capacity: '',
      hasRefrigeration: false,
      horsepower: '',
      suitableCrops: []
    });
    setShowMachineryModal(true);
  };
  
  const handleEditMachinery = (machineryItem) => {
    setEditingMachinery(machineryItem);
    setMachineryForm({
      machineryType: machineryItem.type,
      quantity: machineryItem.quantity,
      coverageArea: machineryItem.coverageArea,
      availability: machineryItem.availability,
      capacity: machineryItem.capacity || '',
      hasRefrigeration: machineryItem.hasRefrigeration || false,
      horsepower: machineryItem.horsepower || '',
      suitableCrops: machineryItem.suitableCrops || []
    });
    setActiveMachineryType(machineryItem.category === 'FARMING' ? 'farming' : 'transport');
    setShowMachineryModal(true);
  };
  
  const handleSaveMachinery = () => {
    if (editingMachinery) {
      // Update existing
      setMachinery(machinery.map(m => 
        m.id === editingMachinery.id 
          ? { ...m, ...machineryForm, category: activeMachineryType === 'farming' ? 'FARMING' : 'TRANSPORT' }
          : m
      ));
    } else {
      // Add new
      const newMachinery = {
        id: `mach_${Date.now()}`,
        type: machineryForm.machineryType,
        category: activeMachineryType === 'farming' ? 'FARMING' : 'TRANSPORT',
        ...machineryForm
      };
      setMachinery([...machinery, newMachinery]);
    }
    setShowMachineryModal(false);
    setEditingMachinery(null);
  };
  
  const handleDeleteMachinery = (machineryId) => {
    if (window.confirm('Are you sure you want to delete this machinery?')) {
      setMachinery(machinery.filter(m => m.id !== machineryId));
    }
  };
  
  const renderProfile = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <div>
          <h3>Supplier Profile</h3>
          <p className="section-subtitle">Manage your organization details and contact information</p>
        </div>
        {!isEditingProfile && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setProfileForm({
                organizationName: profile?.organizationName || '',
                contactName: profile?.contactName || '',
                phone: profile?.phone || '',
                email: profile?.email || '',
                gstNumber: profile?.gstNumber || '',
                address: profile?.businessAddress || profile?.address || '',
                businessAddress: profile?.businessAddress || '',
                village: profile?.village || '',
                tehsil: profile?.tehsil || '',
                district: profile?.district || '',
                state: profile?.state || '',
                pincode: profile?.pincode || '',
                website: profile?.website || '',
                supplierTypes: (profile?.supplierTypes || []).map(t => (t && t.code) ? t.code : t)
              });
              setIsEditingProfile(true);
            }}
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {isEditingProfile ? (
        <div className="profile-section-card">
          <h4>Organization Information</h4>
          <div className="profile-form-grid">
            <div className="form-group">
              <label>Organization Name <span className="required">*</span></label>
              <input
                type="text"
                value={profileForm.organizationName}
                readOnly
                className="read-only-input"
                placeholder="Organization name"
                title="Cannot be changed"
              />
              <span className="read-only-hint">(Cannot be changed)</span>
            </div>
            <div className="form-group">
              <label>Contact Name <span className="required">*</span></label>
              <input
                type="text"
                value={profileForm.contactName}
                readOnly
                className="read-only-input"
                placeholder="Contact person name"
                title="Cannot be changed"
              />
              <span className="read-only-hint">(Cannot be changed)</span>
            </div>
            <div className="form-group">
              <label>Phone <span className="required">*</span></label>
              <input
                type="tel"
                value={profileForm.phone}
                readOnly
                className="read-only-input"
                title="Cannot be changed"
                placeholder="+91 9876543210"
              />
              <span className="read-only-hint">(Cannot be changed)</span>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                placeholder="contact@organization.com"
              />
            </div>
            <div className="form-group">
              <label>GST Number <span className="required">*</span></label>
              <input
                type="text"
                value={profileForm.gstNumber}
                onChange={(e) => setProfileForm({...profileForm, gstNumber: e.target.value})}
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
            <div className="form-group full-width">
              <label>Address <span className="required">*</span></label>
              <textarea
                value={profileForm.businessAddress || profileForm.address}
                onChange={(e) => setProfileForm({...profileForm, businessAddress: e.target.value, address: e.target.value})}
                placeholder="Enter complete business address"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Village</label>
              <input
                type="text"
                value={profileForm.village}
                onChange={(e) => setProfileForm({...profileForm, village: e.target.value})}
                placeholder="Village"
              />
            </div>
            <div className="form-group">
              <label>Tehsil</label>
              <input
                type="text"
                value={profileForm.tehsil}
                onChange={(e) => setProfileForm({...profileForm, tehsil: e.target.value})}
                placeholder="Tehsil"
              />
            </div>
            <div className="form-group">
              <label>District</label>
              <input
                type="text"
                value={profileForm.district}
                onChange={(e) => setProfileForm({...profileForm, district: e.target.value})}
                placeholder="District"
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={profileForm.state}
                onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                placeholder="State"
              />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                value={profileForm.pincode}
                onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})}
                placeholder="Pincode"
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                value={profileForm.website}
                onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                placeholder="https://www.example.com"
              />
            </div>
            <div className="form-group full-width">
              <label>Services you provide</label>
              <div className="profile-form-checkboxes" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                {(typeMasterList.length ? typeMasterList : [
                  { code: 'FARMING_MACHINERY', name: 'Farming Machinery' },
                  { code: 'TRANSPORT_MACHINERY', name: 'Transport Machinery' },
                  { code: 'LABOUR_SERVICES', name: 'Labour Services' }
                ]).map(type => (
                  <label key={type.code} className="toggle-label" style={{ marginRight: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={(profileForm.supplierTypes || []).includes(type.code)}
                      onChange={(e) => {
                        const prev = profileForm.supplierTypes || [];
                        const next = e.target.checked
                          ? [...prev, type.code]
                          : prev.filter(c => c !== type.code);
                        setProfileForm({ ...profileForm, supplierTypes: next });
                      }}
                    />
                    <span>{type.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="section-actions">
            <button className="btn btn-outline" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveProfile}>
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-grid">
          <div className="profile-card">
            <h4>Organization Details</h4>
            <div className="profile-info">
              <div className="info-item">
                <label>Organization Name</label>
                <span>{profile?.organizationName || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Contact Name</label>
                <span>{profile?.contactName || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>GST Number</label>
                <span>{profile?.gstNumber || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Registration Date</label>
                <span>
                  {user?.user?.createdAt || profile?.registeredOn
                    ? new Date(user?.user?.createdAt || profile.registeredOn).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="profile-card">
            <h4>Contact Information</h4>
            <div className="profile-info">
              <div className="info-item">
                <label>Phone</label>
                <span>{profile?.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{profile?.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Website</label>
                <span>{profile?.website || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Business Address</label>
                <span>{profile?.businessAddress || profile?.address || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-card">
            <h4>Location Details</h4>
            <div className="profile-info">
              <div className="info-item">
                <label>Village</label>
                <span>{profile?.village || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Tehsil</label>
                <span>{profile?.tehsil || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>District</label>
                <span>{profile?.district || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>State</label>
                <span>{profile?.state || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Pincode</label>
                <span>{profile?.pincode || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-card">
            <h4>Services provided</h4>
            <div className="profile-info">
              {profile?.supplierTypes && profile.supplierTypes.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {profile.supplierTypes.map(t => (
                    <span key={t.code || t} className="badge badge-primary">
                      {typeof t === 'object' && t.name ? t.name : String(t).replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <span>No services added yet. Edit profile to add services you provide.</span>
              )}
            </div>
          </div>
          
          {profile?.notes && (
            <div className="profile-card">
              <h4>Notes</h4>
              <div className="profile-info">
                <div className="info-item full-width">
                  <span style={{ whiteSpace: 'pre-wrap' }}>{profile.notes}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
  
  const renderMachinery = () => {
    const serviceTypes = profile?.supplierTypes || [];
    const isMachineryTab = activeServiceTab === 'FARMING_MACHINERY' || activeServiceTab === 'TRANSPORT_MACHINERY';
    const categoryForTab = activeServiceTab === 'FARMING_MACHINERY' ? 'FARMING' : activeServiceTab === 'TRANSPORT_MACHINERY' ? 'TRANSPORT' : null;
    const filteredMachinery = categoryForTab ? machinery.filter(m => m.category === categoryForTab) : [];
    const activeTabIsFarming = activeServiceTab === 'FARMING_MACHINERY';
    const activeTabIsTransport = activeServiceTab === 'TRANSPORT_MACHINERY';

    return (
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3>{serviceTypes.length > 0 ? t('Services', 'सेवाएं') : 'Machinery Management'}</h3>
            <p className="section-subtitle">
              {serviceTypes.length > 0
                ? t('Manage inventory for each service you provide', 'आप जो सेवाएं देते हैं उनके लिए इन्वेंटरी प्रबंधित करें')
                : 'Manage your farming and transport machinery inventory'}
            </p>
          </div>
          {isMachineryTab && (
            <button className="btn btn-primary" onClick={handleAddMachinery}>
              + Add Machinery
            </button>
          )}
        </div>
        
        <div className="supplier-machinery-section">
          {serviceTypes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <p>{t('Add services you provide in your Profile to see tabs here.', 'अपनी प्रोफ़ाइल में वे सेवाएं जोड़ें जो आप देते हैं।')}</p>
              <button className="btn btn-primary" onClick={() => setActiveSection('profile')}>
                {t('Go to Profile', 'प्रोफ़ाइल पर जाएं')}
              </button>
            </div>
          ) : (
            <>
          <div className="machinery-type-tabs">
            {serviceTypes.map(t => (
              <button
                key={t.code}
                className={`machinery-type-tab ${activeServiceTab === t.code ? 'active' : ''}`}
                onClick={() => { setActiveServiceTab(t.code); setActiveMachineryType(t.code === 'TRANSPORT_MACHINERY' ? 'transport' : 'farming'); }}
              >
                {t.code === 'FARMING_MACHINERY' && '🚜 '}
                {t.code === 'TRANSPORT_MACHINERY' && '🚚 '}
                {t.code === 'LABOUR_SERVICES' && '👷 '}
                {typeof t === 'object' && t.name ? t.name : String(t).replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          
          {activeServiceTab === 'LABOUR_SERVICES' ? (
            <div className="empty-state">
              <div className="empty-icon">👷</div>
              <p>{t('Labour services management coming soon.', 'श्रम सेवा प्रबंधन जल्द ही।')}</p>
            </div>
          ) : filteredMachinery.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚜</div>
              <p>No {activeTabIsFarming ? 'farming' : 'transport'} machinery added yet</p>
              <button className="btn btn-primary" onClick={() => { setActiveMachineryType(activeTabIsFarming ? 'farming' : 'transport'); handleAddMachinery(); }}>
                Add Your First Machinery
              </button>
            </div>
          ) : (
            <div className="machinery-grid">
              {filteredMachinery.map(item => (
                <div key={item.id} className="machinery-card">
                  <div className="machinery-card-header">
                    <h4 className="machinery-card-title">{item.type.replace('_', ' ')}</h4>
                    <span className={`status-badge status-${item.availability.toLowerCase()}`}>
                      {item.availability}
                    </span>
                  </div>
                  <div className="machinery-card-body">
                    <div className="machinery-detail-row">
                      <span className="machinery-detail-label">Quantity:</span>
                      <span className="machinery-detail-value">{item.quantity}</span>
                    </div>
                    <div className="machinery-detail-row">
                      <span className="machinery-detail-label">Coverage Area:</span>
                      <span className="machinery-detail-value">{item.coverageArea}</span>
                    </div>
                    {item.category === 'FARMING' && item.horsepower && (
                      <div className="machinery-detail-row">
                        <span className="machinery-detail-label">Horsepower:</span>
                        <span className="machinery-detail-value">{item.horsepower}</span>
                      </div>
                    )}
                    {item.category === 'TRANSPORT' && (
                      <>
                        {item.capacity && (
                          <div className="machinery-detail-row">
                            <span className="machinery-detail-label">Capacity:</span>
                            <span className="machinery-detail-value">{item.capacity}</span>
                          </div>
                        )}
                        <div className="machinery-detail-row">
                          <span className="machinery-detail-label">Refrigeration:</span>
                          <span className="machinery-detail-value">
                            {item.hasRefrigeration ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="machinery-actions">
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => handleEditMachinery(item)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteMachinery(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
        
        {/* Machinery Modal */}
        {showMachineryModal && (
          <div className="modal-overlay" onClick={() => setShowMachineryModal(false)}>
            <div className="land-modal machinery-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingMachinery ? 'Edit Machinery' : 'Add Machinery'}</h3>
                <button className="modal-close" onClick={() => setShowMachineryModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="machinery-type-tabs" style={{ marginBottom: '1.5rem' }}>
                  <button
                    className={`machinery-type-tab ${activeMachineryType === 'farming' ? 'active' : ''}`}
                    onClick={() => setActiveMachineryType('farming')}
                  >
                    🚜 Farming
                  </button>
                  <button
                    className={`machinery-type-tab ${activeMachineryType === 'transport' ? 'active' : ''}`}
                    onClick={() => setActiveMachineryType('transport')}
                  >
                    🚚 Transport
                  </button>
                </div>
                
                <div className="machinery-form-grid">
                  <div className="form-group full-width">
                    <label>Machinery Type <span className="required">*</span></label>
                    <select
                      value={machineryForm.machineryType}
                      onChange={(e) => setMachineryForm({...machineryForm, machineryType: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      {(activeMachineryType === 'farming' ? farmingMachineryTypes : transportMachineryTypes).map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Quantity <span className="required">*</span></label>
                    <input
                      type="number"
                      value={machineryForm.quantity}
                      onChange={(e) => setMachineryForm({...machineryForm, quantity: e.target.value})}
                      placeholder="Enter quantity"
                      min="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Coverage Area <span className="required">*</span></label>
                    <input
                      type="text"
                      value={machineryForm.coverageArea}
                      onChange={(e) => setMachineryForm({...machineryForm, coverageArea: e.target.value})}
                      placeholder="e.g., 50 km radius"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Availability <span className="required">*</span></label>
                    <select
                      value={machineryForm.availability}
                      onChange={(e) => setMachineryForm({...machineryForm, availability: e.target.value})}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="BUSY">Busy</option>
                      <option value="MAINTENANCE">Under Maintenance</option>
                    </select>
                  </div>
                  
                  {activeMachineryType === 'transport' && (
                    <>
                      <div className="form-group">
                        <label>Capacity (tons)</label>
                        <input
                          type="text"
                          value={machineryForm.capacity}
                          onChange={(e) => setMachineryForm({...machineryForm, capacity: e.target.value})}
                          placeholder="e.g., 1.5 tons"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={machineryForm.hasRefrigeration}
                            onChange={(e) => setMachineryForm({...machineryForm, hasRefrigeration: e.target.checked})}
                          />
                          <span>Has Refrigeration</span>
                        </label>
                      </div>
                    </>
                  )}
                  
                  {activeMachineryType === 'farming' && (
                    <div className="form-group">
                      <label>Horsepower (HP)</label>
                      <input
                        type="text"
                        value={machineryForm.horsepower}
                        onChange={(e) => setMachineryForm({...machineryForm, horsepower: e.target.value})}
                        placeholder="e.g., 45 HP"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowMachineryModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveMachinery}>
                  {editingMachinery ? 'Update' : 'Add'} Machinery
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderOrders = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <div>
          <h3>Orders</h3>
          <p className="section-subtitle">Track your service orders and bookings</p>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h4>Order #{order.id}</h4>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-details">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Service Type:</strong> {order.serviceType}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const renderLearn = () => (
    <div className="dashboard-section">
      <h3>📚 Learn</h3>
      <p>Educational content and business insights coming soon...</p>
    </div>
  );

  const renderCommunity = () => (
    <div className="dashboard-section">
      <h3>👥 Community</h3>
      <p>Connect with farmers and other suppliers...</p>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'home': return <HomeDashboard user={user} onNavigate={setActiveSection} language={language} onLanguageChange={setLanguage} />;
      case 'profile': return renderProfile();
      case 'machinery': return renderMachinery();
      case 'orders': return renderOrders();
      case 'learn': return renderLearn();
      case 'community': return renderCommunity();
      default: return <HomeDashboard user={user} onNavigate={setActiveSection} language={language} onLanguageChange={setLanguage} />;
    }
  };
  
  if (loading && !profile) {
    return (
      <div className="supplier-dashboard" style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏭</div>
        <h2>Loading Dashboard...</h2>
        <p>Please wait while we load your information.</p>
      </div>
    );
  }
  
  return (
    <div className="supplier-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="user-info">
              <div className="user-avatar">🏭</div>
              <div className="user-details">
                <h3>{profile?.organizationName || t('Supplier', 'सप्लायर')}</h3>
                <p>{t('Supplier Dashboard', 'सप्लायर डैशबोर्ड')}</p>
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
                className="btn btn-outline" 
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
                {t('Logout', 'लॉगआउट')}
              </button>
              <button 
                className="mobile-nav-toggle"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <>
          <div 
            className="mobile-nav-overlay active"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className={`mobile-nav-menu ${mobileNavOpen ? 'active' : ''}`}>
            <div className="mobile-nav-header">
              <h3>Menu</h3>
              <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)}>×</button>
            </div>
            <div className="mobile-nav-items">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  className={`mobile-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileNavOpen(false);
                  }}
                >
                  <span className="mobile-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Navigation */}
      <div className="dashboard-nav">
        <div className="container">
          <div className="nav-menu">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
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

export default SupplierDashboard;
