'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Shield, Globe, Building } from 'lucide-react';
import type { Customer, Address } from '../../../types/customer';

interface CustomerPersonalInfoProps {
  customer: Customer;
  editMode: boolean;
  onUpdate: (data: Partial<Customer>) => void;
}

export const CustomerPersonalInfo: React.FC<CustomerPersonalInfoProps> = ({
  customer,
  editMode,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    middleName: customer.middleName || '',
    phone: customer.phone || '',
    email: customer.email || '',
    dateOfBirth: customer.dateOfBirth || '',
    gender: customer.gender || '',
    idNumber: customer.idNumber || '',
    idType: customer.idType || 'national_id',
    nationality: customer.nationality || 'GH',
    occupation: customer.occupation || '',
    employer: customer.employer || '',
    address: {
      street: customer.address?.street || '',
      city: customer.address?.city || '',
      region: customer.address?.region || '',
      country: customer.address?.country || 'Ghana',
      postalCode: customer.address?.postalCode || '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Handle form changes
  const handleChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }

    // Notify parent of changes
    onUpdate(formData);
  };

  // Validation rules
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return value.trim().length < 2 ? 'Must be at least 2 characters' : '';
      case 'phone':
        return !/^\+233\d{9}$/.test(value) ? 'Invalid Ghana phone number (+233XXXXXXXXX)' : '';
      case 'email':
        return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email address' : '';
      case 'idNumber':
        return value.trim().length < 8 ? 'ID number must be at least 8 characters' : '';
      case 'dateOfBirth':
        if (!value) return '';
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age < 18 || age > 120 ? 'Age must be between 18 and 120' : '';
      default:
        return '';
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(field => {
      if (field !== 'address') {
        const error = validateField(field, formData[field as keyof typeof formData] as string);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle blur validation
  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const idTypeOptions = [
    { value: 'national_id', label: 'National ID' },
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'voters_id', label: 'Voters ID' },
  ];

  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
    'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong-Ahafo',
    'Western North', 'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'
  ];

  return (
    <div className="customer-personal-info">
      <div className="space-y-8">
        {/* Personal Details Section */}
        <div className="customer-info-section">
          <div className="customer-info-section-header">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* First Name */}
            <div className="form-field">
              <label htmlFor="firstName" className="form-label required">
                First Name
              </label>
              {editMode ? (
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  onBlur={(e) => handleBlur('firstName', e.target.value)}
                  className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                  placeholder="Enter first name"
                />
              ) : (
                <div className="form-display-value">{formData.firstName}</div>
              )}
              {errors.firstName && <div className="form-error">{errors.firstName}</div>}
            </div>

            {/* Middle Name */}
            <div className="form-field">
              <label htmlFor="middleName" className="form-label">
                Middle Name
              </label>
              {editMode ? (
                <input
                  id="middleName"
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  className="form-input"
                  placeholder="Enter middle name"
                />
              ) : (
                <div className="form-display-value">{formData.middleName || '—'}</div>
              )}
            </div>

            {/* Last Name */}
            <div className="form-field">
              <label htmlFor="lastName" className="form-label required">
                Last Name
              </label>
              {editMode ? (
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  onBlur={(e) => handleBlur('lastName', e.target.value)}
                  className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                  placeholder="Enter last name"
                />
              ) : (
                <div className="form-display-value">{formData.lastName}</div>
              )}
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </div>

            {/* Date of Birth */}
            <div className="form-field">
              <label htmlFor="dateOfBirth" className="form-label">
                Date of Birth
              </label>
              {editMode ? (
                <input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  onBlur={(e) => handleBlur('dateOfBirth', e.target.value)}
                  className={`form-input ${errors.dateOfBirth ? 'form-input-error' : ''}`}
                />
              ) : (
                <div className="form-display-value">
                  {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : '—'}
                </div>
              )}
              {errors.dateOfBirth && <div className="form-error">{errors.dateOfBirth}</div>}
            </div>

            {/* Gender */}
            <div className="form-field">
              <label htmlFor="gender" className="form-label">
                Gender
              </label>
              {editMode ? (
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="form-input"
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="form-display-value">
                  {genderOptions.find(g => g.value === formData.gender)?.label || '—'}
                </div>
              )}
            </div>

            {/* Nationality */}
            <div className="form-field">
              <label htmlFor="nationality" className="form-label">
                Nationality
              </label>
              {editMode ? (
                <input
                  id="nationality"
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  className="form-input"
                  placeholder="Enter nationality"
                />
              ) : (
                <div className="form-display-value">{formData.nationality}</div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="customer-info-section">
          <div className="customer-info-section-header">
            <Phone className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="form-field">
              <label htmlFor="phone" className="form-label required">
                Phone Number
              </label>
              {editMode ? (
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={(e) => handleBlur('phone', e.target.value)}
                  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                  placeholder="+233XXXXXXXXX"
                />
              ) : (
                <div className="form-display-value">{formData.phone}</div>
              )}
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>

            {/* Email */}
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              {editMode ? (
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={(e) => handleBlur('email', e.target.value)}
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="Enter email address"
                />
              ) : (
                <div className="form-display-value">{formData.email || '—'}</div>
              )}
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
          </div>
        </div>

        {/* Identification Section */}
        <div className="customer-info-section">
          <div className="customer-info-section-header">
            <Shield className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Identification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ID Type */}
            <div className="form-field">
              <label htmlFor="idType" className="form-label">
                ID Type
              </label>
              {editMode ? (
                <select
                  id="idType"
                  value={formData.idType}
                  onChange={(e) => handleChange('idType', e.target.value)}
                  className="form-input"
                >
                  {idTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="form-display-value">
                  {idTypeOptions.find(id => id.value === formData.idType)?.label}
                </div>
              )}
            </div>

            {/* ID Number */}
            <div className="form-field">
              <label htmlFor="idNumber" className="form-label required">
                ID Number
              </label>
              {editMode ? (
                <input
                  id="idNumber"
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleChange('idNumber', e.target.value)}
                  onBlur={(e) => handleBlur('idNumber', e.target.value)}
                  className={`form-input ${errors.idNumber ? 'form-input-error' : ''}`}
                  placeholder="Enter ID number"
                />
              ) : (
                <div className="form-display-value font-mono">{formData.idNumber}</div>
              )}
              {errors.idNumber && <div className="form-error">{errors.idNumber}</div>}
            </div>
          </div>
        </div>

        {/* Employment Information Section */}
        <div className="customer-info-section">
          <div className="customer-info-section-header">
            <Building className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Employment Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Occupation */}
            <div className="form-field">
              <label htmlFor="occupation" className="form-label">
                Occupation
              </label>
              {editMode ? (
                <input
                  id="occupation"
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  className="form-input"
                  placeholder="Enter occupation"
                />
              ) : (
                <div className="form-display-value">{formData.occupation || '—'}</div>
              )}
            </div>

            {/* Employer */}
            <div className="form-field">
              <label htmlFor="employer" className="form-label">
                Employer
              </label>
              {editMode ? (
                <input
                  id="employer"
                  type="text"
                  value={formData.employer}
                  onChange={(e) => handleChange('employer', e.target.value)}
                  className="form-input"
                  placeholder="Enter employer"
                />
              ) : (
                <div className="form-display-value">{formData.employer || '—'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="customer-info-section">
          <div className="customer-info-section-header">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Street Address */}
            <div className="form-field">
              <label htmlFor="address.street" className="form-label">
                Street Address
              </label>
              {editMode ? (
                <textarea
                  id="address.street"
                  value={formData.address.street}
                  onChange={(e) => handleChange('address.street', e.target.value)}
                  className="form-input"
                  rows={2}
                  placeholder="Enter street address"
                />
              ) : (
                <div className="form-display-value">{formData.address.street || '—'}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* City */}
              <div className="form-field">
                <label htmlFor="address.city" className="form-label">
                  City
                </label>
                {editMode ? (
                  <input
                    id="address.city"
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                    className="form-input"
                    placeholder="Enter city"
                  />
                ) : (
                  <div className="form-display-value">{formData.address.city || '—'}</div>
                )}
              </div>

              {/* Region */}
              <div className="form-field">
                <label htmlFor="address.region" className="form-label">
                  Region
                </label>
                {editMode ? (
                  <select
                    id="address.region"
                    value={formData.address.region}
                    onChange={(e) => handleChange('address.region', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select Region</option>
                    {ghanaRegions.map(region => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="form-display-value">{formData.address.region || '—'}</div>
                )}
              </div>

              {/* Country */}
              <div className="form-field">
                <label htmlFor="address.country" className="form-label">
                  Country
                </label>
                {editMode ? (
                  <input
                    id="address.country"
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => handleChange('address.country', e.target.value)}
                    className="form-input"
                    placeholder="Enter country"
                  />
                ) : (
                  <div className="form-display-value">{formData.address.country}</div>
                )}
              </div>

              {/* Postal Code */}
              <div className="form-field">
                <label htmlFor="address.postalCode" className="form-label">
                  Postal Code
                </label>
                {editMode ? (
                  <input
                    id="address.postalCode"
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) => handleChange('address.postalCode', e.target.value)}
                    className="form-input"
                    placeholder="Enter postal code"
                  />
                ) : (
                  <div className="form-display-value">{formData.address.postalCode || '—'}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};