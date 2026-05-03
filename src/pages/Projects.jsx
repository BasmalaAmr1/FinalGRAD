import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/apiService';

const Projects = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    totalUnits: '',
    availableUnits: '',
    priceRange: '',
    type: 'Apartments',
    status: 'active',
    completionDate: '',
    description: ''
  });

  // Save projects to localStorage
  const saveProjectsToStorage = (projects) => {
    try {
      localStorage.setItem('housingProjects', JSON.stringify(projects));
      console.log('✅ Projects saved to localStorage:', projects.length);
    } catch (err) {
      console.error('❌ Failed to save projects to localStorage:', err);
    }
  };

  // Load projects from API
  const loadProjectsFromService = async () => {
    try {
      const response = await projectsAPI.getAll();
      const projects = response.data || [];
      console.log('📥 Loaded projects from API:', projects.length);
      return projects;
    } catch (err) {
      console.error('❌ Failed to load projects from API:', err);
      return [];
    }
  };

  // Fallback projects data
  const fallbackProjects = [
    {
      _id: 'proj-1',
      name: 'New Cairo Residential Complex',
      location: 'New Cairo, Egypt',
      type: 'Residential',
      status: 'active',
      totalUnits: 500,
      availableUnits: 150,
      priceRange: '2M - 5M EGP',
      completionDate: '2024-12-31',
      description: 'Modern residential complex with amenities'
    },
    {
      _id: 'proj-2',
      name: 'Alexandria Coastal Towers',
      location: 'Alexandria, Egypt',
      type: 'Residential',
      status: 'active',
      totalUnits: 300,
      availableUnits: 75,
      priceRange: '3M - 7M EGP',
      completionDate: '2025-06-30',
      description: 'Luxury coastal apartments with sea view'
    },
    {
      _id: 'proj-3',
      name: 'New Capital City Complex',
      location: 'New Capital, Egypt',
      type: 'Commercial & Residential',
      status: 'planning',
      totalUnits: 1000,
      availableUnits: 1000,
      priceRange: '1.5M - 4M EGP',
      completionDate: '2026-03-31',
      description: 'Mixed-use development in administrative capital'
    },
    {
      _id: 'proj-4',
      name: 'Garden City Residences',
      location: 'Cairo, Egypt',
      type: 'Residential',
      status: 'active',
      totalUnits: 200,
      availableUnits: 25,
      priceRange: '4M - 8M EGP',
      completionDate: '2024-09-30',
      description: 'Premium residential complex in heart of Cairo'
    },
    {
      _id: 'proj-5',
      name: 'North Coast Villas',
      location: 'North Coast, Egypt',
      type: 'Residential',
      status: 'active',
      totalUnits: 150,
      availableUnits: 60,
      priceRange: '5M - 12M EGP',
      completionDate: '2025-08-31',
      description: 'Luxury beachfront villas with private access'
    }
  ];

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load projects from API
      const response = await projectsAPI.getAll();
      const projects = response.data || [];
      setProjectsList(projects);
      
      return () => {}; // No subscription needed for API
      
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setupProjects = async () => {
      const unsubscribe = await fetchProjects();
      return unsubscribe;
    };
    
    setupProjects().then(unsubscribe => {
      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }, []);

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      ...project,
      completionDate: project.timeline?.completionDate ? new Date(project.timeline.completionDate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    console.log('🔥 handleAdd function called!');
    setEditingProject(null);
    setFormData({
      name: '',
      location: { city: '', district: '', address: '' },
      type: 'Apartments',
      status: 'active',
      development: { totalUnits: 0, availableUnits: 0, soldUnits: 0, phases: 1 },
      pricing: { priceRange: '', unitTypes: [], downPayment: '10%', installmentYears: 5 },
      timeline: { completionDate: '', deliveryDate: '', constructionProgress: 0 },
      features: { amenities: [], areaRange: '', floors: 1 },
      description: ''
    });
    console.log('📝 Form data reset, opening modal...');
    setShowModal(true);
  };

  const handleSave = async () => {
    console.log('🔥 handleSave function called!');
    console.log('📝 Form data:', formData);
    
    // Form validation
    if (!formData.name || formData.name.trim() === '') {
      console.log('❌ Project name validation failed');
      alert('Project name is required');
      return;
    }
    if (!formData.location || formData.location.trim() === '') {
      console.log('❌ Location validation failed');
      alert('Project location is required');
      return;
    }
    if (!formData.totalUnits || formData.totalUnits <= 0) {
      console.log('❌ Total units validation failed');
      alert('Total units must be greater than 0');
      return;
    }
    if (!formData.availableUnits || formData.availableUnits < 0) {
      console.log('❌ Available units validation failed');
      alert('Available units must be 0 or greater');
      return;
    }
    if (!formData.priceRange || formData.priceRange.trim() === '') {
      console.log('❌ Price range validation failed');
      alert('Price range is required');
      return;
    }

    console.log('✅ Form validation passed, proceeding with save...');

    try {
      let updatedProjects;
      
      if (editingProject) {
        console.log('📝 Updating existing project:', editingProject._id);
        try {
          // Update existing project using API
          const response = await projectsAPI.update(editingProject._id, formData);
          console.log('✅ Project updated in API:', response.data);
          alert('Project updated successfully!');
          
          // Reload projects from API
          const updatedProjects = await loadProjectsFromService();
          setProjectsList(updatedProjects);
        } catch (error) {
          console.error('❌ Failed to update project:', error);
          alert('Failed to update project: ' + error.message);
          return;
        }
      } else {
        console.log('➕ Adding new project...');
        try {
          // Add new project using API
          const response = await projectsAPI.create(formData);
          console.log('✅ New project added to API:', response.data);
          alert('Project added successfully!');
          
          // Reload projects from API
          const updatedProjects = await loadProjectsFromService();
          setProjectsList(updatedProjects);
        } catch (error) {
          console.error('❌ Failed to add project to API:', error);
          alert('Failed to add project: ' + error.message);
          return;
        }
      }
      
      setShowModal(false);
      setEditingProject(null);
      console.log('🔒 Modal closed');
    } catch (err) {
      console.error('❌ Error saving project:', err);
      alert('Failed to save project');
    }
  };

  const handleToggleStatus = async (projectId) => {
    try {
      const project = projectsList.find(p => p._id === projectId);
      if (!project) return;

      const newStatus = project.status === 'active' ? 'completed' : 'active';
      
      // Update project in state and localStorage
      const updatedProjects = projectsList.map(p => 
        p._id === projectId 
          ? { ...p, status: newStatus }
          : p
      );
      setProjectsList(updatedProjects);
      saveProjectsToStorage(updatedProjects);
      
      alert(`Project status changed to ${newStatus}!`);
      
      // Try API call but don't fail if it doesn't work
      try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...project, status: newStatus })
        });

        if (response.ok) {
          console.log('✅ Status updated on backend');
        } else {
          console.log('⚠️ Backend update failed but localStorage updated');
        }
      } catch (apiError) {
        console.log('⚠️ Backend update failed but localStorage updated:', apiError.message);
      }
    } catch (err) {
      console.error('Error updating project status:', err);
      alert('Failed to update project status');
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        // Delete project using API
        await projectsAPI.delete(projectId);
        console.log('✅ Project deleted from API');
        alert('Project deleted successfully!');
        
        // Refresh projects list from API
        await fetchProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
        alert('Failed to delete project');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badgeClass = {
      active: 'bg-success',
      completed: 'bg-primary',
      planning: 'bg-warning'
    }[status] || 'bg-secondary';

    return <span className={`badge ${badgeClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <div className="projects">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Projects Management</h2>
          <p className="text-muted mb-0">Manage housing projects and availability</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ 
            cursor: 'pointer',
            zIndex: 1000,
            pointerEvents: 'auto',
            position: 'relative'
          }}
          onClick={() => {
            console.log('🔥 Add New Project button clicked!');
            handleAdd();
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add New Project
        </button>
      </div>

      {/* Projects Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-4 pb-3">
          <h5 className="mb-0">
            <i className="bi bi-building me-2 text-primary"></i>
            Projects List ({projectsList.length})
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
              <p className="text-muted">Showing fallback data</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Project Name</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Units</th>
                    <th>Price Range</th>
                    <th>Status</th>
                    <th>Completion Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsList.map((project) => (
                    <tr key={project._id || project.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                            <i className="bi bi-building text-primary"></i>
                          </div>
                          <div>
                            <div className="fw-semibold">{project.name}</div>
                            <small className="text-muted">{project.description}</small>
                          </div>
                        </div>
                      </td>
                      <td>{project.location || 'Unknown Location'}</td>
                      <td>{project.type}</td>
                      <td>
                        <div>
                          <span className="fw-semibold">{project.availableUnits || 0}</span>
                          <span className="text-muted"> / {project.totalUnits || 0}</span>
                        </div>
                        <div className="progress mt-1" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar bg-info" 
                            style={{ width: `${((project.totalUnits - project.availableUnits) / project.totalUnits) * 100 || 0}%` }}
                          ></div>
                        </div>
                      </td>
                      <td>{project.priceRange || 'N/A'}</td>
                      <td>{getStatusBadge(project.status)}</td>
                      <td>
                        <small className="text-muted">
                          {project.completionDate ? new Date(project.completionDate).toLocaleDateString() : 'N/A'}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(project)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            type="button"
                            className={`btn btn-sm ${project.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleStatus(project._id)}
                            title={project.status === 'active' ? 'Mark as Completed' : 'Mark as Active'}
                          >
                            <i className={`bi ${project.status === 'active' ? 'bi-check-circle' : 'bi-arrow-clockwise'}`}></i>
                          </button>
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(project._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-building me-2"></i>
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Project Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Location (City)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Total Units</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.totalUnits || ''}
                      onChange={(e) => setFormData({...formData, totalUnits: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Available Units</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.availableUnits || ''}
                      onChange={(e) => setFormData({...formData, availableUnits: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Apartments">Apartments</option>
                      <option value="Villas">Villas</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Price Range</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.priceRange || ''}
                      onChange={(e) => setFormData({...formData, priceRange: e.target.value})}
                      placeholder="e.g., 1M - 3M EGP"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Completion Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.completionDate || ''}
                      onChange={(e) => setFormData({...formData, completionDate: e.target.value})}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter project description"
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ 
                    cursor: 'pointer',
                    zIndex: 1000,
                    pointerEvents: 'auto',
                    position: 'relative'
                  }}
                  onClick={() => {
                    console.log('🔥 Modal Save button clicked!');
                    handleSave();
                  }}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  {editingProject ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
