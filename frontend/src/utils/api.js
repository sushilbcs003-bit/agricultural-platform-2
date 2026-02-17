import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_VERSION = '/api/v1'; // Prefer versioned API

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to try v1 endpoint first, fallback to non-versioned
const apiCallWithFallback = async (method, v1Path, fallbackPath, data = null) => {
  try {
    const config = data ? { data } : {};
    const response = await api[method](v1Path, config.data || config);
    return response.data;
  } catch (error) {
    // If v1 endpoint fails (404/500), try fallback
    if (error.response?.status === 404 || error.response?.status >= 500) {
      try {
        const config = data ? { data } : {};
        const response = await api[method](fallbackPath, config.data || config);
        return response.data;
      } catch (fallbackError) {
        throw fallbackError; // Throw the fallback error
      }
    }
    throw error; // Re-throw non-404/500 errors
  }
};

// API Health Check
export const checkApiHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Master Data - prefer v1, fallback to non-versioned
export const getMasterData = async () => {
  return apiCallWithFallback('get', `${API_VERSION}/master-data`, '/api/master-data');
};

// Auth APIs - prefer v1, fallback to non-versioned
export const requestOTP = async (phone, purpose = 'LOGIN') => {
  return apiCallWithFallback('post', `${API_VERSION}/auth/otp/request`, '/api/auth/otp/request', { phone, purpose });
};

export const verifyOTP = async (phone, otp, purpose = 'LOGIN') => {
  return apiCallWithFallback('post', `${API_VERSION}/auth/otp/verify`, '/api/auth/otp/verify', { phone, otp, purpose });
};

export const registerFarmer = async (farmerData) => {
  return apiCallWithFallback('post', `${API_VERSION}/auth/register/farmer`, '/api/auth/register/farmer', farmerData);
};

export const registerBuyer = async (buyerData) => {
  const response = await api.post('/api/auth/register/buyer', buyerData);
  return response.data;
};

export const registerSupplier = async (supplierData) => {
  const response = await api.post('/api/auth/register/supplier', supplierData);
  return response.data;
};

// Check if phone number exists
export const checkPhoneExists = async (phone) => {
  const response = await api.post('/api/auth/check-phone', { phone });
  return response.data;
};

// Buyer OTP login (requires Phone + GST)
export const requestBuyerOtp = async (phone, gst) => {
  const response = await api.post('/api/auth/login/buyer/request-otp', { phone, gst });
  return response.data;
};

export const verifyBuyerOtp = async (phone, gst, otp) => {
  const response = await api.post('/api/auth/login/buyer/verify-otp', { phone, gst, otp });
  return response.data;
};

// Supplier OTP login
export const requestSupplierOtp = async (gst) => {
  const response = await api.post('/api/auth/login/supplier/request-otp', { gst });
  return response.data;
};

export const verifySupplierOtp = async (gst, otp) => {
  const response = await api.post('/api/auth/login/supplier/verify-otp', { gst, otp });
  return response.data;
};

// Data APIs - prefer v1, fallback to non-versioned
export const getUsers = async () => {
  return apiCallWithFallback('get', `${API_VERSION}/users`, '/api/users');
};

export const getFarmers = async () => {
  const response = await api.get('/api/farmers');
  return response.data;
};

export const getSuppliers = async () => {
  const response = await api.get('/api/suppliers');
  return response.data;
};

export const getProducts = async () => {
  const response = await api.get('/api/products');
  return response.data;
};

// Farmer products
export const getFarmerProducts = async (farmerId) => {
  const response = await api.get(`/api/farmer/${farmerId}/products`);
  return response.data;
};

export const addFarmerProduct = async (farmerId, product) => {
  const response = await api.post(`/api/farmer/${farmerId}/products`, product);
  return response.data;
};

export const setProductAvailability = async (farmerId, productId, availableForBrowse) => {
  const response = await api.put(`/api/farmer/${farmerId}/products/${productId}/availability`, { availableForBrowse });
  return response.data;
};

// Farmer profile & locations
export const getFarmerProfile = async (farmerId) => {
  const response = await api.get(`/api/farmer/${farmerId}/profile`);
  return response.data;
};

