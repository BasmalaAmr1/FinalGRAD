import React, { useState, useEffect } from 'react';
import dataService from '../services/dataService';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [reportData, setReportData] = useState({
    users: [],
    projects: [],
    applications: [],
    auditLogs: []
  });

  // Load data using data service
  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all data using async service
      const users = dataService.getUsers();
      const projects = await dataService.getProjects();
      const applications = dataService.getApplications();
      const auditLogs = dataService.getAuditLogs();
      
      setReportData({
        users,
        projects,
        applications,
        auditLogs
      });
      console.log('Government Housing Reports loaded:', {
        users: users.length,
        projects: projects.length,
        applications: applications.length,
        auditLogs: auditLogs.length
      });
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Setup data service subscription and initial load
  useEffect(() => {
    loadReportData();
  }, []);

  // Calculate comprehensive statistics
  const calculateStatistics = () => {
    const { users, projects, applications, auditLogs } = reportData;
    
    // Application Statistics
    const totalApplications = applications.length;
    const approvedApplications = applications.filter(app => app.status === 'approved').length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
    
    // Project Statistics
    const totalProjects = projects.length;
    const activeProjects = projects.filter(proj => proj.status === 'active').length;
    const completedProjects = projects.filter(proj => proj.status === 'completed').length;
    
    // User Statistics
    const totalUsers = users.length;
    
    // Performance Metrics
    const calculateAvgApprovalTime = () => {
      const approvedApps = applications.filter(app => app.status === 'approved' && app.reviewedAt);
      if (approvedApps.length === 0) return '0.0';
      
      const totalTime = approvedApps.reduce((sum, app) => {
        const submitted = new Date(app.submittedAt);
        const reviewed = new Date(app.reviewedAt);
        const days = Math.floor((reviewed - submitted) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      
      return (totalTime / approvedApps.length).toFixed(1);
    };
    
    // Most requested project
    const getMostRequestedProject = () => {
      const projectCounts = {};
      applications.forEach(app => {
        const project = projects.find(p => p.id === app.projectId);
        if (project) {
          projectCounts[project.name] = (projectCounts[project.name] || 0) + 1;
        }
      });
      
      return Object.keys(projectCounts).length > 0 ? 
        Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0][0] : 
        'N/A';
    };
    
    // Highest demand city
    const getHighestDemandCity = () => {
      const cityCounts = {};
      projects.forEach(proj => {
        const city = proj.location?.city || 'Unknown';
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      });
      
      return Object.keys(cityCounts).length > 0 ? 
        Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0][0] : 
        'N/A';
    };
    
    // Monthly approvals
    const getMonthlyApprovals = () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      return applications.filter(app => {
        if (app.status !== 'approved' || !app.reviewedAt) return false;
        const reviewedDate = new Date(app.reviewedAt);
        return reviewedDate.getMonth() === currentMonth && reviewedDate.getFullYear() === currentYear;
      }).length;
    };
    
    return {
      totalApplications,
      approvedApplications,
      pendingApplications,
      rejectedApplications,
      totalProjects,
      activeProjects,
      completedProjects,
      totalUsers,
      avgApprovalTime: calculateAvgApprovalTime(),
      mostRequestedProject: getMostRequestedProject(),
      highestDemandCity: getHighestDemandCity(),
      monthlyApprovals: getMonthlyApprovals()
    };
  };

  const stats = calculateStatistics();

  // Filter data based on selected filters
  const getFilteredData = () => {
    let filteredApplications = [...reportData.applications];
    let filteredProjects = [...reportData.projects];
    
    // Status filter
    if (selectedStatus !== 'all') {
      filteredApplications = filteredApplications.filter(app => app.status === selectedStatus);
    }
    
    // Project filter
    if (selectedProject !== 'all') {
      filteredApplications = filteredApplications.filter(app => app.projectId === selectedProject);
    }
    
    // City filter
    if (selectedCity !== 'all') {
      filteredProjects = filteredProjects.filter(proj => proj.location?.city === selectedCity);
      const projectIds = new Set(filteredProjects.map(p => p.id));
      filteredApplications = filteredApplications.filter(app => projectIds.has(app.projectId));
    }
    
    // Date range filter
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filteredApplications = filteredApplications.filter(app => 
          new Date(app.submittedAt) >= startDate
        );
      }
    }
    
    return { filteredApplications, filteredProjects };
  };

  const { filteredApplications, filteredProjects } = getFilteredData();

  // Get unique cities for filter
  const getUniqueCities = () => {
    const cities = [...new Set(reportData.projects.map(proj => proj.location?.city).filter(Boolean))];
    return cities.sort();
  };

  // Chart data calculations
  const getApplicationsByStatus = () => {
    return [
      { name: 'Approved', value: stats.approvedApplications, color: '#28a745' },
      { name: 'Pending', value: stats.pendingApplications, color: '#ffc107' },
      { name: 'Rejected', value: stats.rejectedApplications, color: '#dc3545' }
    ];
  };

  const getApplicationsByMonth = () => {
    const monthData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach(month => monthData[month] = 0);
    
    reportData.applications.forEach(app => {
      const month = new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short' });
      if (monthData[month] !== undefined) {
        monthData[month]++;
      }
    });
    
    return Object.entries(monthData).map(([month, count]) => ({ month, count }));
  };

  const getProjectsByCity = () => {
    const cityData = {};
    
    reportData.projects.forEach(proj => {
      const city = proj.location?.city || 'Unknown';
      cityData[city] = (cityData[city] || 0) + 1;
    });
    
    return Object.entries(cityData).map(([city, count]) => ({ city, count }));
  };

  // Export functions
  const exportToCSV = (type, data) => {
    try {
      let csvData = [];
      let filename = '';
      let headers = [];

      if (type === 'applications') {
        headers = ['Application ID', 'Applicant Name', 'Project Name', 'Status', 'Submission Date'];
        csvData = data.map(app => {
          const user = reportData.users.find(u => u.id === app.userId);
          const project = reportData.projects.find(p => p.id === app.projectId);
          return [
            app.id,
            user?.name || 'Unknown',
            project?.name || 'Unknown',
            app.status,
            new Date(app.submittedAt).toLocaleDateString()
          ];
        });
        filename = `applications-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'projects') {
        headers = ['Project Name', 'Location', 'Available Units', 'Sold Units', 'Progress %'];
        csvData = data.map(proj => [
          proj.name,
          `${proj.location?.city || 'Unknown'}, ${proj.location?.district || 'Unknown'}`,
          proj.development?.availableUnits || 0,
          proj.development?.soldUnits || 0,
          proj.timeline?.constructionProgress || 0
        ]);
        filename = `projects-report-${new Date().toISOString().split('T')[0]}.csv`;
      }

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log(`${type} report exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading Government Housing Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4><i className="bi bi-exclamation-triangle me-2"></i>Error Loading Reports</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadReportData}>
            <i className="bi bi-arrow-clockwise me-2"></i>Try Again
          </button>
        </div>
      </div>
    );
  }

  const applicationsByStatus = getApplicationsByStatus();
  const applicationsByMonth = getApplicationsByMonth();
  const projectsByCity = getProjectsByCity();

  return (
    <div className="container-fluid mt-4 px-3 px-lg-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-graph-up text-primary me-2"></i>
            Government Housing Analytics Dashboard
          </h2>
          <p className="text-muted mb-0">
            Ministry of Housing - Real-time System Performance Monitoring
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={() => exportToCSV('applications', filteredApplications)}>
            <i className="bi bi-file-earmark-excel me-2"></i>Export Applications
          </button>
          <button className="btn btn-info" onClick={() => exportToCSV('projects', filteredProjects)}>
            <i className="bi bi-building me-2"></i>Export Projects
          </button>
          <button className="btn btn-secondary" onClick={printReport}>
            <i className="bi bi-printer me-2"></i>Print Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <i className="bi bi-funnel text-primary me-2"></i>
            Data Filters
          </h5>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Date Range</label>
              <select 
                className="form-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Project Name</label>
              <select 
                className="form-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="all">All Projects</option>
                {reportData.projects.map(proj => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">City / Governorate</label>
              <select 
                className="form-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="all">All Cities</option>
                {getUniqueCities().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Application Status</label>
              <select 
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-file-earmark-text text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Applications</h6>
                  <h3 className="mb-0 fw-bold">{stats.totalApplications}</h3>
                  <small className="text-muted">All time</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Approved Applications</h6>
                  <h3 className="mb-0 fw-bold text-success">{stats.approvedApplications}</h3>
                  <small className="text-muted">Families housed</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-clock-history text-warning fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Pending Applications</h6>
                  <h3 className="mb-0 fw-bold text-warning">{stats.pendingApplications}</h3>
                  <small className="text-muted">Under review</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-x-circle text-danger fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Rejected Applications</h6>
                  <h3 className="mb-0 fw-bold text-danger">{stats.rejectedApplications}</h3>
                  <small className="text-muted">Not eligible</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-building text-info fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Projects</h6>
                  <h3 className="mb-0 fw-bold text-info">{stats.totalProjects}</h3>
                  <small className="text-muted">Housing projects</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-hammer text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Active Projects</h6>
                  <h3 className="mb-0 fw-bold text-success">{stats.activeProjects}</h3>
                  <small className="text-muted">Under construction</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-people text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Users</h6>
                  <h3 className="mb-0 fw-bold text-primary">{stats.totalUsers}</h3>
                  <small className="text-muted">Registered citizens</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart text-primary me-2"></i>
                Applications by Status
              </h5>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto' }}>
                  <div 
                    style={{ 
                      width: '180px', 
                      height: '180px', 
                      borderRadius: '50%', 
                      background: `conic-gradient(#28a745 0deg ${applicationsByStatus[0]?.value * 360 / stats.totalApplications}deg, #ffc107 ${applicationsByStatus[0]?.value * 360 / stats.totalApplications}deg ${(applicationsByStatus[0]?.value + applicationsByStatus[1]?.value) * 360 / stats.totalApplications}deg, #dc3545 ${(applicationsByStatus[0]?.value + applicationsByStatus[1]?.value) * 360 / stats.totalApplications}deg 360deg)`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  ></div>
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)', 
                      background: 'white', 
                      width: '90px', 
                      height: '90px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 'bold',
                      fontSize: '18px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {stats.totalApplications}
                  </div>
                </div>
              </div>
              <div className="legend">
                {applicationsByStatus.map(item => (
                  <div key={item.name} className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div style={{ width: '12px', height: '12px', background: item.color, marginRight: '8px', borderRadius: '2px' }}></div>
                      <span className="small">{item.name}</span>
                    </div>
                    <span className="small fw-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart text-primary me-2"></i>
                Applications per Month
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-end justify-content-between" style={{ height: '200px', padding: '10px 5px' }}>
                {applicationsByMonth.slice(0, 6).map((item, index) => {
                  const maxValue = Math.max(...applicationsByMonth.slice(0, 6).map(m => m.count));
                  const height = maxValue > 0 ? (item.count / maxValue) * 160 : 10;
                  return (
                    <div key={item.month} className="text-center" style={{ flex: 1 }}>
                      <div className="d-flex flex-column align-items-center" style={{ height: '170px', justifyContent: 'flex-end' }}>
                        <div 
                          className="bg-primary rounded-top" 
                          style={{ 
                            width: '25px', 
                            height: `${height}px`, 
                            marginBottom: '2px',
                            transition: 'all 0.3s ease'
                          }}
                        ></div>
                        <div className="mt-1" style={{ fontSize: '10px', fontWeight: '500' }}>{item.month}</div>
                        <div className="text-muted" style={{ fontSize: '8px' }}>{item.count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-geo-alt text-primary me-2"></i>
                Projects by City
              </h5>
            </div>
            <div className="card-body">
              {projectsByCity.map((item, index) => (
                <div key={item.city} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="fw-medium">{item.city}</small>
                    <small className="text-muted">{item.count} projects</small>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div 
                      className="progress-bar bg-info" 
                      style={{ width: `${(item.count / Math.max(...projectsByCity.map(c => c.count))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-speedometer2 text-primary me-2"></i>
                Performance Metrics
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="bg-primary bg-opacity-10 rounded p-3">
                    <h4 className="text-primary mb-1">{stats.avgApprovalTime} <small className="text-muted">days</small></h4>
                    <small className="text-muted">Average Approval Time</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="bg-success bg-opacity-10 rounded p-3">
                    <h5 className="text-success mb-1">{stats.mostRequestedProject}</h5>
                    <small className="text-muted">Most Requested Project</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="bg-info bg-opacity-10 rounded p-3">
                    <h5 className="text-info mb-1">{stats.highestDemandCity}</h5>
                    <small className="text-muted">Highest Demand City</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="bg-warning bg-opacity-10 rounded p-3">
                    <h4 className="text-warning mb-1">{stats.monthlyApprovals}</h4>
                    <small className="text-muted">Approvals This Month</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports Tables */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-file-earmark-text text-primary me-2"></i>
                Applications Report
              </h5>
            </div>
            <div className="card-body">
              {filteredApplications.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Applicant Name</th>
                        <th>Project Name</th>
                        <th>Status</th>
                        <th>Submission Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map(app => {
                        const user = reportData.users.find(u => u.id === app.userId);
                        const project = reportData.projects.find(p => p.id === app.projectId);
                        return (
                          <tr key={app.id}>
                            <td><small className="font-monospace">{app.id?.slice(-8)}</small></td>
                            <td>{user?.name || 'Unknown'}</td>
                            <td>{project?.name || 'Unknown'}</td>
                            <td>
                              <span className={`badge bg-${
                                app.status === 'approved' ? 'success' :
                                app.status === 'pending' ? 'warning' : 'danger'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td><small>{new Date(app.submittedAt).toLocaleDateString()}</small></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2">No applications found matching current filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-building text-primary me-2"></i>
                Projects Report
              </h5>
            </div>
            <div className="card-body">
              {filteredProjects.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Location</th>
                        <th>Available Units</th>
                        <th>Sold Units</th>
                        <th>Progress %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map(proj => (
                        <tr key={proj.id}>
                          <td>{proj.name}</td>
                          <td><small>{proj.location?.city || 'Unknown'}</small></td>
                          <td>{proj.development?.availableUnits || 0}</td>
                          <td>{proj.development?.soldUnits || 0}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar bg-success" 
                                  style={{ width: `${proj.timeline?.constructionProgress || 0}%` }}
                                ></div>
                              </div>
                              <small>{proj.timeline?.constructionProgress || 0}%</small>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-building text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2">No projects found matching current filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {stats.totalApplications === 0 && stats.totalProjects === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-graph-up text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="text-muted mt-3">No Report Data Available</h4>
          <p className="text-muted">
            There is currently no data to display in the Government Housing Analytics Dashboard.
            <br />
            Please ensure data is properly configured in the system.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
