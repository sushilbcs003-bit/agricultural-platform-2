/**
 * FarmerProducts Component
 * Handles product management for farmers
 */
import React from 'react';
import logger from '../utils/logger';
import { sanitizeString, sanitizeNumber } from '../utils/sanitize';

const FarmerProducts = ({
  data,
  productsLoading,
  lands,
  showProductModal,
  setShowProductModal,
  editingProduct,
  setEditingProduct,
  productForm,
  setProductForm,
  productErrors,
  setProductErrors,
  productMessage,
  setProductMessage,
  handleSaveProduct,
  handleDeleteProduct,
  handleBulkStatusUpdate,
  handleOpenProductModal,
  handleCloseProductModal,
  renderProducts
}) => {
  logger.debug('FarmerProducts component rendered');

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>🌾 My Products</h2>
        <button 
          className="btn btn-primary"
          onClick={() => handleOpenProductModal(null)}
        >
          + Add Product
        </button>
      </div>

      {productMessage && (
        <div className={`alert ${productMessage.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {productMessage}
        </div>
      )}

      {productsLoading ? (
        <div className="loading">Loading products...</div>
      ) : (
        renderProducts()
      )}

      {/* Product Modal - simplified, full implementation in main component */}
      {showProductModal && (
        <div className="modal-overlay" onClick={handleCloseProductModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            {/* Modal form content will be in main component */}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerProducts;