export const addFarmerLocation = async (farmerId, location) => {
  const response = await api.post(`/api/farmer/${farmerId}/locations`, location);
  return response.data;
};

export const getApiInfo = async () => {
  const response = await api.get('/');
  return response.data;
};

// Admin APIs
export const getAdminDashboard = async () => {
  const response = await api.get('/api/admin/dashboard');
  return response.data;
};

export default api;

// Lands APIs
export const getLands = async (farmerId) => {
  const response = await api.get(`/api/farmer/${farmerId}/lands`);
  return response.data;
};

export const createLand = async (farmerId, landData) => {
  const response = await api.post(`/api/farmer/${farmerId}/lands`, landData);
  return response.data;
};

export const updateLand = async (farmerId, landId, landData) => {
  const response = await api.put(`/api/farmer/${farmerId}/lands/${landId}`, landData);
  return response.data;
};

export const deleteLand = async (farmerId, landId) => {
  const response = await api.delete(`/api/farmer/${farmerId}/lands/${landId}`);
  return response.data;
};

// LGD Village Search
export const searchLGDVillages = async (query) => {
  const response = await api.get(`/api/lgd/villages/search`, { params: { q: query } });
  return response.data;
};

// Farmer Profile Update
export const updateFarmerProfile = async (farmerId, profileData) => {
  const response = await api.put(`/api/farmer/${farmerId}/profile`, profileData);
  return response.data;
};

// Product Management
export const updateProduct = async (farmerId, productId, productData) => {
  const response = await api.put(`/api/farmer/${farmerId}/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (farmerId, productId) => {
  const response = await api.delete(`/api/farmer/${farmerId}/products/${productId}`);
  return response.data;
};

export const updateProductStatus = async (farmerId, productId, status) => {
  const response = await api.put(`/api/farmer/${farmerId}/products/${productId}/status`, { status });
  return response.data;
};

export const bulkUpdateProductStatus = async (farmerId, productIds, status) => {
  const response = await api.put(`/api/farmer/${farmerId}/products/bulk-status`, { productIds, status });
  return response.data;
};

// ==========================================================
// NEW APIs for 3NF+ Schema
// ==========================================================

// Supplier APIs
export const getSupplierProfile = async (supplierId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/supplier/${supplierId}/profile`,
    `/api/supplier/${supplierId}/profile`
  );
};

export const updateSupplierProfile = async (supplierId, profileData) => {
  return apiCallWithFallback('put',
    `${API_VERSION}/supplier/${supplierId}/profile`,
    `/api/supplier/${supplierId}/profile`,
    profileData
  );
};

export const getSupplierMachinery = async (supplierId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/supplier/${supplierId}/machinery`,
    `/api/supplier/${supplierId}/machinery`
  );
};

export const addSupplierMachinery = async (supplierId, machineryData) => {
  return apiCallWithFallback('post',
    `${API_VERSION}/supplier/${supplierId}/machinery`,
    `/api/supplier/${supplierId}/machinery`,
    machineryData
  );
};

export const updateSupplierMachinery = async (supplierId, machineryId, machineryData) => {
  return apiCallWithFallback('put',
    `${API_VERSION}/supplier/${supplierId}/machinery/${machineryId}`,
    `/api/supplier/${supplierId}/machinery/${machineryId}`,
    machineryData
  );
};

export const deleteSupplierMachinery = async (supplierId, machineryId) => {
  return apiCallWithFallback('delete',
    `${API_VERSION}/supplier/${supplierId}/machinery/${machineryId}`,
    `/api/supplier/${supplierId}/machinery/${machineryId}`
  );
};

// Cart APIs
export const getCart = async () => {
  return apiCallWithFallback('get',
    `${API_VERSION}/cart`,
    '/api/cart'
  );
};

export const addToCart = async (item) => {
  return apiCallWithFallback('post',
    `${API_VERSION}/cart/items`,
    '/api/cart/items',
    item
  );
};

export const removeFromCart = async (itemId) => {
  return apiCallWithFallback('delete',
    `${API_VERSION}/cart/items/${itemId}`,
    `/api/cart/items/${itemId}`
  );
};

export const updateCartItem = async (itemId, quantity) => {
  return apiCallWithFallback('put',
    `${API_VERSION}/cart/items/${itemId}`,
    `/api/cart/items/${itemId}`,
    { quantity }
  );
};

export const checkoutCart = async () => {
  return apiCallWithFallback('post',
    `${API_VERSION}/cart/checkout`,
    '/api/cart/checkout'
  );
};

// Order APIs
export const createOrder = async (orderData) => {
  return apiCallWithFallback('post',
    `${API_VERSION}/orders`,
    '/api/orders',
    orderData
  );
};

export const getOrders = async (filters = {}) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/orders`,
    '/api/orders',
    { params: filters }
  );
};

