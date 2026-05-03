import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, applicationsAPI } from '../services/apiService';

const NewApplication = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    applicantName: '',
    nationalId: '',
    applicantEmail: '',
    applicantPhone: '',
    projectName: '',
    projectId: '',
    income: '',
    familySize: '',
    currentHousing: '',
    requestedUnitType: '2BR',
    preferredFloor: 'Any',
    paymentMethod: 'installments',
    specialRequirements: ''
  });
  
  const [uploadedFiles, setUploadedFiles] = useState({
    nationalIdPhoto: null,
    incomeCertificate: null,
    birthCertificate: null,
    otherDocuments: []
  });
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load projects from real database
        const response = await projectsAPI.getAll();
        const allProjects = response.data || [];
        const activeProjects = allProjects.filter(project => project.status === 'active');
        setProjects(activeProjects);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects from database. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
    return () => {};
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'projectName') {
      const selectedProject = projects.find(project => project.name === value);
      console.log('🔍 Selected project:', selectedProject);
      console.log('🔍 Available projects:', projects.map(p => ({ name: p.name, id: p.id })));
      
      if (selectedProject) {
        setFormData(prev => ({
          ...prev,
          projectId: selectedProject.id
        }));
        console.log('🔍 Set projectId to:', selectedProject.id);
        console.log('🔍 Form data after project selection:', { ...formData, projectId: selectedProject.id });
      } else {
        console.log('❌ Project not found with name:', value);
        setError('Please select a valid project from the list');
        setFormData(prev => ({
          ...prev,
          projectId: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const required = ['applicantName', 'nationalId', 'applicantEmail', 'applicantPhone', 'projectName', 'projectId', 'income', 'familySize', 'currentHousing'];
    
    for (const field of required) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`);
        return false;
      }
    }

    // Debug: Log form data
    console.log('🔍 Form data validation:', formData);

    // Name validation (3-100 characters)
    if (formData.applicantName.length < 3 || formData.applicantName.length > 100) {
      setError('Name must be between 3 and 100 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.applicantEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(formData.applicantPhone)) {
      setError('Phone number must start with 01 and be 11 digits');
      return false;
    }

    const nationalIdRegex = /^[0-9]{14}$/;
    if (!nationalIdRegex.test(formData.nationalId)) {
      setError('National ID must be exactly 14 digits');
      return false;
    }

    const income = parseFloat(formData.income);
    if (isNaN(income) || income <= 0) {
      setError('Income must be a positive number');
      return false;
    }

    const familySize = parseInt(formData.familySize);
    if (isNaN(familySize) || familySize < 1 || familySize > 20) {
      setError('Family size must be between 1 and 20');
      return false;
    }

    // Current housing validation (10-200 characters)
    if (formData.currentHousing.length < 10 || formData.currentHousing.length > 200) {
      setError('Current housing description must be between 10 and 200 characters');
      return false;
    }

    // Project name validation (3-100 characters)
    if (formData.projectName.length < 3 || formData.projectName.length > 100) {
      setError('Project name must be between 3 and 100 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const applicationData = {
        name: formData.applicantName,
        nationalId: formData.nationalId,
        email: formData.applicantEmail,
        phone: formData.applicantPhone,
        projectName: formData.projectName,
        projectId: formData.projectId,
        income: parseFloat(formData.income),
        familySize: parseInt(formData.familySize),
        currentHousing: formData.currentHousing,
        requestedUnitType: formData.requestedUnitType,
        preferredFloor: formData.preferredFloor,
        paymentMethod: formData.paymentMethod,
        specialRequirements: formData.specialRequirements,
        status: 'pending'
      };

      console.log('🔍 Submitting application data:', JSON.stringify(applicationData, null, 2));

      // Add application using API service
      const response = await applicationsAPI.create(applicationData);
      const newApplication = response.data;
      
      setSuccess('Application submitted successfully!');
      
      setTimeout(() => {
        navigate('/applications');
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting application:', err);
      console.error('Error details:', err.message);
      
      // Show more detailed error message
      if (err.message === 'Validation errors') {
        setError('Validation failed. Please check all fields and try again.');
      } else if (err.message.includes('National ID')) {
        setError('National ID already exists. Please use a different ID.');
      } else if (err.message.includes('Email')) {
        setError('Email already exists. Please use a different email.');
      } else {
        setError(`Failed to submit application: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: file
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      applicantName: '',
      nationalId: '',
      applicantEmail: '',
      applicantPhone: '',
      projectName: '',
      projectId: '',
      income: '',
      familySize: '',
      currentHousing: '',
      requestedUnitType: '2BR',
      preferredFloor: 'Any',
      paymentMethod: 'installments',
      specialRequirements: ''
    });
    setUploadedFiles({
      nationalIdPhoto: null,
      incomeCertificate: null,
      birthCertificate: null,
      otherDocuments: []
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          <h2>New Housing Application</h2>
          <p className="text-muted">Please fill out the form below to submit your housing application.</p>
          
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header">
                <h4>Personal Information</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="applicantName"
                      value={formData.applicantName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">National ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleInputChange}
                      placeholder="14-digit National ID"
                      maxLength={14}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="applicantEmail"
                      value={formData.applicantEmail}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="applicantPhone"
                      value={formData.applicantPhone}
                      onChange={handleInputChange}
                      placeholder="01xxxxxxxxx"
                      maxLength={11}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h4>Project Information</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Preferred Project *</label>
                    {projects.length > 0 ? (
                      <select
                        className="form-control"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.name}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Projects are currently unavailable. Please refresh the page or try again later.
                      </div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Requested Unit Type</label>
                    <select
                      className="form-control"
                      name="requestedUnitType"
                      value={formData.requestedUnitType}
                      onChange={handleInputChange}
                    >
                      <option key="1br" value="1BR">1 Bedroom</option>
                      <option key="2br" value="2BR">2 Bedrooms</option>
                      <option key="3br" value="3BR">3 Bedrooms</option>
                      <option key="studio" value="Studio">Studio</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Preferred Floor</label>
                    <select
                      className="form-control"
                      name="preferredFloor"
                      value={formData.preferredFloor}
                      onChange={handleInputChange}
                    >
                      <option key="any" value="Any">Any</option>
                      <option key="ground" value="Ground">Ground Floor</option>
                      <option key="1st" value="1st">1st Floor</option>
                      <option key="2nd" value="2nd">2nd Floor</option>
                      <option key="3rd" value="3rd">3rd Floor</option>
                      <option key="4th" value="4th">4th Floor</option>
                      <option key="5th" value="5th">5th Floor</option>
                      <option key="6th-plus" value="6th+">6th Floor or above</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-control"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                    >
                      <option key="installments" value="installments">Installments</option>
                      <option key="cash" value="cash">Cash</option>
                      <option key="bank_loan" value="bank_loan">Bank Loan</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h4>Financial Information</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Monthly Income (EGP) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="income"
                      value={formData.income}
                      onChange={handleInputChange}
                      placeholder="Enter monthly income"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Family Size *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="familySize"
                      value={formData.familySize}
                      onChange={handleInputChange}
                      placeholder="Number of family members"
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h4>Current Housing</h4>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Current Housing Situation *</label>
                  <textarea
                    className="form-control"
                    name="currentHousing"
                    value={formData.currentHousing}
                    onChange={handleInputChange}
                    placeholder="Describe your current housing situation..."
                    rows="3"
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Special Requirements</label>
                  <textarea
                    className="form-control"
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleInputChange}
                    placeholder="Any special requirements or preferences..."
                    rows="2"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h4>Required Documents *</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">National ID Photo *</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'nationalIdPhoto')}
                      required
                    />
                    {uploadedFiles.nationalIdPhoto && (
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {uploadedFiles.nationalIdPhoto.name}
                      </small>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Income Certificate *</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'incomeCertificate')}
                      required
                    />
                    {uploadedFiles.incomeCertificate && (
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {uploadedFiles.incomeCertificate.name}
                      </small>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Birth Certificate *</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'birthCertificate')}
                      required
                    />
                    {uploadedFiles.birthCertificate && (
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {uploadedFiles.birthCertificate.name}
                      </small>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Other Documents</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*,.pdf"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setUploadedFiles(prev => ({
                          ...prev,
                          otherDocuments: files
                        }));
                      }}
                    />
                    {uploadedFiles.otherDocuments.length > 0 && (
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {uploadedFiles.otherDocuments.length} file(s) selected
                      </small>
                    )}
                  </div>
                </div>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Please upload clear photos of your documents. Accepted formats: JPG, PNG, PDF. Maximum file size: 5MB per file.
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/applications')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <div>
                    <button
                      type="button"
                      className="btn btn-warning me-2"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Reset Form
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewApplication;
