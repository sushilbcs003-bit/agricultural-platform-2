/**
 * FarmerLands Component
 * Handles land management for farmers
 */
import React from 'react';
import logger from '../utils/logger';
import { sanitizeString, sanitizeNumber } from '../utils/sanitize';

const FarmerLands = ({
  lands,
  landsLoading,
  showLandModal,
  setShowLandModal,
  editingLand,
  setEditingLand,
  landForm,
  setLandForm,
  landErrors,
  setLandErrors,
  masterData,
  lgdVillageSearch,
  setLgdVillageSearch,
  lgdVillageResults,
  setLgdVillageResults,
  showLgdDropdown,
  setShowLgdDropdown,
  capturingGPS,
  setCapturingGPS,
  handleSearchLgdVillage,
  handleCaptureGPS,
  handleSaveLand,
  handleDeleteLand,
  handleOpenLandModal,
  handleCloseLandModal,
  renderLands
}) => {
  logger.debug('FarmerLands component rendered');

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>🌾 Manage Your Lands</h2>
        <button 
          className="btn btn-primary"
          onClick={() => handleOpenLandModal(null)}
        >
          + Add New Land
        </button>
      </div>

      {landsLoading ? (
        <div className="loading">Loading lands...</div>
      ) : (
        renderLands()
      )}

      {/* Land Modal - simplified, full implementation in main component */}
      {showLandModal && (
        <div className="modal-overlay" onClick={handleCloseLandModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingLand ? 'Edit Land' : 'Add New Land'}</h3>
            {/* Modal form content will be in main component */}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerLands;