export const getOrder = async (orderId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/orders/${orderId}`,
    `/api/orders/${orderId}`
  );
};

// Machinery Discovery APIs
export const getFarmingMachinery = async (filters = {}) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/machinery/farming`,
    '/api/machinery/farming',
    { params: filters }
  );
};

export const getTransportMachinery = async (filters = {}) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/machinery/transport`,
    '/api/machinery/transport',
    { params: filters }
  );
};

export const getMachineryTypes = async (category) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/machinery/types?category=${category}`,
    `/api/machinery/types?category=${category}`
  );
};

// Offer/Bid APIs
export const getFarmerOffers = async (farmerId) => {
  const response = await api.get(`/api/farmer/${farmerId}/offers`);
  return response.data;
};

export const getFarmerOrders = async (farmerId) => {
  const response = await api.get(`/api/farmer/${farmerId}/orders`);
  return response.data;
};

export const respondToOffer = async (farmerId, offerId, action, counterPrice = null, message = '') => {
  const response = await api.put(`/api/farmer/${farmerId}/offers/${offerId}/respond`, {
    action,
    counterPrice,
    message
  });
  return response.data;
};

// Buyer APIs
export const getBuyerProfile = async (buyerId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/buyer/${buyerId}/profile`,
    `/api/buyer/${buyerId}/profile`
  );
};

export const updateBuyerProfile = async (buyerId, profileData) => {
  const response = await api.put(`/api/buyer/${buyerId}/profile`, profileData);
  return response.data;
};

export const getBuyerBids = async (buyerId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/buyer/${buyerId}/bids`,
    `/api/buyer/${buyerId}/bids`
  );
};

export const placeBid = async (bidData) => {
  const { buyerId, ...rest } = bidData;
  return apiCallWithFallback('post',
    `${API_VERSION}/buyer/${buyerId}/bids`,
    `/api/buyer/${buyerId}/bids`,
    rest
  );
};

export const addToShortlist = async (buyerId, farmerId) => {
  return apiCallWithFallback('post',
    `${API_VERSION}/buyer/${buyerId}/shortlist`,
    `/api/buyer/${buyerId}/shortlist`,
    { farmerId }
  );
};

export const removeFromShortlist = async (buyerId, farmerId) => {
  return apiCallWithFallback('delete',
    `${API_VERSION}/buyer/${buyerId}/shortlist/${farmerId}`,
    `/api/buyer/${buyerId}/shortlist/${farmerId}`
  );
};

export const getShortlist = async (buyerId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/buyer/${buyerId}/shortlist`,
    `/api/buyer/${buyerId}/shortlist`
  );
};

// Quality Test APIs
export const getQualityTests = async (productId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/products/${productId}/quality-tests`,
    `/api/products/${productId}/quality-tests`
  );
};

export const getQualityTestReport = async (reportId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/quality-tests/${reportId}`,
    `/api/quality-tests/${reportId}`
  );
};

// Payment Profile APIs
export const getPaymentProfile = async (userId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/users/${userId}/payment-profile`,
    `/api/users/${userId}/payment-profile`
  );
};

export const updatePaymentProfile = async (userId, profileData) => {
  return apiCallWithFallback('put',
    `${API_VERSION}/users/${userId}/payment-profile`,
    `/api/users/${userId}/payment-profile`,
    profileData
  );
};
