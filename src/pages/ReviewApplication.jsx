import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationsAPI, projectsAPI } from '../services/apiService';

// Format date helper function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ReviewApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Load application data
  useEffect(() => {
    const loadApplication = async () => {
      try {
        setLoading(true);
        
        // Fetch both application and projects data
        const [applicationResponse, projectsResponse] = await Promise.all([
          applicationsAPI.getById(id),
          projectsAPI.getAll()
        ]);
        
        const appData = applicationResponse.data;
        const projectsData = projectsResponse.data || [];
        
        // Enrich application with project information
        if (appData) {
          const project = projectsData.find(p => p._id === appData.projectId || p.id === appData.projectId);
          
          const enrichedApplication = {
            ...appData,
            id: appData._id || appData.id,
            projectName: appData.projectName || (project ? project.name : 'Unknown Project'),
            applicantName: appData.applicantName || appData.name || 'Unknown User',
            submittedDate: appData.createdAt || appData.submittedDate || new Date().toISOString(),
            // Include unit type, preferred floor, and payment method with defaults
            requestedUnitType: appData.requestedUnitType || '2BR',
            preferredFloor: appData.preferredFloor || 'Any',
            paymentMethod: appData.paymentMethod || 'installments'
          };
          
          console.log('🔍 Enriched application data:', enrichedApplication);
          setApplication(enrichedApplication);
        } else {
          setUpdateError('Application not found');
        }
      } catch (err) {
        console.error('Error loading application:', err);
        setUpdateError('Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id]);

  // Handle approve application
  const handleApprove = async () => {
    try {
      setUpdateLoading(true);
      setUpdateError('');
      
      await applicationsAPI.update(id, { status: 'approved' });
      setSuccessMessage('Application approved successfully!');
      
      // Update local state
      if (application) {
        setApplication({ ...application, status: 'approved' });
      }
    } catch (err) {
      setUpdateError('Failed to approve application');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle reject application
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setUpdateError('Please provide a reason for rejection');
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError('');
      
      await applicationsAPI.update(id, { status: 'rejected', rejectionReason: rejectReason });
      setSuccessMessage('Application rejected successfully!');
      setShowRejectReason(false);
      
      // Update local state
      if (application) {
        setApplication({ ...application, status: 'rejected', rejectionReason: rejectReason });
      }
    } catch (err) {
      setUpdateError('Failed to reject application');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-warning">
          <h4>Application Not Found</h4>
          <p>The application with ID "{id}" was not found.</p>
          <Link to="/applications" className="btn btn-primary">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          <i className="bi bi-file-earmark-text me-2"></i>
          Review Application
        </h2>
        <Link to="/applications" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Applications
        </Link>
      </div>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {updateError && (
        <div className="alert alert-danger" role="alert">
          {updateError}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card shadow mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Application Details</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Application ID:</strong> {application._id}
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong>
                  <span className={`badge bg-${
                    application.status === 'approved' ? 'success' : 
                    application.status === 'rejected' ? 'danger' : 'warning'
                  } ms-2`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="bi bi-building me-2"></i>
                    Project Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Project Name</label>
                      <p className="form-control-plaintext">{application.projectName}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Location</label>
                      <p className="form-control-plaintext">Cairo, Egypt</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Requested Unit Type</label>
                      <p className="form-control-plaintext">{application.requestedUnitType || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Preferred Floor</label>
                      <p className="form-control-plaintext">{application.preferredFloor || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Payment Method</label>
                      <p className="form-control-plaintext">{application.paymentMethod || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Submission Date</label>
                      <p className="form-control-plaintext">{formatDate(application.submittedDate)}</p>
                    </div>
                  </div>
                  {application.specialRequirements && (
                    <div className="mt-3">
                      <label className="form-label">Special Requirements</label>
                      <p className="form-control-plaintext">{application.specialRequirements}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Actions</h5>
            </div>
            <div className="card-body">
              {application.status === 'pending' && (
                <>
                  <button
                    className="btn btn-success w-100 mb-2"
                    onClick={handleApprove}
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Approve Application
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-danger w-100"
                    onClick={() => setShowRejectReason(true)}
                    disabled={updateLoading}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Reject Application
                  </button>
                </>
              )}
              
              {application.status !== 'pending' && (
                <div className="text-center">
                  <p className="text-muted mb-0">
                    This application has been {application.status}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showRejectReason && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Application</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectReason(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="rejectReason" className="form-label">Reason for Rejection</label>
                  <textarea
                    className="form-control"
                    id="rejectReason"
                    rows="4"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this application..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectReason(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Rejecting...
                    </>
                  ) : (
                    'Reject Application'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewApplication;
