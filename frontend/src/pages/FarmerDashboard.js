import React, { useState, useEffect } from 'react';
import { getFarmerProfile, addFarmerLocation, getFarmerProducts, addFarmerProduct, setProductAvailability, updateProductStatus, bulkUpdateProductStatus, updateProduct, deleteProduct, searchLGDVillages, getLands, createLand, updateLand, deleteLand, updateFarmerProfile, getMasterData, getSuppliers, getFarmerOffers, getFarmerOrders, respondToOffer } from '../utils/api';
import HomeDashboard from './HomeDashboard';
import logger from '../utils/logger';
import { sanitizeFormData, sanitizeString } from '../utils/sanitize';
import { t as translate, toggleLanguage, getStoredLanguage, saveLanguage } from '../utils/language';

const FarmerDashboard = ({ user, onLogout }) => {
  // ALL HOOKS MUST BE DECLARED FIRST - before any conditional returns
  const [activeSection, setActiveSection] = useState('home');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    profile: null,
    products: [],
    offers: [],
    orders: [],
    machinery: [],
    transport: [],
    testResults: []
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [profileMessage, setProfileMessage] = useState('');
  const [newLocation, setNewLocation] = useState({ village: '', district: '', state: '' });
  const [locationError, setLocationError] = useState('');
  const [locationForm, setLocationForm] = useState({
    village: '',
    tehsil: '',
    district: '',
    state: ''
  });
  const [locationChanged, setLocationChanged] = useState(false);
  const [landChanged, setLandChanged] = useState(false);
  
  // Profile section forms
  const [basicInfoForm, setBasicInfoForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    farmerType: ''
  });
  const [contactInfoForm, setContactInfoForm] = useState({
    primaryPhone: '',
    alternatePhone: '',
    email: '',
    preferredContactMethod: 'SMS'
  });
  const [identityForm, setIdentityForm] = useState({
    aadhaar: '',
    pan: '',
    kycStatus: 'PENDING'
  });
  const [accountForm, setAccountForm] = useState({
    username: '',
    twoFactorEnabled: false,
    lastLogin: null
  });
  const [landDetailsForm, setLandDetailsForm] = useState({
    mainRoadConnectivity: false,
    irrigationSource: '',
    ownershipType: ''
  });
  const [landDetailsChanged, setLandDetailsChanged] = useState(false);
  
  // Section errors
  const [basicInfoErrors, setBasicInfoErrors] = useState({});
  const [contactInfoErrors, setContactInfoErrors] = useState({});
  const [identityErrors, setIdentityErrors] = useState({});
  
  // Track changes for each section
  const [basicInfoChanged, setBasicInfoChanged] = useState(false);
  const [contactInfoChanged, setContactInfoChanged] = useState(false);
  const [identityChanged, setIdentityChanged] = useState(false);
  
  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Lands state
  const [lands, setLands] = useState([]);
  const [landsLoading, setLandsLoading] = useState(false);
  const [showLandModal, setShowLandModal] = useState(false);
  const [editingLand, setEditingLand] = useState(null);
  const [landForm, setLandForm] = useState({
    land_name: '',
    lgd_village_code: '',
    village_name: '',
    state_code: '',
    district_code: '',
    subdistrict_code: '',
    tehsil: '',
    district: '',
    state: '',
    land_area: '',
    land_unit: 'HECTARE',
    ownership_type: 'OWNED',
    latitude: '',
    longitude: '',
    nearby_landmark: '',
    khasra_number: ''
  });
  const [landErrors, setLandErrors] = useState({});
  const [lgdVillageSearch, setLgdVillageSearch] = useState('');
  const [lgdVillageResults, setLgdVillageResults] = useState([]);
  const [showLgdDropdown, setShowLgdDropdown] = useState(false);
  const [capturingGPS, setCapturingGPS] = useState(false);
  
  const [productsLoading, setProductsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [addProductForm, setAddProductForm] = useState({
    selectedProducts: {},
    land_id: '',
    category: ''
  });
  const [productMessage, setProductMessage] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [masterData, setMasterData] = useState({});
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const actionMenuRefs = React.useRef({});
  const [language, setLanguage] = useState(getStoredLanguage());

  const t = (enText, hiText) => translate(enText, hiText, language);

  const handleLanguageToggle = () => {
    const nextLanguage = toggleLanguage(language);
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
  };

  // Safely extract farmerId AFTER all hooks but before validation
  const farmerId = React.useMemo(() => {
    if (!user) return 'farmer_test_001';
    const id = user?.user?.id || user?.id;
    if (!id) {
      logger.error('FarmerDashboard: No farmer ID found in user object', user);
    }
    return id || 'farmer_test_001';
  }, [user]);

  // Validate user prop AFTER all hooks are declared (React Rules of Hooks)
  if (!user) {
    logger.error('FarmerDashboard: user prop is missing');
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error: User data not available</h2>
        <button onClick={onLogout}>Go to Home</button>
      </div>
    );
  }

  logger.debug('FarmerDashboard rendering with user:', user);
  logger.debug('FarmerDashboard farmerId:', farmerId);

  // Mock data for demonstration
  const mockData = {
    profile: {
      name: 'Ravi Kumar',
      email: 'ravi@farmer.com',
      village: 'Rampur',
      district: 'Meerut',
      state: 'Uttar Pradesh',
      landArea: 5.5,
      landUnit: 'HECTARE',
      rating: 4.5,
      totalRatings: 23,
      locations: [
        { village: 'Rampur', district: 'Meerut', state: 'Uttar Pradesh' },
        { village: 'Baraut', district: 'Baghpat', state: 'Uttar Pradesh' }
      ]
    },
    products: [
      {
        id: 'prod_001',
        name: 'Organic Wheat',
        nameHi: 'जैविक गेहूं',
        category: 'CROPS',
        quantity: 100,
        unit: 'quintal',
        expectedPrice: 2500,
        status: 'AVAILABLE_FOR_BID',
        availableForBrowse: true,
        harvestDate: '2024-03-15'
      },
      {
        id: 'prod_002',
        name: 'Fresh Tomatoes',
        nameHi: 'ताजा टमाटर',
        category: 'VEGETABLES',
        quantity: 500,
        unit: 'kg',
        expectedPrice: 30,
        status: 'UNDER_BID',
        availableForBrowse: true,
        harvestDate: '2024-03-20'
      }
    ],
    offers: [
      {
        id: 'offer_001',
        buyerName: 'Krishna Traders',
        productName: 'Fresh Tomatoes',
        offeredPrice: 32,
        quantity: 300,
        message: 'Interested in bulk purchase for premium quality tomatoes',
        status: 'PENDING',
        negotiationRound: 1,
        maxNegotiations: 2,
        createdAt: '2024-01-15T10:00:00Z'
      }
    ],
    machinery: [
      {
        id: 'mach_001',
        name: 'Tractor - Mahindra 575 DI',
        category: 'TRACTOR',
        rentPerDay: 1500,
        specifications: 'HP: 47, Fuel Type: Diesel, 4WD Available',
        location: 'Meerut, UP',
        available: true,
        rating: 4.3,
        providerName: 'AgriTech Solutions'
      },
      {
        id: 'mach_002',
        name: 'Harvester - John Deere',
        category: 'HARVESTER',
        rentPerDay: 3000,
        specifications: 'Cutting Width: 3.6m, Engine: 140HP',
        location: 'Meerut, UP',
        available: true,
        rating: 4.7,
        providerName: 'AgriTech Solutions'
      }
    ],
    transport: [
      {
        id: 'trans_001',
        vehicleType: 'Truck',
        capacity: '10 Tons',
        pricePerKm: 25,
        driverName: 'Suresh Singh',
        driverPhone: '+919876543212',
        location: 'Meerut, UP',
        available: true,
        rating: 4.1,
        providerName: 'Logistics Pro'
      },
      {
        id: 'trans_002',
        vehicleType: 'Mini Truck',
        capacity: '3 Tons',
        pricePerKm: 18,
        driverName: 'Rajesh Kumar',
        driverPhone: '+919876543213',
        location: 'Delhi, DL',
        available: true,
        rating: 4.4,
        providerName: 'Fast Transport'
      }
    ],
    orders: [
      {
        id: 'order_001',
        productName: 'Organic Wheat',
        buyerName: 'Krishna Traders',
        quantity: 50,
        agreedPrice: 2600,
        totalAmount: 130000,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        testProvider: 'AgriQuality Labs',
        transportProvider: 'Logistics Pro',
        deliveryDate: '2024-02-15',
        createdAt: '2024-01-15T10:00:00Z'
      }
    ],
    testResults: [
      {
        id: 'result_001',
        productName: 'Organic Wheat',
        overallGrade: 'A+',
        qualityScore: 94,
        moistureContent: 12.5,
        proteinContent: 11.8,
        recommendations: [
          'Excellent quality wheat suitable for premium markets',
          'Recommended price: ₹2600-2800 per quintal',
          'Storage in moisture-controlled environment advised'
        ],
        priceRecommendation: { min: 2600, max: 2800, suggested: 2700 },
        confidence: 96,
        testDate: '2024-01-20T09:00:00Z'
      }
    ]
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getFarmerProfile(farmerId);
      const farmer = response.farmer || response.profile; // Support both formats
      if (response.success && farmer) {
        const farmerProfile = farmer.farmerProfile || {};
        // Format dateOfBirth for input field (YYYY-MM-DD format)
        // Check both dateOfBirth (from User) and dob (from FarmerProfile)
        let formattedDateOfBirth = null;
        const dobValue = farmer.dateOfBirth || farmerProfile.dob || farmer.dob;
        if (dobValue) {
          const date = new Date(dobValue);
          if (!isNaN(date.getTime())) {
            formattedDateOfBirth = date.toISOString().split('T')[0];
          }
        }
        
        // Decode base64 Aadhaar to numeric for display (backend stores as base64)
        const rawAadhaar = farmer.aadhaar || farmer.aadhaarEncrypted || null;
        const aadhaarForProfile = (() => {
          if (!rawAadhaar || typeof rawAadhaar !== 'string') return null;
          const t = rawAadhaar.trim();
          if (/^\d+$/.test(t)) return t.slice(0, 12);
          try {
            const d = atob(t);
            return /^\d+$/.test(d) ? d.slice(0, 12) : null;
          } catch { return null; }
        })();
        const profileData = {
          name: farmer.name,
          email: farmer.email,
          phone: farmer.phone,
          aadhaar: aadhaarForProfile,
          dateOfBirth: formattedDateOfBirth,
          village: farmerProfile.village,
          tehsil: farmerProfile.tehsil || farmer.tehsil || '',
          district: farmerProfile.district,
          state: farmerProfile.state,
          landArea: farmerProfile.landDetails?.area || farmerProfile.landArea,
          landUnit: farmerProfile.landDetails?.unit || farmerProfile.landUnit,
          mainRoadConnectivity: farmerProfile.landDetails?.mainRoadConnectivity || farmerProfile.mainRoadConnectivity || false,
          irrigationSource: farmerProfile.landDetails?.irrigationSource || farmerProfile.irrigationSource || '',
          ownershipType: farmerProfile.landDetails?.ownershipType || farmerProfile.ownershipType || '',
          selectedProducts: farmerProfile.selectedProducts || {},
          customProducts: farmerProfile.customProducts || [],
          about: farmerProfile.about || farmer.about || '',
          rating: farmerProfile.rating ?? null,
          totalRatings: farmerProfile.totalRatings ?? 0,
          locations: farmerProfile.locations || [],
          farmerProfile: farmerProfile // Include full farmerProfile for backward compatibility
        };
        setData(prev => ({
          ...prev,
          profile: profileData,
          offers: prev.offers?.length ? prev.offers : [],
          orders: prev.orders?.length ? prev.orders : [],
          machinery: prev.machinery,
          transport: prev.transport,
          testResults: prev.testResults
        }));
      } else {
        // API returned but no farmer data - don't use mock, show empty
        logger.warn('Farmer profile API returned no data');
      }
    } catch (error) {
      console.error('Failed to load farmer profile', error);
      // Don't fallback to mock data - it shows wrong user (Ravi Kumar)
      // Keep previous data or empty; user will see loading/error state
      setToast({ show: true, message: 'Failed to load profile. Please refresh.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!farmerId) return;
    try {
      const response = await getFarmerOffers(farmerId);
      if (response.success && response.offers) {
        setData(prev => ({
          ...prev,
          offers: response.offers
        }));
      }
    } catch (error) {
      logger.error('Error loading offers:', error);
    }
  };

  const loadOrders = async () => {
    if (!farmerId) return;
    try {
      const response = await getFarmerOrders(farmerId);
      if (response.success && response.orders) {
        setData(prev => ({
          ...prev,
          orders: response.orders
        }));
      }
    } catch (error) {
      logger.error('Error loading orders:', error);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await getFarmerProducts(farmerId);
      if (response.success) {
        // Backend now returns products in the correct format, but keep mapping for backward compatibility
        // Backend provides: name, price, land_id, category, availableForBrowse
        const mappedProducts = (response.products || []).map(product => ({
          ...product,
          // Ensure name is set (backend now provides it)
          name: product.name || product.nameEn || '',
          // Ensure category is set (backend now provides it)
          category: product.category || product.categoryName || product.categoryId || '',
          // Ensure land_id is set (backend now provides it)
          land_id: product.land_id || product.landId || null
        }));
        setData(prev => ({
          ...prev,
          products: mappedProducts
        }));
      }
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load lands
  const loadLands = async () => {
    setLandsLoading(true);
    try {
      console.log('Loading lands for farmer:', farmerId);
      const response = await getLands(farmerId);
      console.log('Lands response:', response);
      if (response.success) {
        // Normalize lands data - handle both camelCase (Prisma) and snake_case (in-memory) formats
        const normalized = (response.lands || []).map(l => ({
          id: l.id || l.land_id, // Keep original ID for consistency
          land_id: l.id || l.land_id, // Also include land_id for backward compatibility
          land_name: l.landName || l.land_name, // Support both camelCase and snake_case
          state_code: l.stateCode || l.state_code,
          district_code: l.districtCode || l.district_code || l.district, // Support district as fallback
          subdistrict_code: l.subdistrictCode || l.subdistrict_code,
          lgd_village_code: l.lgdVillageCode || l.lgd_village_code,
          village_name: l.villageName || l.village_name,
          // Include plain district/state/tehsil fields for registration data
          district: l.district || l.district_code,
          state: l.state || l.state_code,
          tehsil: l.tehsil,
          nearby_landmark: l.nearbyLandmark || l.nearby_landmark,
          land_area: l.landArea || l.land_area,
          land_unit: l.landUnit || l.land_unit,
          ownership_type: l.ownershipType || l.ownership_type,
          khasra_number: l.khasraNumber || l.khasra_number,
          latitude: l.latitude,
          longitude: l.longitude,
          status: l.status,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt
        }));
        setLands(normalized);
        console.log('Loaded and normalized lands:', normalized.length);
      }
    } catch (error) {
      console.error('Failed to load lands', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLandsLoading(false);
    }
  };

  // Load suppliers
  const loadSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const response = await getSuppliers();
      if (response.success && response.suppliers) {
        setSuppliers(response.suppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Load offers when offers section is active
  useEffect(() => {
    if (activeSection === 'offers' && farmerId) {
      loadOffers();
      // Refresh offers every 30 seconds to check for expiration
      const interval = setInterval(() => {
        loadOffers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeSection, farmerId]);

  // Load master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const data = await getMasterData();
        if (data.success) {
          setMasterData(data.data || {});
        }
      } catch (error) {
        console.error('Failed to load master data:', error);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    try {
      logger.debug('FarmerDashboard useEffect triggered, farmerId:', farmerId);
      if (farmerId && farmerId !== 'farmer_test_001') {
        loadProfile();
        loadProducts();
        loadLands();
        loadOffers(); // Load offers on mount
      } else if (farmerId === 'farmer_test_001') {
        logger.warn('FarmerDashboard: Using fallback farmerId, data may not load correctly');
        loadProfile();
        loadProducts();
        loadLands();
        loadOffers(); // Load offers on mount
      } else {
        logger.error('FarmerDashboard: Cannot load data, farmerId is missing');
      }
    } catch (error) {
      logger.error('FarmerDashboard useEffect error:', error);
      logger.error('Error stack:', error.stack);
    }
  }, [farmerId]); // farmerId is the only dependency needed
  
  // Load orders when orders section is active
  useEffect(() => {
    if (activeSection === 'orders' && farmerId) {
      loadOrders();
    }
  }, [activeSection, farmerId]);

  // Load suppliers when browse-suppliers section is active
  useEffect(() => {
    if (activeSection === 'browse-suppliers') {
      loadSuppliers();
    }
  }, [activeSection]);
  
  // Search LGD villages
  const handleLgdVillageSearch = async (query) => {
    setLgdVillageSearch(query);
    if (query.length < 2) {
      setLgdVillageResults([]);
      setShowLgdDropdown(false);
      return;
    }
    
    try {
      const response = await searchLGDVillages(query, landForm.state_code, landForm.district_code);
      if (response.success) {
        setLgdVillageResults(response.villages || []);
        setShowLgdDropdown(true);
      }
    } catch (error) {
      console.error('Failed to search LGD villages', error);
      setLgdVillageResults([]);
    }
  };
  
  // Select LGD village
  const selectLgdVillage = (village) => {
    setLandForm({
      ...landForm,
      lgd_village_code: village.lgd_village_code,
      village_name: village.village_name,
      state_code: village.state_code,
      district_code: village.district_code,
      subdistrict_code: village.subdistrict_code
    });
    setLgdVillageSearch(village.village_name);
    setShowLgdDropdown(false);
    if (landErrors.lgd_village_code) {
      setLandErrors({ ...landErrors, lgd_village_code: '' });
    }
  };
  
  // Capture GPS location
  const captureGPSLocation = () => {
    setCapturingGPS(true);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      setCapturingGPS(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLandForm({
          ...landForm,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        setCapturingGPS(false);
        showToast('Location captured successfully');
        if (landErrors.latitude || landErrors.longitude) {
          setLandErrors({ ...landErrors, latitude: '', longitude: '' });
        }
      },
      (error) => {
        console.error('GPS capture error:', error);
        showToast('Failed to capture location. Please enable location permissions.', 'error');
        setCapturingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  // Open parcel modal for add/edit
  const openLandModal = (land = null) => {
    console.log('Opening land modal, land:', land);
    if (land) {
      setEditingLand(land);
      setLandForm({
        land_name: land.land_name || '',
        lgd_village_code: land.lgd_village_code || '',
        village_name: land.village_name || '',
        state_code: land.state_code || '',
        district_code: land.district_code || '',
        subdistrict_code: land.subdistrict_code || '',
        district: land.district || '', // Add district for manual location
        state: land.state || '', // Add state for manual location
        tehsil: land.tehsil || '', // Add tehsil
        land_area: land.land_area?.toString() || '',
        land_unit: land.land_unit || '',
        ownership_type: land.ownership_type || 'OWNED',
        khasra_number: land.khasra_number || '',
        latitude: land.latitude?.toString() || '',
        longitude: land.longitude?.toString() || '',
        nearby_landmark: land.nearby_landmark || ''
      });
      setLgdVillageSearch(land.village_name || '');
    } else {
      setEditingLand(null);
      setLandForm({
        land_name: '',
        lgd_village_code: '',
        village_name: '',
        state_code: '',
        district_code: '',
        subdistrict_code: '',
        land_area: '',
        land_unit: '',
        ownership_type: 'OWNED',
        khasra_number: '',
        latitude: '',
        longitude: '',
        nearby_landmark: ''
      });
      setLgdVillageSearch('');
    }
    setLandErrors({});
    setShowLandModal(true);
  };
  
  // Close land modal
  const closeLandModal = () => {
    setShowLandModal(false);
    setEditingLand(null);
    setLandForm({
      land_name: '',
      lgd_village_code: '',
      village_name: '',
      state_code: '',
      district_code: '',
      subdistrict_code: '',
      land_area: '',
      land_unit: '',
      ownership_type: 'OWNED',
      latitude: '',
      longitude: '',
      nearby_landmark: ''
    });
    setLgdVillageSearch('');
    setLandErrors({});
  };
  
  // Save land (create or update)
  const handleSaveLand = async () => {
    const errors = {};
    
    // Validate land name is required
    if (!landForm.land_name || !landForm.land_name.trim()) {
      errors.land_name = 'Land name is required';
    }
    
    // Relaxed validation: Allow either LGD code OR manual location
    // LGD: lgd_village_code is set (when user selects from dropdown)
    // Manual: village_name (from manual entry or LGD search) + district + state
    const hasLGD = !!landForm.lgd_village_code;
    // Allow manual entry: if user typed in LGD search field, use that as village_name
    const manualVillageName = landForm.village_name || (lgdVillageSearch && lgdVillageSearch.trim() && !hasLGD ? lgdVillageSearch.trim() : null);
    const hasManualLocation = !!manualVillageName && !!landForm.district && !!landForm.state;
    
    if (!hasLGD && !hasManualLocation) {
      errors.lgd_village_code = 'Please select a village from the LGD list OR provide Village, District, and State';
    }
    if (!landForm.land_area || parseFloat(landForm.land_area) <= 0) {
      errors.land_area = 'Land area is required and must be greater than 0';
    }
    if (!landForm.land_unit) {
      errors.land_unit = 'Land unit is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setLandErrors(errors);
      return;
    }
    
    setLandErrors({});
    
    // Prepare land data: if using manual location, ensure village_name is set
    const landData = { ...landForm };
    if (!landData.lgd_village_code && !landData.village_name && lgdVillageSearch && lgdVillageSearch.trim()) {
      landData.village_name = lgdVillageSearch.trim();
    }
    
    try {
      setLoading(true);
      if (editingLand) {
        await updateLand(farmerId, editingLand.land_id, landData);
        showToast('Land updated successfully');
      } else {
        await createLand(farmerId, landData);
        showToast('Land created successfully');
      }
      await loadLands();
      closeLandModal();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to save land', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete land
  const handleDeleteLand = async (landId) => {
    // Check if farmer has multiple lands
    if (lands.length <= 1) {
      showToast('At least one land is required on your profile.', 'error');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this land?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await deleteLand(farmerId, landId);
      if (response.success) {
        showToast('Land deleted successfully');
        await loadLands();
      } else {
        showToast(response.error?.message || 'Failed to delete land', 'error');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to delete land';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // View land on map
  const viewLandOnMap = (land) => {
    if (!land.latitude || !land.longitude) {
      showToast('GPS coordinates not available for this land', 'error');
      return;
    }
    const url = `https://www.google.com/maps?q=${land.latitude},${land.longitude}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (data.profile && !profileForm) {
      setProfileForm(data.profile);
    }
  }, [data.profile, profileForm]);

  // Initialize form data from profile when profile loads
  useEffect(() => {
    if (data.profile) {
      setBasicInfoForm({
        fullName: data.profile.name || '',
        dateOfBirth: data.profile.dateOfBirth || '',
        gender: data.profile.farmerProfile?.gender || '',
        farmerType: data.profile.farmerProfile?.farmerType || ''
      });
      checkBasicInfoChanges();
      checkContactInfoChanges();
      checkIdentityChanges();
    }
  }, [data.profile]); // Only depend on data.profile, not the forms
  
  // Check form changes when forms update (moved from renderProfile to fix React hooks error)
  useEffect(() => {
    if (data.profile) {
      checkBasicInfoChanges();
      checkContactInfoChanges();
      checkIdentityChanges();
      checkLandDetailsChanges();
    }
  }, [basicInfoForm, contactInfoForm, identityForm, landDetailsForm, data.profile]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuOpen && !event.target.closest('.row-action-menu')) {
        setActionMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenuOpen]);

  // Position dropdown menus to avoid clipping
  useEffect(() => {
    if (actionMenuOpen) {
      const menuElement = actionMenuRefs.current[actionMenuOpen];
      if (menuElement) {
        // Find the button that triggered this menu
        const menuContainer = menuElement.closest('.row-action-menu');
        const buttonElement = menuContainer?.querySelector('.action-menu-btn');
        
        if (buttonElement) {
          const buttonRect = buttonElement.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const menuHeight = menuElement.offsetHeight || 80; // Get actual height
          const menuWidth = menuElement.offsetWidth || 120; // Get actual width
          
          // Calculate space below and above the button
          const spaceBelow = viewportHeight - buttonRect.bottom;
          const spaceAbove = buttonRect.top;
          
          // Set position to fixed to escape parent overflow constraints
          menuElement.style.position = 'fixed';
          menuElement.style.zIndex = '1000';
          
          // Calculate vertical position
          if (spaceBelow < menuHeight + 20 && spaceAbove > menuHeight + 20) {
            // Not enough space below, but enough above - open upward
            menuElement.style.top = 'auto';
            menuElement.style.bottom = `${viewportHeight - buttonRect.top}px`;
          } else {
            // Enough space below, or not enough above - open downward
            menuElement.style.top = `${buttonRect.bottom + 4}px`;
            menuElement.style.bottom = 'auto';
          }
          
          // Calculate horizontal position (align to right edge of button)
          const rightPosition = viewportWidth - buttonRect.right;
          menuElement.style.left = 'auto';
          menuElement.style.right = `${rightPosition}px`;
          
          // Ensure menu doesn't go off-screen to the right
          if (rightPosition < 0) {
            menuElement.style.right = '10px';
            menuElement.style.left = 'auto';
          }
          
          // Ensure menu doesn't go off-screen to the left
          const leftPosition = buttonRect.left;
          if (leftPosition + menuWidth > viewportWidth) {
            menuElement.style.left = `${Math.max(10, viewportWidth - menuWidth - 10)}px`;
            menuElement.style.right = 'auto';
          }
        }
      }
    }
  }, [actionMenuOpen]);

  const handleToggleProductAvailability = (productId, currentStatus) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(product =>
        product.id === productId
          ? { ...product, availableForBrowse: !currentStatus }
          : product
      )
    }));
  };

  const handleRespondToOffer = async (offerId, action, counterPrice = null, message = '') => {
    if (!farmerId) return;
    
    try {
      setLoading(true);
      const response = await respondToOffer(farmerId, offerId, action, counterPrice, message);
      
      if (response.success) {
        // Reload offers to get updated data
        await loadOffers();
        setToast({
          show: true,
          message: response.message || t('Offer updated successfully', 'ऑफ़र सफलतापूर्वक अपडेट किया गया'),
          type: 'success'
        });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      } else {
        setToast({
          show: true,
          message: response.error?.message || t('Failed to update offer', 'ऑफ़र अपडेट करने में विफल'),
          type: 'error'
        });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      }
    } catch (error) {
      logger.error('Error responding to offer:', error);
      setToast({
        show: true,
        message: error.response?.data?.error?.message || t('Failed to update offer', 'ऑफ़र अपडेट करने में विफल'),
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocationError('');
    setProfileMessage('');

    if (!newLocation.village || !newLocation.district || !newLocation.state) {
      setLocationError('Please fill village, district, and state.');
      return;
    }

    if ((data.profile?.locations?.length || 0) >= 5) {
      setLocationError('You can add up to 5 locations.');
      return;
    }

    try {
      setLoading(true);
      const response = await addFarmerLocation(farmerId, newLocation);
      if (response.success) {
        setData(prev => ({
          ...prev,
          profile: {
            ...(prev.profile || {}),
            locations: response.locations || []
          }
        }));
        setNewLocation({ village: '', district: '', state: '' });
        setProfileMessage('Location added successfully');
      }
    } catch (err) {
      setLocationError(err.response?.data?.error?.message || 'Failed to add location');
    } finally {
      setLoading(false);
    }
  };

  // Product categories (same as registration)
  const productCategories = [
    {
      key: 'FOOD_CEREALS',
      label: 'Food Grains - Cereals (अनाज)',
      options: ['Rice', 'Wheat', 'Maize', 'Jowar (Sorghum)', 'Bajra (Pearl Millet)', 'Ragi (Finger Millet)']
    },
    {
      key: 'FOOD_PULSES',
      label: 'Food Grains - Pulses (दालें)',
      options: ['Tur (Pigeon Pea)', 'Moong (Green Gram)', 'Urad (Black Gram)', 'Chana (Chickpea)', 'Masoor (Lentil)']
    },
    {
      key: 'CASH_FIBRE',
      label: 'Cash Crops - Fibre (रेशेदार)',
      options: ['Cotton', 'Jute']
    },
    {
      key: 'CASH_OILSEEDS',
      label: 'Cash Crops - Oilseeds (तिलहन)',
      options: ['Groundnut (Peanut)', 'Soybean', 'Mustard', 'Linseed', 'Castor']
    },
    {
      key: 'CASH_SUGARCANE',
      label: 'Cash Crops - Sugarcane (गन्ना)',
      options: ['Sugarcane']
    },
    {
      key: 'CASH_TOBACCO',
      label: 'Cash Crops - Tobacco (तम्बाकू)',
      options: ['Tobacco']
    },
    {
      key: 'PLANTATION_BEVERAGES',
      label: 'Plantation - Beverages (पेय)',
      options: ['Tea', 'Coffee']
    },
    {
      key: 'PLANTATION_OTHER',
      label: 'Plantation - Other (अन्य)',
      options: ['Coconut', 'Rubber', 'Areca nut']
    },
    {
      key: 'HORT_FRUITS',
      label: 'Horticulture - Fruits (फल)',
      options: ['Mango', 'Banana', 'Apple', 'Grapes', 'Citrus', 'Papaya', 'Guava']
    },
    {
      key: 'HORT_VEGETABLES',
      label: 'Horticulture - Vegetables (सब्जियां)',
      options: ['Potato', 'Tomato', 'Onion', 'Eggplant', 'Cabbage', 'Cauliflower', 'Gourds', 'Leafy greens']
    },
    {
      key: 'SPICES_OTHERS',
      label: 'Spices & Others (मसाले)',
      options: ['Cardamom', 'Pepper', 'Turmeric', 'Chillies', 'Ginger']
    }
  ];

  const toggleAddProductSelection = (categoryKey, option, checked) => {
    setAddProductForm(prev => {
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

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    setProductMessage('');
    
    if (!addProductForm.category) {
      setProductMessage('Please select a category.');
      return;
    }
    
    const selectedProductsInCategory = addProductForm.selectedProducts[addProductForm.category] || [];
    if (selectedProductsInCategory.length === 0) {
      setProductMessage('Please select at least one product.');
      return;
    }
    
    if (!addProductForm.land_id) {
      setProductMessage('Please select a land.');
      return;
    }

    try {
      setProductsLoading(true);
      
      // Create products for the selected category
      const productPromises = [];
      for (const productName of selectedProductsInCategory) {
        const payload = {
          name: productName,
          category: addProductForm.category,
          quantity: null,
          unit: 'quintal',
          expectedPrice: null,
          harvestDate: null,
          land_id: addProductForm.land_id
        };
        productPromises.push(addFarmerProduct(farmerId, payload));
      }
      
      const responses = await Promise.all(productPromises);
      if (responses.every(r => r.success)) {
        await loadProducts();
        setAddProductForm({
          selectedProducts: {},
          land_id: '',
          category: ''
        });
        setProductMessage(`Successfully added ${productPromises.length} product(s)`);
        setTimeout(() => {
          setShowAddProductModal(false);
          setProductMessage('');
        }, 1500);
      }
    } catch (err) {
      setProductMessage(err.response?.data?.error?.message || 'Failed to add product');
    } finally {
      setProductsLoading(false);
    }
  };

  const formatStatus = (status, availableForBrowse) => {
    if (status === 'PUBLISHED' && availableForBrowse) return 'Bid Ready';
    const statusMap = {
      'DRAFT': 'Draft',
      'PUBLISHED': 'Published',
      'AVAILABLE_FOR_BID': 'Bid Ready',
      'UNDER_BID': 'Under Bid',
      'SUSPENDED': 'Under Bid',
      'SOLD': 'Sold',
      'SOLD_OUT': 'Sold'
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || 'DRAFT').toLowerCase().replace('_', '-');
    if (statusLower === 'available-for-bid') return 'bid-ready';
    return statusLower;
  };

  // Infer category from product name when stored category is OTHER (e.g. products from registration)
  const inferCategoryFromName = (productName) => {
    if (!productName || typeof productName !== 'string') return null;
    const name = String(productName).trim().toLowerCase();
    for (const pc of productCategories) {
      const found = pc.options.some(opt => {
        const optBase = opt.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
        const optAlt = (opt.match(/\(([^)]+)\)/) || [])[1]?.trim().toLowerCase();
        return name === optBase || (optAlt && name === optAlt) || name.includes(optBase) || optBase.includes(name);
      });
      if (found) return pc.label.split(' (')[0].trim();
    }
    return null;
  };

  const formatCategory = (category, productName) => {
    const c = category && typeof category === 'string' ? String(category).trim().toUpperCase() : '';
    if (c && c !== 'OTHER') {
      const match = productCategories.find(pc => pc.key === c);
      if (match) return match.label.split(' (')[0].trim();
      return String(category).replace(/_/g, ' ');
    }
    if (productName) {
      const inferred = inferCategoryFromName(productName);
      if (inferred) return inferred;
    }
    return 'Other';
  };

  const formatLand = (landId) => {
    if (!landId) return 'N/A';
    const land = lands.find(l => (l.land_id === landId) || (l.id === landId));
    if (land) {
      const name = land.land_name || land.khasra_number || 'Untitled Land';
      const loc = [land.village_name || land.village, land.district_code || land.district, land.state_code || land.state].filter(Boolean).join(', ');
      return loc ? `${name} - ${loc}` : name;
    }
    return 'N/A';
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      land_id: product.land_id || ''
    });
    setActionMenuOpen(null);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    
    // Validate required fields
    if (!editingProduct.quantity || !editingProduct.expectedPrice || !editingProduct.harvestDate || !editingProduct.land_id) {
      setProductMessage('Please fill all required fields (Quantity, Price, Harvest Date, and Land)');
      setTimeout(() => setProductMessage(''), 3000);
      return;
    }
    
    try {
      setProductsLoading(true);
      setProductMessage('');
      
      const status = editingProduct.status || 'DRAFT';
      const isBidReady = status === 'AVAILABLE_FOR_BID' || status === 'PUBLISHED';
      const updates = {
        quantity: Number(editingProduct.quantity),
        unit: editingProduct.unit || 'quintal',
        expectedPrice: Number(editingProduct.expectedPrice),
        harvestDate: editingProduct.harvestDate,
        land_id: editingProduct.land_id,
        status,
        availableForBrowse: isBidReady
      };
      
      console.log('Saving product with updates:', updates);
      
      // Call API to update
      const response = await updateProduct(farmerId, editingProduct.id, updates);
      console.log('Update response:', response);
      
      // Reload products to get latest data
      await loadProducts();
      
      // Close modal and show success message
      setEditingProduct(null);
      setProductMessage('Product updated successfully');
      setTimeout(() => setProductMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update product', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update product';
      setProductMessage(errorMessage);
      setTimeout(() => setProductMessage(''), 5000);
      // Reload products on error to ensure UI is in sync
      await loadProducts();
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setProductsLoading(true);
      // Optimistic update
      setData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productToDelete.id)
      }));
      
      await deleteProduct(farmerId, productToDelete.id);
      await loadProducts();
      setProductToDelete(null);
      setShowDeleteConfirm(false);
      setProductMessage('Product deleted successfully');
    } catch (err) {
      console.error('Failed to delete product', err);
      setProductMessage(err.response?.data?.error?.message || 'Failed to delete product');
      await loadProducts(); // Reload on error
    } finally {
      setProductsLoading(false);
    }
  };

  const handleToggleStatusInModal = () => {
    if (!editingProduct) return;
    
    const canMakeAvailable = editingProduct.quantity && editingProduct.expectedPrice && editingProduct.harvestDate;
    if (!canMakeAvailable && !editingProduct.availableForBrowse) {
      setProductMessage('Please set Quantity, Expected Price, and Harvest Date before making available for bidding.');
      return;
    }
    
    const newBidReady = !editingProduct.availableForBrowse;
    setEditingProduct({
      ...editingProduct,
      status: newBidReady ? 'AVAILABLE_FOR_BID' : 'DRAFT',
      availableForBrowse: newBidReady
    });
  };

  // Helper functions to check form changes
  const checkBasicInfoChanges = () => {
    if (!data.profile) return;
    const original = {
      name: data.profile.name || '',
      dateOfBirth: data.profile.dateOfBirth || '',
      gender: data.profile.gender || '',
      farmerType: data.profile.farmerType || ''
    };
    const changed = JSON.stringify(original) !== JSON.stringify(basicInfoForm);
    setBasicInfoChanged(changed);
  };

  const checkContactInfoChanges = () => {
    if (!data.profile) return;
    const original = {
      phone: data.profile.phone || '',
      alternatePhone: data.profile.alternatePhone || '',
      email: data.profile.email || '',
      preferredContactMethod: data.profile.preferredContactMethod || 'SMS'
    };
    const changed = JSON.stringify(original) !== JSON.stringify(contactInfoForm);
    setContactInfoChanged(changed);
  };

  const checkIdentityChanges = () => {
    if (!data.profile) return;
    const rawAadhaar = data.profile.aadhaar || data.profile.aadhaarEncrypted || data.profile.farmerProfile?.aadhaar || '';
    const original = {
      aadhaar: parseAadhaarForDisplay(rawAadhaar),
      pan: data.profile.pan || '',
      kycStatus: data.profile.kycStatus || 'PENDING'
    };
    const changed = JSON.stringify(original) !== JSON.stringify(identityForm);
    setIdentityChanged(changed);
  };

  const checkLandDetailsChanges = () => {
    if (!data.profile) return;
    const landDetails = data.profile.farmerProfile?.landDetails || {};
    const original = {
      mainRoadConnectivity: data.profile.mainRoadConnectivity ?? landDetails.mainRoadConnectivity ?? false,
      irrigationSource: data.profile.irrigationSource || landDetails.irrigationSource || '',
      ownershipType: data.profile.ownershipType || landDetails.ownershipType || ''
    };
    const changed = JSON.stringify(original) !== JSON.stringify(landDetailsForm);
    setLandDetailsChanged(changed);
  };

  // Initialize section forms when profile loads
  useEffect(() => {
    if (data.profile) {
      setBasicInfoForm({
        fullName: data.profile.name || '',
        dateOfBirth: data.profile.dateOfBirth || '',
        gender: data.profile.gender || '',
        farmerType: data.profile.farmerType || ''
      });
      
      setContactInfoForm({
        primaryPhone: data.profile.phone || '',
        alternatePhone: data.profile.alternatePhone || '',
        email: data.profile.email || '',
        preferredContactMethod: data.profile.preferredContactMethod || 'SMS'
      });
      
      setIdentityForm({
        aadhaar: parseAadhaarForDisplay(data.profile.aadhaar || data.profile.aadhaarEncrypted || data.profile.farmerProfile?.aadhaar),
        pan: data.profile.pan || '',
        kycStatus: data.profile.kycStatus || 'PENDING'
      });
      
      setAccountForm({
        username: data.profile.phone || data.profile.username || '',
        twoFactorEnabled: data.profile.twoFactorEnabled || false,
        lastLogin: data.profile.lastLogin || null
      });
      
      // Initialize Location & Land Details forms
      const firstLocation = data.profile.locations?.[0] || {};
      setLocationForm({
        village: firstLocation.village || data.profile.village || '',
        tehsil: firstLocation.tehsil || '',
        district: firstLocation.district || data.profile.district || '',
        state: firstLocation.state || data.profile.state || ''
      });
      
      const landDetails = data.profile.farmerProfile?.landDetails || {};
      setLandDetailsForm({
        mainRoadConnectivity: data.profile.mainRoadConnectivity ?? landDetails.mainRoadConnectivity ?? false,
        irrigationSource: data.profile.irrigationSource || landDetails.irrigationSource || '',
        ownershipType: data.profile.ownershipType || landDetails.ownershipType || ''
      });
      setTimeout(() => checkLandDetailsChanges(), 0);
    }
  }, [data.profile]);
  
  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // Parse stored Aadhaar to numeric only (handles base64-encoded digits)
  const parseAadhaarForDisplay = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) return trimmed.slice(0, 12); // Already numeric
    try {
      const decoded = atob(trimmed);
      return /^\d+$/.test(decoded) ? decoded.slice(0, 12) : '';
    } catch {
      return '';
    }
  };
  // Mask Aadhaar number (numeric only - show last 4)
  const maskAadhaar = (aadhaar) => {
    const numeric = typeof aadhaar === 'string' && /^\d+$/.test(aadhaar) ? aadhaar : parseAadhaarForDisplay(aadhaar);
    if (!numeric || numeric.length < 4) return 'XXXX-XXXX-XXXX';
    return `XXXX-XXXX-${numeric.slice(-4)}`;
  };
  
  // Validate email
  const validateEmail = (email) => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate PAN
  const validatePAN = (pan) => {
    if (!pan) return true; // Optional field
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };
  
  // Handle Basic Information Save
  const handleSaveBasicInfo = async () => {
    const errors = {};
    
    if (!basicInfoForm.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!basicInfoForm.dateOfBirth) {
      errors.dateOfBirth = 'Date of Birth is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setBasicInfoErrors(errors);
      return;
    }
    
    setBasicInfoErrors({});
    
    try {
      setLoading(true);
      const updatePayload = {
        gender: basicInfoForm.gender,
        farmerType: basicInfoForm.farmerType
      };
      const response = await updateFarmerProfile(farmerId, updatePayload);
      if (response.success) {
        showToast('Basic Information saved successfully');
        setBasicInfoChanged(false);
        loadProfile(); // Reload profile to get latest data
      } else {
        showToast(response.error?.message || 'Failed to save Basic Information', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to save Basic Information', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Contact Information Save
  const handleSaveContactInfo = async () => {
    const errors = {};
    
    if (!contactInfoForm.primaryPhone.trim()) {
      errors.primaryPhone = 'Primary Phone is required';
    }
    if (contactInfoForm.alternatePhone && contactInfoForm.alternatePhone === contactInfoForm.primaryPhone) {
      errors.alternatePhone = 'Alternate Phone must be different from Primary Phone';
    }
    if (contactInfoForm.email && !validateEmail(contactInfoForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!contactInfoForm.preferredContactMethod) {
      errors.preferredContactMethod = 'Preferred Contact Method is required';
    }
    if (contactInfoForm.preferredContactMethod === 'EMAIL' && !contactInfoForm.email) {
      errors.email = 'Email is required when Email is selected as preferred contact method';
    }
    
    if (Object.keys(errors).length > 0) {
      setContactInfoErrors(errors);
      return;
    }
    
    setContactInfoErrors({});
    
    try {
      setLoading(true);
      // TODO: Call API to save contact info
      
      setData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          phone: contactInfoForm.primaryPhone,
          alternatePhone: contactInfoForm.alternatePhone,
          email: contactInfoForm.email,
          preferredContactMethod: contactInfoForm.preferredContactMethod
        }
      }));
      
      setContactInfoChanged(false);
      showToast('Contact Information saved successfully');
    } catch (err) {
      showToast('Failed to save Contact Information', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Identity & Verification Save
  const handleSaveIdentity = async () => {
    const errors = {};
    
    if (identityForm.pan && !validatePAN(identityForm.pan)) {
      errors.pan = 'Please enter a valid PAN (e.g., ABCDE1234F)';
    }
    
    if (Object.keys(errors).length > 0) {
      setIdentityErrors(errors);
      return;
    }
    
    setIdentityErrors({});
    
    try {
      setLoading(true);
      // TODO: Call API to save identity info
      
      const aadhaarNumeric = parseAadhaarForDisplay(identityForm.aadhaar) || identityForm.aadhaar?.replace?.(/\D/g, '')?.slice(0, 12) || '';
      setData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          aadhaar: aadhaarNumeric,
          pan: identityForm.pan,
          kycStatus: identityForm.kycStatus
        }
      }));
      
      setIdentityChanged(false);
      showToast('Identity & Verification information saved successfully');
    } catch (err) {
      showToast('Failed to save Identity & Verification information', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Land Details Save (Main Road Connectivity, Irrigation Source, Ownership Type)
  const handleSaveLandDetails = async () => {
    try {
      setLoading(true);
      const updatePayload = {
        farmerProfile: {
          mainRoadConnectivity: landDetailsForm.mainRoadConnectivity,
          irrigationSource: landDetailsForm.irrigationSource || null,
          ownershipType: landDetailsForm.ownershipType || null
        }
      };
      const response = await updateFarmerProfile(farmerId, updatePayload);
      if (response.success) {
        showToast('Land details saved successfully');
        setLandDetailsChanged(false);
        loadProfile();
      } else {
        showToast(response.error?.message || 'Failed to save land details', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to save land details', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Account & Security Save
  const handleSaveAccount = async () => {
    try {
      setLoading(true);
      // TODO: Call API to save account settings
      
      setData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          twoFactorEnabled: accountForm.twoFactorEnabled
        }
      }));
      
      showToast('Account & Security settings saved successfully');
    } catch (err) {
      showToast('Failed to save Account & Security settings', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Validate GPS coordinates
  const validateGPS = (lat, long) => {
    if (!lat && !long) return true; // Both optional
    const latNum = parseFloat(lat);
    const longNum = parseFloat(long);
    return !isNaN(latNum) && latNum >= -90 && latNum <= 90 &&
           !isNaN(longNum) && longNum >= -180 && longNum <= 180;
  };
  
  // Handle Location Details Save
  const handleSaveLocation = async () => {
    const errors = {};
    
    if (!locationForm.village.trim()) {
      errors.village = 'Village is required';
    }
    if (!locationForm.district.trim()) {
      errors.district = 'District is required';
    }
    if (!locationForm.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setLocationErrors(errors);
      return;
    }
    
    setLocationErrors({});
    
    try {
      setLoading(true);
      // TODO: Call API to save location details
      
      // Update local state
      const updatedLocation = {
        village: locationForm.village,
        tehsil: locationForm.tehsil,
        district: locationForm.district,
        state: locationForm.state
      };
      
      setData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          village: locationForm.village,
          tehsil: locationForm.tehsil,
          district: locationForm.district,
          state: locationForm.state,
          locations: prev.profile.locations?.length 
            ? [{ ...updatedLocation }, ...prev.profile.locations.slice(1)]
            : [updatedLocation]
        }
      }));
      
      setLocationChanged(false);
      showToast('Location Details saved successfully');
    } catch (err) {
      showToast('Failed to save Location Details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedProducts.length === 0) return;
    
    try {
      await bulkUpdateProductStatus(farmerId, selectedProducts, status);
      await loadProducts();
      setSelectedProducts([]);
    } catch (err) {
      console.error('Failed to bulk update status', err);
    }
  };

  const handleToggleAvailability = async (productId, available) => {
    try {
      await setProductAvailability(farmerId, productId, available);
      setData(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === productId ? { ...p, availableForBrowse: available, status: available ? 'AVAILABLE_FOR_BID' : 'DRAFT' } : p)
      }));
    } catch (err) {
      console.error('Failed to update availability', err);
    }
  };

  const renderProfile = () => {
    return (
    <div className="dashboard-section">
      <h3>👤 Profile Management</h3>
        
        {/* Toast Notification */}
        {toast.show && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
            </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="profile-section-card">
          <h4>1. Basic Information</h4>
          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={basicInfoForm.fullName}
                readOnly
                className={`read-only-input ${basicInfoErrors.fullName ? 'error' : ''}`}
                title="Name cannot be changed after registration"
              />
              <span className="read-only-hint">(Cannot be changed)</span>
              {basicInfoErrors.fullName && (
                <span className="error-message">{basicInfoErrors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">
                Date of Birth <span className="required">*</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={basicInfoForm.dateOfBirth}
                readOnly
                className={`read-only-input ${basicInfoErrors.dateOfBirth ? 'error' : ''}`}
                title="Date of Birth cannot be changed after registration"
              />
              <span className="read-only-hint">(Cannot be changed)</span>
              {basicInfoErrors.dateOfBirth && (
                <span className="error-message">{basicInfoErrors.dateOfBirth}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={basicInfoForm.gender}
                onChange={(e) => setBasicInfoForm({ ...basicInfoForm, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="farmerType">Farmer Type</label>
              <select
                id="farmerType"
                value={basicInfoForm.farmerType}
                onChange={(e) => setBasicInfoForm({ ...basicInfoForm, farmerType: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="SMALL">Small</option>
                <option value="MARGINAL">Marginal</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveBasicInfo}
              disabled={!basicInfoChanged || loading}
            >
              {loading ? 'Saving...' : 'Save Basic Information'}
            </button>
          </div>
        </div>
        
        {/* Section 2: Contact Information */}
        <div className="profile-section-card">
          <h4>2. Contact Information</h4>
          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="primaryPhone">
                Primary Phone <span className="required">*</span>
              </label>
              <input
                id="primaryPhone"
                type="tel"
                value={contactInfoForm.primaryPhone}
                readOnly
                className={`read-only-input ${contactInfoErrors.primaryPhone ? 'error' : ''}`}
                title="Phone number cannot be changed after registration"
              />
              <span className="read-only-hint">(Cannot be changed)</span>
              {contactInfoErrors.primaryPhone && (
                <span className="error-message">{contactInfoErrors.primaryPhone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="alternatePhone">Alternate Phone</label>
              <input
                id="alternatePhone"
                type="tel"
                value={contactInfoForm.alternatePhone}
                onChange={(e) => {
                  setContactInfoForm({ ...contactInfoForm, alternatePhone: e.target.value });
                  if (contactInfoErrors.alternatePhone) {
                    setContactInfoErrors({ ...contactInfoErrors, alternatePhone: '' });
                  }
                }}
                className={contactInfoErrors.alternatePhone ? 'error' : ''}
              />
              {contactInfoErrors.alternatePhone && (
                <span className="error-message">{contactInfoErrors.alternatePhone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={contactInfoForm.email}
                onChange={(e) => {
                  setContactInfoForm({ ...contactInfoForm, email: e.target.value });
                  if (contactInfoErrors.email) {
                    setContactInfoErrors({ ...contactInfoErrors, email: '' });
                  }
                }}
                className={contactInfoErrors.email ? 'error' : ''}
              />
              {contactInfoErrors.email && (
                <span className="error-message">{contactInfoErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="preferredContactMethod">
                Preferred Contact Method <span className="required">*</span>
              </label>
              <select
                id="preferredContactMethod"
                value={contactInfoForm.preferredContactMethod}
                onChange={(e) => {
                  setContactInfoForm({ ...contactInfoForm, preferredContactMethod: e.target.value });
                  if (contactInfoErrors.preferredContactMethod) {
                    setContactInfoErrors({ ...contactInfoErrors, preferredContactMethod: '' });
                  }
                }}
                className={contactInfoErrors.preferredContactMethod ? 'error' : ''}
              >
                <option value="">Select Method</option>
                <option value="SMS">SMS</option>
                <option value="CALL">Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
              {contactInfoErrors.preferredContactMethod && (
                <span className="error-message">{contactInfoErrors.preferredContactMethod}</span>
              )}
            </div>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveContactInfo}
              disabled={!contactInfoChanged || loading}
            >
              {loading ? 'Saving...' : 'Save Contact Information'}
            </button>
          </div>
        </div>
        
        {/* Section 3: Identity & Verification */}
        <div className="profile-section-card">
          <h4>3. Identity & Verification</h4>
          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="aadhaar">Aadhaar</label>
              <input
                id="aadhaar"
                type="text"
                value={parseAadhaarForDisplay(identityForm.aadhaar) || identityForm.aadhaar}
                readOnly
                className="read-only-input"
                placeholder="12-digit Aadhaar"
                title="Aadhaar cannot be changed after registration"
              />
              {identityForm.aadhaar && identityForm.aadhaar.length >= 4 && (
                <div className="field-hint">
                  Display: {maskAadhaar(identityForm.aadhaar)}
                </div>
              )}
              <span className="read-only-hint">(Cannot be changed)</span>
            </div>

            <div className="form-group">
              <label htmlFor="pan">PAN</label>
              <input
                id="pan"
                type="text"
                value={identityForm.pan}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                  setIdentityForm({ ...identityForm, pan: value });
                  if (identityErrors.pan) {
                    setIdentityErrors({ ...identityErrors, pan: '' });
                  }
                  setIdentityChanged(true);
                }}
                className={identityErrors.pan ? 'error' : ''}
                placeholder="ABCDE1234F"
                maxLength="10"
              />
              {identityErrors.pan && (
                <span className="error-message">{identityErrors.pan}</span>
              )}
          </div>

            <div className="form-group">
              <label>KYC Status</label>
              <div className="read-only-field">
                <span className={`kyc-badge kyc-${identityForm.kycStatus.toLowerCase()}`}>
                  {identityForm.kycStatus === 'VERIFIED' ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
            </div>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveIdentity}
              disabled={!identityChanged || loading}
            >
              {loading ? 'Saving...' : 'Save Identity & Verification'}
            </button>
        </div>
      </div>
      
        {/* Section 4: Account & Security */}
        <div className="profile-section-card">
          <h4>4. Account & Security</h4>
          <div className="profile-form-grid">
            <div className="form-group">
              <label>Username</label>
              <div className="read-only-field">
                <input
                  type="text"
                  value={accountForm.username}
                  readOnly
                  className="read-only-input"
                />
                <span className="read-only-hint">(Default: Primary Phone - Cannot be changed)</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="twoFactorEnabled">Two-Factor Authentication</label>
              <div className="toggle-group">
                <label className="toggle-label">
                  <input
                    id="twoFactorEnabled"
                    type="checkbox"
                    checked={accountForm.twoFactorEnabled}
                    onChange={(e) => setAccountForm({ ...accountForm, twoFactorEnabled: e.target.checked })}
                  />
                  <span>{accountForm.twoFactorEnabled ? 'Yes' : 'No'}</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Last Login</label>
              <div className="read-only-field">
                <span>
                  {accountForm.lastLogin
                    ? new Date(accountForm.lastLogin).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : 'Never logged in'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Registration Date</label>
              <div className="read-only-field">
                <span>
                  {user?.user?.createdAt || data.profile?.createdAt
                    ? new Date(user?.user?.createdAt || data.profile?.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAccount}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Account & Security'}
            </button>
          </div>
        </div>

        {/* Section 5: Registration Information (Read-Only) */}
        <div className="profile-section-card">
          <h4>5. Registration Information</h4>
          
          <div className="profile-form-grid">
            {/* Date of Birth - greyed out, cannot be changed */}
            <div className="form-group">
              <label>Date of Birth</label>
              <div className="read-only-field" style={{ padding: '0.5rem', background: '#f9fafb', color: '#6b7280', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                <span>
                  {data.profile?.dateOfBirth 
                    ? new Date(data.profile.dateOfBirth).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'Not provided'}
                </span>
              </div>
              <span className="read-only-hint">(Cannot be changed)</span>
            </div>

            {/* Location Details */}
            <div className="form-group">
              <label>Tehsil</label>
              <div className="read-only-field">
                <span>{data.profile?.tehsil || 'Not provided'}</span>
              </div>
            </div>

            {/* Land Details - editable */}
            <div className="form-group">
              <label>Main Road Connectivity</label>
              <label className="product-tile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={landDetailsForm.mainRoadConnectivity || false}
                  onChange={(e) => {
                    setLandDetailsForm({ ...landDetailsForm, mainRoadConnectivity: e.target.checked });
                    setLandDetailsChanged(true);
                  }}
                />
                <span>Yes</span>
              </label>
            </div>

            <div className="form-group">
              <label>Irrigation Source</label>
              <select
                value={landDetailsForm.irrigationSource || ''}
                onChange={(e) => {
                  setLandDetailsForm({ ...landDetailsForm, irrigationSource: e.target.value });
                  setLandDetailsChanged(true);
                }}
              >
                <option value="">Select Source</option>
                {(masterData.irrigationSources || [
                  { value: 'TUBE_WELL', label: 'Tube Well' },
                  { value: 'CANAL', label: 'Canal' },
                  { value: 'RAINWATER', label: 'Rainwater' },
                  { value: 'RIVER', label: 'River' },
                  { value: 'POND', label: 'Pond' },
                  { value: 'OTHER', label: 'Other' }
                ]).map(src => (
                  <option key={src.value} value={src.value}>{src.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ownership Type</label>
              <select
                value={landDetailsForm.ownershipType || ''}
                onChange={(e) => {
                  setLandDetailsForm({ ...landDetailsForm, ownershipType: e.target.value });
                  setLandDetailsChanged(true);
                }}
              >
                <option value="">Select Type</option>
                {(masterData.ownershipTypes || [
                  { value: 'OWNED', label: 'Owned' },
                  { value: 'LEASED', label: 'Leased' },
                  { value: 'SHARED', label: 'Shared' }
                ]).map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          {landDetailsChanged && (
            <div className="section-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveLandDetails}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Land Details'}
              </button>
            </div>
          )}

          {/* Selected Products */}
          {data.profile?.selectedProducts && Object.keys(data.profile.selectedProducts).length > 0 && (
            <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
              <label>Selected Products</label>
              <div className="read-only-field" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px' }}>
                {Object.entries(data.profile.selectedProducts).map(([category, products]) => (
                  products && products.length > 0 && (
                    <div key={category} style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#374151' }}>
                        {category.replace(/_/g, ' ')}:
                      </strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {products.map((product, idx) => (
                          <span key={idx} style={{ 
                            background: '#e5e7eb', 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}>
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Custom Products */}
          {data.profile?.customProducts && data.profile.customProducts.length > 0 && (
            <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
              <label>Custom Products</label>
              <div className="read-only-field" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {data.profile.customProducts.map((product, idx) => (
                    <span key={idx} style={{ 
                      background: '#e5e7eb', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          {data.profile?.about && (
            <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
              <label>About Your Farming</label>
              <div className="read-only-field" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                {data.profile.about}
              </div>
            </div>
          )}
        </div>

        {/* Section 6: My Lands */}
        <div className="location-land-divider">
          <div className="divider-content">
            <span className="divider-icon">📍</span>
            <h3>My Lands</h3>
          </div>
        </div>
        
        <div className="lands-section">
          <div className="lands-header">
            <div className="lands-header-content">
              <h4>My Lands</h4>
              <p className="section-description">Add and manage multiple lands. You can add land using LGD village code or manual village details.</p>
            </div>
            <button
              className="btn btn-primary add-land-btn"
              onClick={() => openLandModal()}
            >
              ➕ Add Land
            </button>
          </div>
          
          {landsLoading ? (
            <div className="loading-state">Loading lands...</div>
          ) : lands.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🌾</span>
              <p>No lands added yet. Click "Add Land" to get started.</p>
            </div>
          ) : (
            <div className="lands-grid">
              {lands.map(land => {
                // Filter out N/A values for location display
                const locationParts = [
                  land.village_name,
                  land.district_code,
                  land.state_code
                ].filter(Boolean);
                
                return (
                  <div key={land.id || land.land_id} className="land-card">
                    <div className="land-card-header">
                      <h5 className="land-title">
                        {land.khasra_number || land.land_name || 'Untitled Land'}
                        {land.district_code && (
                          <span className="muted"> ({land.district_code})</span>
                        )}
                      </h5>
                      <span className={`land-status-badge land-status-${land.status?.toLowerCase() || 'saved'}`}>
                        {land.status || 'SAVED'}
                      </span>
                    </div>
                    
                    <div className="land-card-body">
                      {/* Land Area & Ownership - grouped together */}
                      <div className="land-meta">
                        <span>📐 {land.land_area} {land.land_unit || 'units'}</span>
                        <span className="meta-separator">•</span>
                        <span>{land.ownership_type || 'OWNED'}</span>
                      </div>
                      
                      {/* Location details - hide if empty */}
                      <div className="land-location">
                        {locationParts.length > 0 && (
                          <div className="location-item">
                            <span className="location-label">📌 Village:</span>
                            <span className="location-value">{land.village_name}</span>
                          </div>
                        )}
                        {land.district_code && (
                          <div className="location-item">
                            <span className="location-label">🏛 District:</span>
                            <span className="location-value">{land.district_code}</span>
                          </div>
                        )}
                        {land.lgd_village_code && (
                          <div className="location-item">
                            <span className="location-label">🧾 LGD:</span>
                            <span className="location-value">{land.lgd_village_code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="land-card-actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openLandModal(land)}
                        title="Edit land details"
                      >
                        ✏️ Edit
                      </button>
                      {land.latitude && land.longitude && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => viewLandOnMap(land)}
                          title="View on Map"
                        >
                          🗺️ Map
                        </button>
                      )}
                      <button
                        className="btn-link-danger"
                        onClick={() => handleDeleteLand(land.id || land.land_id)}
                        disabled={lands.length === 1}
                        title={lands.length === 1 ? "At least one land is required" : "Delete land"}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Land Modal */}
        {showLandModal && (
          <div className="modal-overlay" onClick={closeLandModal}>
            <div className="land-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                <h3>{editingLand ? 'Edit Land' : 'Add New Land'}</h3>
                  <p className="modal-subtitle">
                    {editingLand ? 'Update your land details' : 'Add a new land to your profile. You can add land using LGD village code or manual village details.'}
                  </p>
                </div>
                <button className="modal-close" onClick={closeLandModal}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="profile-form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="land_name">
                      Land Name <span className="required">*</span>
                    </label>
                    <input
                      id="land_name"
                      type="text"
                      value={landForm.land_name}
                      onChange={(e) => setLandForm({ ...landForm, land_name: e.target.value })}
                      placeholder="e.g., Home Farm, Canal Field"
                      className={landErrors.land_name ? 'error' : ''}
                    />
                    {landErrors.land_name && (
                      <span className="error-message">{landErrors.land_name}</span>
                    )}
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="lgd_village">
                      Village or LGD Code <span className="required">*</span>
                    </label>
                    <div className="lgd-search-wrapper">
                      <input
                        id="lgd_village"
                        type="text"
                        value={lgdVillageSearch}
                        onChange={(e) => handleLgdVillageSearch(e.target.value)}
                        onFocus={() => lgdVillageSearch.length >= 2 && setShowLgdDropdown(true)}
                        placeholder="Search village by name or LGD code..."
                        className={landErrors.lgd_village_code ? 'error' : ''}
                      />
                      {showLgdDropdown && lgdVillageResults.length > 0 && (
                        <div className="lgd-dropdown">
                          {lgdVillageResults.map(village => (
                            <div
                              key={village.lgd_village_code}
                              className="lgd-option"
                              onClick={() => selectLgdVillage(village)}
                            >
                              <div className="lgd-option-name">{village.village_name}</div>
                              <div className="lgd-option-details">
                                {village.district_name}, {village.state_name} • Code: {village.lgd_village_code}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {landErrors.lgd_village_code && (
                      <span className="error-message">{landErrors.lgd_village_code}</span>
                    )}
                    {landForm.village_name && (
                      <div className="field-hint">
                        Selected: {landForm.village_name} ({landForm.lgd_village_code})
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="tehsil">Tehsil</label>
                    <input
                      id="tehsil"
                      type="text"
                      value={landForm.tehsil || ''}
                      onChange={(e) => setLandForm({ ...landForm, tehsil: e.target.value })}
                      placeholder="Enter tehsil name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="district">District</label>
                    <input
                      id="district"
                      type="text"
                      value={landForm.district || ''}
                      onChange={(e) => setLandForm({ ...landForm, district: e.target.value })}
                      placeholder="Enter district name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <select
                      id="state"
                      value={landForm.state || ''}
                      onChange={(e) => setLandForm({ ...landForm, state: e.target.value })}
                    >
                      <option value="">Select State</option>
                      {masterData.states?.map(state => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="khasra_number">Khasra Number</label>
                    <input
                      id="khasra_number"
                      type="text"
                      value={landForm.khasra_number || ''}
                      onChange={(e) => setLandForm({ ...landForm, khasra_number: e.target.value })}
                      placeholder="Enter Khasra Number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="land_area">
                      Land Area <span className="required">*</span>
                    </label>
                    <input
                      id="land_area"
                      type="number"
                      step="0.1"
                      value={landForm.land_area}
                      onChange={(e) => setLandForm({ ...landForm, land_area: e.target.value })}
                      className={landErrors.land_area ? 'error' : ''}
                    />
                    {landErrors.land_area && (
                      <span className="error-message">{landErrors.land_area}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="land_unit">
                      Land Unit <span className="required">*</span>
                    </label>
                    <select
                      id="land_unit"
                      value={landForm.land_unit}
                      onChange={(e) => setLandForm({ ...landForm, land_unit: e.target.value })}
                      className={landErrors.land_unit ? 'error' : ''}
                    >
                      <option value="">Select Unit</option>
                      {(masterData.landUnits || [
                        { value: 'ACRE', label: 'Acre' },
                        { value: 'HECTARE', label: 'Hectare' },
                        { value: 'BIGHA', label: 'Bigha' },
                        { value: 'KATHA', label: 'Katha' },
                        { value: 'GUNTHA', label: 'Guntha' }
                      ]).map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                    {landErrors.land_unit && (
                      <span className="error-message">{landErrors.land_unit}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="ownership_type">Ownership Type</label>
                    <select
                      id="ownership_type"
                      value={landForm.ownership_type}
                      onChange={(e) => setLandForm({ ...landForm, ownership_type: e.target.value })}
                    >
                      {(masterData.ownershipTypes || [
                        { value: 'OWNED', label: 'Owned' },
                        { value: 'LEASED', label: 'Leased' },
                        { value: 'SHARED', label: 'Shared' }
                      ]).map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>GPS Coordinates</label>
                    <div className="gps-capture-group">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={captureGPSLocation}
                        disabled={capturingGPS}
                      >
                        {capturingGPS ? '📍 Capturing...' : '📍 Capture Location'}
                      </button>
                      {landForm.latitude && landForm.longitude && (
                        <span className="gps-display">
                          {parseFloat(landForm.latitude).toFixed(6)}, {parseFloat(landForm.longitude).toFixed(6)}
                        </span>
                      )}
                    </div>
                    <div className="field-hint">GPS coordinates are optional but recommended for accurate mapping</div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="nearby_landmark">Nearby Landmark</label>
                    <input
                      id="nearby_landmark"
                      type="text"
                      value={landForm.nearby_landmark}
                      onChange={(e) => setLandForm({ ...landForm, nearby_landmark: e.target.value })}
                      placeholder="e.g., Near Main Road, Behind School"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeLandModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-primary ${loading ? 'loading' : ''}`}
                  onClick={handleSaveLand}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingLand ? 'Update Land' : 'Create Land'}
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  };

  const renderProducts = () => {
    // Calculate summary
    const summary = {
      total: data.products?.length || 0,
      draft: data.products?.filter(p => (p.status || 'DRAFT') === 'DRAFT').length || 0,
      available: data.products?.filter(p => p.availableForBrowse === true).length || 0,
      categories: new Set(data.products?.map(p => p.category) || []).size
    };

    // Get unique categories
    const categories = [...new Set(data.products?.map(p => p.category) || [])];

    // Filter products
    const filteredProducts = (data.products || []).filter(product => {
      const matchesSearch = !productSearch || 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        formatCategory(product.category, product.name).toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = !productCategoryFilter || product.category === productCategoryFilter;
      const matchesStatus = !productStatusFilter || (product.status || 'DRAFT') === productStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
    <div className="dashboard-section">
      <div className="products-header">
        <div className="products-header-content">
          <h4>🌱 My Products</h4>
          <p className="section-description">Manage your product inventory and listings.</p>
        </div>
        <button 
          className="btn btn-primary add-product-btn"
          onClick={() => setShowAddProductModal(true)}
        >
          ➕ Add Product
        </button>
      </div>
      
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-value">{summary.total}</div>
            <div className="summary-label">Total Products</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.draft}</div>
            <div className="summary-label">Draft</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.available}</div>
            <div className="summary-label">Bid Ready</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.categories}</div>
            <div className="summary-label">Categories</div>
          </div>
        </div>

        {/* Inventory Table with Toolbar */}
        <div className="inventory-section">
          <div className="inventory-toolbar">
            <div className="toolbar-left">
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <select
                className="filter-select"
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{formatCategory(cat)}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="AVAILABLE_FOR_BID">Bid Ready</option>
                <option value="UNDER_BID">Under Bid</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
            <div className="toolbar-right">
              <span className="results-count">{filteredProducts.length} product(s)</span>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="product-table-wrapper">
            {productsLoading ? (
              <p>Loading products...</p>
            ) : (
              <table className="product-table">
          <thead>
            <tr>
                    <th className="col-product">Product</th>
                    <th className="col-location">Land</th>
                    <th className="col-quantity">Quantity</th>
                    <th className="col-price">Price</th>
                    <th className="col-harvest">Harvest Date</th>
                    <th className="col-status">Status</th>
                    <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
                  {filteredProducts.map(product => {
                    const landText = formatLand(product.land_id);
                    const landTruncated = landText.length > 30 ? landText.substring(0, 30) + '...' : landText;
                    const status = product.status || 'DRAFT';
                    const displayStatus = product.availableForBrowse ? 'AVAILABLE_FOR_BID' : status;
                    const statusIcon = {
                      'DRAFT': '📝',
                      'PUBLISHED': '✅',
                      'AVAILABLE_FOR_BID': '✅',
                      'UNDER_BID': '💰',
                      'SUSPENDED': '💰',
                      'SOLD': '✔️',
                      'SOLD_OUT': '✔️'
                    }[displayStatus] || '📝';
                    
                    return (
                      <tr key={product.id} className="product-row">
                        <td className="col-product" data-label="Product">
                          <div className="product-name-cell">
                            <div className="product-name">{product.name}</div>
                            <div 
                              className="product-category" 
                              title="Product category for filtering (Cereals, Pulses, Vegetables, etc.). 'Other' means uncategorized."
                            >
                              {formatCategory(product.category || 'OTHER', product.name)}
                            </div>
                          </div>
                        </td>
                        <td className="col-location" data-label="Land">
                          <span 
                            className="location-text" 
                            title={landText}
                          >
                            {landTruncated}
              </span>
                        </td>
                        <td className="col-quantity" data-label="Quantity">
                          {product.quantity ? (
                            <span className="quantity-value">
                              {product.quantity} <span className="quantity-unit">{product.unit || 'quintal'}</span>
                            </span>
                          ) : (
                            <span className="empty-value">-</span>
                          )}
                        </td>
                        <td className="col-price" data-label="Price">
                          {product.expectedPrice ? (
                            <span className="price-value">
                              ₹{product.expectedPrice}
                              {product.unit && <span className="price-unit"> / {product.unit}</span>}
                            </span>
                          ) : (
                            <span className="empty-value">-</span>
                          )}
                        </td>
                        <td className="col-harvest" data-label="Harvest Date">
                          {product.harvestDate ? (
                            <span className="harvest-date">
                              {new Date(product.harvestDate).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          ) : (
                            <span className="empty-value">-</span>
                          )}
                        </td>
                        <td className="col-status" data-label="Status">
                          <span className={`status-badge status-${getStatusBadgeClass(displayStatus)}`}>
                            <span className="status-icon">{statusIcon}</span>
                            <span className="status-text">{formatStatus(status, product.availableForBrowse)}</span>
                          </span>
                        </td>
                        <td className="col-actions" data-label="Actions">
                          <div className="row-action-menu">
                            <button
                              className="action-menu-btn"
                              onClick={() => setActionMenuOpen(actionMenuOpen === product.id ? null : product.id)}
                              aria-label="Actions"
                            >
                              <span className="action-icon">⋮</span>
                            </button>
                            {actionMenuOpen === product.id && (
                              <div 
                                className="action-menu-dropdown"
                                ref={(el) => {
                                  if (el) {
                                    actionMenuRefs.current[product.id] = el;
                                  }
                                }}
                              >
                                <button onClick={() => handleEditProduct(product)}>
                                  <span className="action-item-icon">✏️</span> Edit
                                </button>
                                <button 
                                  className="action-delete"
                                  onClick={() => {
                                    setProductToDelete(product);
                                    setShowDeleteConfirm(true);
                                    setActionMenuOpen(null);
                                  }}
                                >
                                  <span className="action-item-icon">🗑️</span> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-state-cell">
                        <div className="empty-state">
                          <span className="empty-icon">📦</span>
                          <p>No products found. Add your first product above.</p>
                        </div>
                      </td>
            </tr>
                  )}
          </tbody>
        </table>
            )}
      </div>
      
          {/* Add Product Modal */}
          {showAddProductModal && (
            <div className="product-edit-modal-overlay" onClick={() => {
              setShowAddProductModal(false);
              setAddProductForm({ selectedProducts: {}, land_id: '', category: '' });
              setProductMessage('');
            }}>
              <div className="product-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                  <h3>Add Products</h3>
                    <p className="modal-subtitle">Select products from categories and associate them with your land</p>
                  </div>
                  <button className="modal-close" onClick={() => {
                    setShowAddProductModal(false);
                    setAddProductForm({ selectedProducts: {}, land_id: '', category: '' });
                    setProductMessage('');
                  }}>×</button>
    </div>
                <div className="modal-body">
                  <form onSubmit={handleAddProductSubmit}>
                    {/* Land Selection */}
                    <div className="form-group">
                      <label>Land *</label>
                      <select
                        value={addProductForm.land_id}
                        onChange={(e) => setAddProductForm({ ...addProductForm, land_id: e.target.value })}
                        required
                      >
                        <option value="">Select Land</option>
                        {lands.map((land) => (
                          <option key={land.land_id} value={land.land_id}>
                            {land.khasra_number || land.land_name || 'Untitled Land'} - {land.village_name || 'N/A'}, {land.district_code || 'N/A'}
                          </option>
                        ))}
                      </select>
                      {lands.length === 0 && (
                        <p className="form-hint">Please add a land in the "My Lands" section first.</p>
                      )}
      </div>
      
                    {/* Category Selection */}
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        value={addProductForm.category}
                        onChange={(e) => setAddProductForm({ 
                          ...addProductForm, 
                          category: e.target.value,
                          selectedProducts: { ...addProductForm.selectedProducts, [e.target.value]: addProductForm.selectedProducts[e.target.value] || [] }
                        })}
                        required
                      >
                        <option value="">Select Category</option>
                        {productCategories.map(category => (
                          <option key={category.key} value={category.key}>
                            {category.label}
                          </option>
                        ))}
                      </select>
            </div>
            
                    {/* Product Selection for Selected Category */}
                    {addProductForm.category && (
                      <div className="form-group">
                        <label>Select Products *</label>
                        <p className="section-subtitle">Select products from the selected category (tick to select, multiple allowed)</p>
                        <div className="product-grid" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                          {productCategories.find(cat => cat.key === addProductForm.category)?.options.map(option => {
                            const checked = (addProductForm.selectedProducts[addProductForm.category] || []).includes(option);
                            return (
                              <label key={option} className="product-checkbox">
                <input
                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => toggleAddProductSelection(addProductForm.category, option, e.target.checked)}
                />
                                <span>{option}</span>
              </label>
                            );
                          })}
                        </div>
                        {(addProductForm.selectedProducts[addProductForm.category] || []).length > 0 && (
                          <div className="selected-tags" style={{ marginTop: '0.5rem' }}>
                            {(addProductForm.selectedProducts[addProductForm.category] || []).map(item => (
                              <span key={item} className="selected-tag">{item}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {productMessage && (
                      <div className={`alert ${productMessage.includes('Successfully') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
                        {productMessage}
              </div>
                    )}

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setShowAddProductModal(false);
                          setAddProductForm({ selectedProducts: {}, land_id: '', category: '' });
                          setProductMessage('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`btn btn-primary ${productsLoading ? 'loading' : ''}`}
                        disabled={productsLoading}
                      >
                        {productsLoading ? 'Adding...' : 'Add Products'}
                      </button>
            </div>
                  </form>
          </div>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {editingProduct && (
            <div className="product-edit-modal-overlay" onClick={() => setEditingProduct(null)}>
              <div className="product-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                  <h3>Edit Product</h3>
                    <p className="modal-subtitle">Update product details including quantity, price, harvest date, and land association</p>
                  </div>
                  <button className="modal-close" onClick={() => setEditingProduct(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" value={editingProduct.name} disabled />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={formatCategory(editingProduct.category, editingProduct.name)} disabled />
                  </div>
                  <div className="form-group">
                    <label>Land *</label>
                    <select
                      value={editingProduct.land_id || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, land_id: e.target.value })}
                      required
                    >
                      <option value="">Select Land</option>
                      {lands.map((land) => {
                        const landId = land.land_id || land.id;
                        return (
                          <option key={landId} value={landId}>
                            {land.khasra_number || land.land_name || 'Untitled Land'} - {land.village_name || 'N/A'}, {land.district_code || 'N/A'}, {land.state_code || 'N/A'}
                        </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        value={editingProduct.quantity || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit *</label>
                      <select
                        value={editingProduct.unit || 'quintal'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                        required
                      >
                        <option value="kg">Kg</option>
                        <option value="quintal">Quintal</option>
                        <option value="ton">Ton</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Expected Price *</label>
                      <input
                        type="number"
                        value={editingProduct.expectedPrice || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, expectedPrice: e.target.value })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Harvest Date *</label>
                      <input
                        type="date"
                        value={editingProduct.harvestDate || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, harvestDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <div className="status-toggle-group">
                      <span className={`status-badge status-${getStatusBadgeClass(editingProduct.status)}`}>
                        {formatStatus(editingProduct.status || 'DRAFT')}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleToggleStatusInModal}
                        disabled={!editingProduct.quantity || !editingProduct.expectedPrice || !editingProduct.harvestDate}
                        title={
                          (!editingProduct.quantity || !editingProduct.expectedPrice || !editingProduct.harvestDate)
                            ? 'Set Quantity, Price, and Harvest Date first'
                            : 'Toggle status'
                        }
                      >
                        {(editingProduct.status || 'DRAFT') === 'DRAFT' ? 'Make Available' : 'Mark Draft'}
                      </button>
                    </div>
                  </div>
                  {productMessage && (
                    <div className={`alert ${productMessage.includes('Successfully') || productMessage.includes('updated') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
                      {productMessage}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setProductToDelete(editingProduct);
                      setShowDeleteConfirm(true);
                      setEditingProduct(null);
                    }}
                  >
                    Delete
                  </button>
                  <div className="modal-footer-right">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setEditingProduct(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveEdit}
                      disabled={productsLoading}
                    >
                      {productsLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && productToDelete && (
            <div className="product-edit-modal-overlay" onClick={() => {
              setShowDeleteConfirm(false);
              setProductToDelete(null);
            }}>
              <div className="product-edit-modal delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Delete Product</h3>
                  <button className="modal-close" onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDelete(null);
                  }}>×</button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete <strong>{productToDelete.name}</strong>?</p>
                  <p className="delete-warning">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setProductToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteProduct}
                    disabled={productsLoading}
                  >
                    {productsLoading ? 'Deleting...' : 'Delete Product'}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
  };

  const renderOffers = () => {
    // Format time remaining
    const formatTimeRemaining = (timeRemaining) => {
      if (!timeRemaining) return t('Expired', 'समाप्त');
      const { hours, minutes } = timeRemaining;
      if (hours > 0) {
        return t(`${hours}h ${minutes}m remaining`, `${hours}घंटे ${minutes}मिनट शेष`);
      }
      return t(`${minutes}m remaining`, `${minutes}मिनट शेष`);
    };

    return (
      <div className="dashboard-section">
        <h3>{t('💰 Offers from Buyers', '💰 खरीदारों से ऑफ़र')}</h3>
        
        {data.offers?.length === 0 ? (
          <div className="empty-state">
            <p>{t('No offers received yet. Make sure your products are available for browsing!', 'अभी तक कोई ऑफ़र प्राप्त नहीं हुआ। सुनिश्चित करें कि आपके उत्पाद ब्राउज़िंग के लिए उपलब्ध हैं!')}</p>
          </div>
        ) : (
          <div className="offers-list">
            {data.offers?.map(offer => {
              const isExpired = offer.isExpired || offer.status === 'EXPIRED';
              const isPending = offer.status === 'PENDING' || offer.status === 'PLACED';
              const canNegotiate = isPending && (offer.negotiationRound ?? 0) < (offer.maxNegotiations ?? 1) && !isExpired;
              const showCounterPrice = offer.counterPrice && offer.status === 'COUNTERED';
              
              return (
                <div key={offer.id} className={`offer-card ${isExpired ? 'expired' : ''}`}>
                  <div className="offer-header">
                    <div>
                      <h4>{offer.buyerName}</h4>
                      <p className="offer-product-name">{offer.productName}</p>
                    </div>
                    <span className={`status-badge status-${offer.status.toLowerCase()}`}>
                      {offer.status === 'ACCEPTED' 
                        ? (offer.paymentCompleted ? t('Payment Received', 'भुगतान प्राप्त') : t('Payment Pending', 'भुगतान लंबित'))
                        : offer.status}
                    </span>
                  </div>
                  
                  <div className="offer-details">
                    <div className="offer-price-section">
                      <div className="price-item">
                        <span className="price-label">{t('Offered Price', 'प्रस्तावित मूल्य')}:</span>
                        <span className="price-value">₹{offer.offeredPrice} {t('per unit', 'प्रति इकाई')}</span>
                      </div>
                      {showCounterPrice && (
                        <div className="price-item counter-price">
                          <span className="price-label">{t('Your Counter Price', 'आपकी प्रति-मूल्य')}:</span>
                          <span className="price-value">₹{offer.counterPrice} {t('per unit', 'प्रति इकाई')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="offer-meta">
                      <p><strong>{t('Quantity', 'मात्रा')}:</strong> {offer.quantity} {t('units', 'इकाइयाँ')}</p>
                      {offer.message && (
                        <p><strong>{t('Message', 'संदेश')}:</strong> {offer.message}</p>
                      )}
                      {offer.counterMessage && (
                        <p><strong>{t('Counter Message', 'प्रति-संदेश')}:</strong> {offer.counterMessage}</p>
                      )}
                      {(offer.negotiationRound != null || offer.maxNegotiations != null) && (
                        <p><strong>{t('Negotiation Round', 'बातचीत दौर')}:</strong> {offer.negotiationRound ?? 0}/{offer.maxNegotiations ?? 1}</p>
                      )}
                      <p><strong>{t('Received', 'प्राप्त')}:</strong> {new Date(offer.createdAt).toLocaleString()}</p>
                      
                      {/* Time Remaining / Expiration */}
                      {isPending && (
                        <div className={`time-remaining ${isExpired ? 'expired' : ''}`}>
                          {isExpired ? (
                            <span className="expired-badge">⏰ {t('Expired (48 hours limit)', 'समाप्त (48 घंटे की सीमा)')}</span>
                          ) : (
                            <span className="time-badge">⏰ {formatTimeRemaining(offer.timeRemaining)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isPending && !isExpired && (
                    <div className="offer-actions">
                      <button 
                        className="btn btn-success"
                        onClick={() => handleRespondToOffer(offer.id, 'accept')}
                        disabled={loading}
                      >
                        {t('Select', 'स्वीकार करें')}
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => {
                          if (window.confirm(t('Are you sure you want to reject this offer?', 'क्या आप वाकई इस ऑफ़र को अस्वीकार करना चाहते हैं?'))) {
                            handleRespondToOffer(offer.id, 'reject');
                          }
                        }}
                        disabled={loading}
                      >
                        {t('Reject', 'अस्वीकार करें')}
                      </button>
                      {canNegotiate && (
                        <button 
                          className="btn btn-warning"
                          onClick={() => {
                            const counterPrice = prompt(t('Enter your counter price:', 'अपनी प्रति-मूल्य दर्ज करें:'));
                            if (counterPrice && !isNaN(parseFloat(counterPrice)) && parseFloat(counterPrice) > 0) {
                              const message = prompt(t('Enter message (optional):', 'संदेश दर्ज करें (वैकल्पिक):')) || '';
                              handleRespondToOffer(offer.id, 'counter', parseFloat(counterPrice), message);
                            } else if (counterPrice) {
                              alert(t('Please enter a valid price', 'कृपया एक वैध मूल्य दर्ज करें'));
                            }
                          }}
                          disabled={loading}
                        >
                          {t('Negotiate', 'बातचीत करें')} ({offer.maxNegotiations - offer.negotiationRound} {t('left', 'शेष')})
                        </button>
                      )}
                      {offer.negotiationRound >= offer.maxNegotiations && (
                        <div className="negotiation-limit-reached">
                          <p>{t('Maximum negotiations reached. Last offer remains valid.', 'अधिकतम बातचीत पहुंच गई। अंतिम ऑफ़र वैध रहता है।')}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isExpired && (
                    <div className="offer-expired-notice">
                      <p>{t('This offer has expired. The product is now available for browse again.', 'यह ऑफ़र समाप्त हो गया है। उत्पाद अब फिर से ब्राउज़ के लिए उपलब्ध है।')}</p>
                    </div>
                  )}
                  
                  {offer.status === 'ACCEPTED' && (
                    <div className="offer-accepted-notice">
                      <p>✅ {offer.paymentCompleted 
                        ? t('Payment received! See Orders tab for final order details.', 'भुगतान प्राप्त! अंतिम ऑर्डर विवरण के लिए ऑर्डर टैब देखें।')
                        : t('Offer accepted! Awaiting buyer payment.', 'ऑफ़र स्वीकार किया गया! खरीदार के भुगतान की प्रतीक्षा में।')}</p>
                    </div>
                  )}
                  
                  {offer.status === 'REJECTED' && (
                    <div className="offer-rejected-notice">
                      <p>❌ {t('Offer rejected. Product is available for browse again.', 'ऑफ़र अस्वीकार किया गया। उत्पाद फिर से ब्राउज़ के लिए उपलब्ध है।')}</p>
                    </div>
                  )}
                  
                  {offer.status === 'COUNTERED' && (
                    <div className="offer-countered-notice">
                      <p>🔄 {t('Counter offer sent. Waiting for buyer response.', 'प्रति-ऑफ़र भेजा गया। खरीदार की प्रतिक्रिया की प्रतीक्षा कर रहे हैं।')}</p>
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

  const renderMachinery = () => (
    <div className="dashboard-section">
      <h3>🚜 Farming Machinery</h3>
      <p className="section-subtitle">Browse and book farming equipment from service providers</p>
      
      <div className="machinery-table">
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Category</th>
              <th>Specifications</th>
              <th>Rent/Day</th>
              <th>Location</th>
              <th>Provider</th>
              <th>Rating</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.machinery?.map(machine => (
              <tr key={machine.id}>
                <td>{machine.name}</td>
                <td>{machine.category}</td>
                <td>{machine.specifications}</td>
                <td>₹{machine.rentPerDay}</td>
                <td>{machine.location}</td>
                <td>{machine.providerName}</td>
                <td>⭐ {machine.rating}</td>
                <td>
                  <button className="btn btn-primary btn-sm">Book Now</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransport = () => (
    <div className="dashboard-section">
      <h3>🚚 Transport Services</h3>
      <p className="section-subtitle">Book transport for your agricultural products</p>
      
      <div className="transport-table">
        <table>
          <thead>
            <tr>
              <th>Vehicle Type</th>
              <th>Capacity</th>
              <th>Price/Km</th>
              <th>Driver</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Provider</th>
              <th>Rating</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.transport?.map(vehicle => (
              <tr key={vehicle.id}>
                <td>{vehicle.vehicleType}</td>
                <td>{vehicle.capacity}</td>
                <td>₹{vehicle.pricePerKm}</td>
                <td>{vehicle.driverName}</td>
                <td>{vehicle.driverPhone}</td>
                <td>{vehicle.location}</td>
                <td>{vehicle.providerName}</td>
                <td>⭐ {vehicle.rating}</td>
                <td>
                  <button className="btn btn-primary btn-sm">Book Now</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => {
    const orderStatusLabel = (status) => {
      if (status === 'CONFIRMED') return t('Final Order Pending', 'अंतिम ऑर्डर लंबित');
      return status?.replace(/_/g, ' ') || status;
    };
    const paymentStatusLabel = (ps) => {
      if (ps === 'PAID') return t('Payment Received', 'भुगतान प्राप्त');
      return ps?.replace(/_/g, ' ') || ps;
    };
    return (
      <div className="dashboard-section">
        <h3>📦 {t('My Orders', 'मेरे ऑर्डर')}</h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {t('Orders from buyers after payment. Status "Final Order Pending" means payment received, awaiting fulfillment.', 'भुगतान के बाद खरीदारों से ऑर्डर। स्थिति "अंतिम ऑर्डर लंबित" का अर्थ है भुगतान प्राप्त, पूर्ति की प्रतीक्षा।')}
        </p>
        
        {!data.orders?.length ? (
          <div className="empty-state">
            <p>{t('No orders yet. Orders will appear here after buyers complete payment for accepted bids.', 'अभी तक कोई ऑर्डर नहीं। खरीदारों द्वारा स्वीकृत बोलियों का भुगतान पूरा होने के बाद ऑर्डर यहां दिखेंगे।')}</p>
          </div>
        ) : (
          <div className="orders-list">
            {data.orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <h4>Order #{order.orderNumber || order.id?.slice(-8) || '—'}</h4>
                  <div className="order-status">
                    <span className={`status-badge status-${(order.status || '').toLowerCase()}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                    <span className={`payment-badge payment-${(order.paymentStatus || 'unpaid').toLowerCase()}`}>
                      {paymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </div>
                
                <div className="order-details">
                  <div className="order-row">
                    <div>
                      <p><strong>{t('Product', 'उत्पाद')}:</strong> {order.productName}</p>
                      <p><strong>{t('Buyer', 'खरीदार')}:</strong> {order.buyerName}</p>
                      <p><strong>{t('Quantity', 'मात्रा')}:</strong> {order.quantity} units</p>
                    </div>
                    <div>
                      <p><strong>{t('Price', 'मूल्य')}:</strong> ₹{Number(order.agreedPrice || 0).toLocaleString()} {t('per unit', 'प्रति इकाई')}</p>
                      <p><strong>{t('Total Amount', 'कुल राशि')}:</strong> ₹{Number(order.totalAmount || 0).toLocaleString()}</p>
                      {order.deliveryDate && (
                        <p><strong>{t('Delivery Date', 'डिलीवरी तारीख')}:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTestResults = () => (
    <div className="dashboard-section">
      <h3>🧪 Quality Test Results</h3>
      
      {data.testResults?.map(result => (
        <div key={result.id} className="test-result-card">
          <div className="result-header">
            <h4>{result.productName} - Quality Analysis</h4>
            <div className="grade-badge grade-a-plus">{result.overallGrade}</div>
          </div>
          
          <div className="result-content">
            <div className="result-metrics">
              <div className="metric">
                <label>Quality Score:</label>
                <div className="score">{result.qualityScore}/100</div>
              </div>
              <div className="metric">
                <label>Moisture Content:</label>
                <div>{result.moistureContent}%</div>
              </div>
              <div className="metric">
                <label>Protein Content:</label>
                <div>{result.proteinContent}%</div>
              </div>
              <div className="metric">
                <label>AI Confidence:</label>
                <div>{result.confidence}%</div>
              </div>
            </div>
            
            <div className="ai-recommendations">
              <h5>🤖 AI Recommendations:</h5>
              <ul>
                {result.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="price-recommendation">
              <h5>💰 Price Recommendation:</h5>
              <div className="price-range">
                <span>Min: ₹{result.priceRecommendation.min}</span>
                <span className="suggested">Suggested: ₹{result.priceRecommendation.suggested}</span>
                <span>Max: ₹{result.priceRecommendation.max}</span>
              </div>
              <button className="btn btn-primary">Accept Suggested Price</button>
            </div>
          </div>
          
          <div className="result-images">
            <h5>📸 Test Images:</h5>
            <div className="image-gallery">
              <div className="test-image">
                <div className="image-placeholder">🌾 Sample Image 1</div>
              </div>
              <div className="test-image">
                <div className="image-placeholder">🔬 Analysis Image 2</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBrowseSuppliers = () => {
    if (suppliersLoading) {
      return (
        <div className="dashboard-section">
          <h3>🔍 Browse Suppliers</h3>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading suppliers...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-section">
        <h3>🔍 Browse Suppliers</h3>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Browse suppliers who offer farming services, machinery, transport, and other agricultural supplies
        </p>
        
        {suppliers.length === 0 ? (
          <div className="empty-state">
            <p>No suppliers found. Check back later.</p>
          </div>
        ) : (
          <div className="farmers-grid">
            {suppliers.map(supplier => {
              const rating = supplier.rating || 0;
              const supplierTypeLabels = {
                'MACHINERY': 'Farming Machinery',
                'TRANSPORT': 'Transport Services',
                'TESTING': 'Quality Testing',
                'LABOUR': 'Labour Services',
                'LABOUR_SERVICES': 'Labour Services',
                'SEEDS': 'Seeds',
                'FERTILIZERS': 'Fertilizers',
                'FARMING_MACHINERY': 'Farming Machinery',
                'TRANSPORT_MACHINERY': 'Transport Machinery',
                'Farming Machinery': 'Farming Machinery',
                'Transport Machinery': 'Transport Machinery'
              };
              
              return (
                <div key={supplier.id} className="farmer-card">
                  <div className="farmer-header">
                    <h4>{supplier.name || supplier.organizationName || 'Supplier'}</h4>
                    {rating > 0 && (
                      <div className="farmer-rating">⭐ {rating}</div>
                    )}
                  </div>
                  
                  {supplier.contactName && (
                    <div className="farmer-location">
                      👤 Contact: {supplier.contactName}
                    </div>
                  )}
                  
                  <div className="farmer-location">
                    📍 {[
                      supplier.village,
                      supplier.tehsil,
                      supplier.district,
                      supplier.state
                    ].filter(Boolean).join(', ') || 'Location not available'}
                  </div>
                  
                  {supplier.phone && (
                    <div className="farmer-land">
                      📞 {supplier.phone}
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="farmer-land">
                      ✉️ {supplier.email}
                    </div>
                  )}
                  
                  {supplier.supplierTypes && supplier.supplierTypes.length > 0 && (
                    <div className="farmer-products">
                      <h5>Services Offered:</h5>
                      <div className="product-item">
                        {supplier.supplierTypes.map((type, idx) => (
                          <span key={idx} className="supplier-type-badge">
                            {supplierTypeLabels[type] || type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {supplier.businessAddress && (
                    <div className="farmer-land" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      📍 {supplier.businessAddress}
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

  // Bottom navigation items (mobile-first)
  const bottomNavItems = [
    { id: 'home', label: t('Home', 'होम'), icon: '🏠' },
    { id: 'products', label: t('Market', 'बाज़ार'), icon: '🛒' },
    { id: 'learn', label: t('Learn', 'सीखें'), icon: '📚' },
    { id: 'community', label: t('Community', 'समुदाय'), icon: '👥' },
    { id: 'profile', label: t('Profile', 'प्रोफ़ाइल'), icon: '👤' }
  ];

  // Full menu items (for desktop sidebar)
  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'products', label: 'Products', icon: '🌱' },
    { id: 'offers', label: 'Offers', icon: '💰' },
    { id: 'browse-suppliers', label: 'Browse Suppliers', icon: '🔍' },
    { id: 'machinery', label: 'Farming Machinery', icon: '🚜' },
    { id: 'transport', label: 'Transport', icon: '🚚' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'test-results', label: 'Quality Test Results', icon: '🧪' }
  ];

  const renderLearn = () => (
    <div className="dashboard-section">
      <h3>📚 Learn</h3>
      <p>Educational content and farming tips coming soon...</p>
    </div>
  );

  const renderCommunity = () => (
    <div className="dashboard-section">
      <h3>👥 Community</h3>
      <p>Connect with other farmers, share experiences, and get advice...</p>
    </div>
  );

  const renderSection = () => {
    try {
    switch (activeSection) {
      case 'home': return <HomeDashboard user={user} onNavigate={setActiveSection} />;
      case 'profile': return renderProfile();
      case 'products': return renderProducts();
      case 'offers': return renderOffers();
      case 'browse-suppliers': return renderBrowseSuppliers();
      case 'machinery': return renderMachinery();
      case 'transport': return renderTransport();
      case 'orders': return renderOrders();
      case 'test-results': return renderTestResults();
      case 'learn': return renderLearn();
      case 'community': return renderCommunity();
      default: return <HomeDashboard user={user} onNavigate={setActiveSection} />;
      }
    } catch (error) {
      console.error('Error rendering section:', error);
      console.error('Error stack:', error.stack);
      return (
        <div className="dashboard-section" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>⚠️ Error Loading Section</h3>
          <p>An error occurred while rendering the {activeSection} section.</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>{error.message}</p>
          <button className="btn btn-primary" onClick={() => setActiveSection('profile')}>
            Go to Profile
          </button>
        </div>
      );
    }
  };

  // Show loading state if data is being fetched
  if (loading && !data.profile) {
    return (
      <div className="farmer-dashboard" style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
        <h2>Loading Dashboard...</h2>
        <p>Please wait while we load your information.</p>
      </div>
    );
  }

  return (
    <div className="farmer-dashboard">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <div className="toast-content">
            <div className="toast-title">
              {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Info'}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: 'success' })}>
            ×
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="user-info">
              <div className="user-avatar">
                🌾
              </div>
              <div className="user-details">
                <h3>{t('Welcome', 'स्वागत है')}, {(data?.profile?.name || user?.user?.name || user?.name || t('Farmer', 'किसान')).split(' ')[0] || t('Farmer', 'किसान')}!</h3>
                <p>{(data?.profile?.name || user?.user?.name || user?.name || t('Farmer', 'किसान')).split(' ')[0] || t('Farmer', 'किसान')}'s Dashboard • {[data?.profile?.tehsil, data?.profile?.village].filter(Boolean).join(', ') || [user?.user?.farmerProfile?.tehsil, user?.user?.farmerProfile?.village].filter(Boolean).join(', ') || 'N/A'}</p>
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

export default FarmerDashboard;
