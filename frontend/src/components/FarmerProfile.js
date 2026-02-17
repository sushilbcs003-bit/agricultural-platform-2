/**
 * FarmerProfile Component
 * Handles profile display and editing for farmers
 */
import React from 'react';
import logger from '../utils/logger';
import { sanitizeString, sanitizePhone, sanitizeEmail } from '../utils/sanitize';

const FarmerProfile = ({ 
  profile, 
  data, 
  isEditingProfile, 
  setIsEditingProfile,
  basicInfoForm,
  setBasicInfoForm,
  contactInfoForm,
  setContactInfoForm,
  identityForm,
  setIdentityForm,
  accountForm,
  setAccountForm,
  basicInfoErrors,
  contactInfoErrors,
  identityErrors,
  basicInfoChanged,
  contactInfoChanged,
  identityChanged,
  setBasicInfoChanged,
  setContactInfoChanged,
  setIdentityChanged,
  handleSaveBasicInfo,
  handleSaveContactInfo,
  handleSaveIdentity,
  profileMessage,
  setProfileMessage,
  locationForm,
  setLocationForm,
  locationChanged,
  setLocationChanged,
  locationError,
  handleSaveLocation,
  user
}) => {
  logger.debug('FarmerProfile component rendered');

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>👤 Profile</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => setIsEditingProfile(!isEditingProfile)}
        >
          {isEditingProfile ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {profileMessage && (
        <div className={`alert ${profileMessage.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {profileMessage}
        </div>
      )}

      {/* Profile content - simplified for now, full implementation in main component */}
      <div className="profile-content">
        <p>Profile management section</p>
        {/* This will be populated with the actual profile rendering logic from FarmerDashboard */}
      </div>
    </div>
  );
};

export default FarmerProfile;
