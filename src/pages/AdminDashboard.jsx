import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiDataManager from '../data/apiDataManager';
import dashboardCalculations from '../utils/dashboardCalculations';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    metrics: null,
    insights: null,
    trends: null,
    systemHealth: null,
    auditLogs: [],
    projectAnalysis: []
  });
  const [actionLoading, setActionLoading] = useState({});
  const [monthlyChartData, setMonthlyChartData] = useState({
    labels: [],
    datasets: [{ data: [] }]
  });

  // Load dashboard data using API-driven approach
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading dashboard data from API...');

      // Get all dashboard data from API
      const [metrics, insights, trends, systemHealth, auditLogs, projectAnalysis] = await Promise.all([
        apiDataManager.getDashboardMetrics(),
        apiDataManager.getSmartInsights(),
        apiDataManager.getTrendCalculations(),
        apiDataManager.updateSystemHealth(),
        apiDataManager.getAuditLogs(),
        apiDataManager.getProjectDemandAnalysis()
      ]);

      // Get monthly chart data
      const monthlyData = await apiDataManager.getApplicationTrends();
      const chartData = {
        labels: monthlyData.map(t => {
          const date = new Date(t.month + '-01');
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'Total Applications',
            data: monthlyData.map(t => t.total),
            backgroundColor: 'rgba(37, 99, 235, 0.8)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Approved',
            data: monthlyData.map(t => t.approved),
            backgroundColor: 'rgba(22, 163, 74, 0.8)',
            borderColor: 'rgba(22, 163, 74, 1)',
            borderWidth: 1
          },
          {
            label: 'Pending',
            data: monthlyData.map(t => t.pending),
            backgroundColor: 'rgba(217, 119, 6, 0.8)',
            borderColor: 'rgba(217, 119, 6, 1)',
            borderWidth: 1
          },
          {
            label: 'Rejected',
            data: monthlyData.map(t => t.rejected),
            backgroundColor: 'rgba(220, 38, 38, 0.8)',
            borderColor: 'rgba(220, 38, 38, 1)',
            borderWidth: 1
          }
        ]
      };

      console.log('Dashboard data loaded from API:', {
        metrics,
        insights,
        systemHealth
      });

      setDashboardData({
        metrics,
        insights,
        trends,
        systemHealth,
        auditLogs: auditLogs.slice(0, 10), // Latest 10 logs
        projectAnalysis: projectAnalysis.slice(0, 5) // Top 5 projects by demand
      });

      setMonthlyChartData(chartData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load dashboard data from server. Please check your connection and refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real actions for approving/rejecting applications
  const handleApproveApplication = async (applicationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [applicationId]: 'approving' }));
      
      const success = await apiDataManager.approveApplication(applicationId);
      
      if (success) {
        // Reload dashboard data
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [applicationId]: null }));
    }
  };

  const handleRejectApplication = async (applicationId, reason = '') => {
    try {
      setActionLoading(prev => ({ ...prev, [applicationId]: 'rejecting' }));
      
      const success = await apiDataManager.rejectApplication(applicationId, reason);
      
      if (success) {
        // Reload dashboard data
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [applicationId]: null }));
    }
  };

  // Get latest 5 applications
  const [recentApplications, setRecentApplications] = useState([]);
  
  useEffect(() => {
    const getRecentApplications = async () => {
      try {
        console.log('🔍 Loading recent applications...');
        const applications = await apiDataManager.getApplications();
        console.log('📊 Applications loaded:', applications.length);
        
        const sorted = applications
          .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
          .slice(0, 5);
        
        console.log('🎯 Recent applications sorted:', sorted.length);
        sorted.forEach((app, index) => {
          console.log(`${index + 1}. ${app.applicantName} - ${app.projectName}`);
        });
        
        setRecentApplications(sorted);
      } catch (error) {
        console.error('❌ Error getting recent applications:', error);
        setRecentApplications([]);
      }
    };
    
    getRecentApplications();
  }, [dashboardData]); // Refresh when dashboard data updates

  // Setup API data manager subscription and initial load
  useEffect(() => {
    // Load initial data
    loadDashboardData();
    
    // Subscribe to API data changes for real-time updates
    const unsubscribe = apiDataManager.subscribe((data) => {
      console.log('Dashboard received API data change:', data.type);
      // Only reload if it's relevant data change (not dashboard's own data loading)
      if (data.type && data.type !== 'dashboard_loaded') {
        console.log('Reloading dashboard due to relevant data change...');
        // Reload dashboard data
        loadDashboardData();
      }
    });
    
    // Set up auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(() => {
      loadDashboardData();
      setCurrentTime(new Date());
    }, 30000);
    
    // Update current time every second for display
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Log admin login
    apiDataManager.addAuditLog('login', 'Admin accessed dashboard', user?.name || 'Admin');
    
    return () => {
      unsubscribe();
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [loadDashboardData, user?.name]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Simple chart replacements
  const SimpleBarChart = ({ data, title }) => {
    if (!data || !data.datasets || !data.datasets[0] || !data.datasets[0].data || data.datasets[0].data.length === 0) {
      return (
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h6 className="mb-3">{title}</h6>
          <div className="text-center text-muted">
            <i className="bi bi-bar-chart fs-1 mb-2"></i>
            <p>No data available</p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h6 className="mb-3">{title}</h6>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '200px', width: '100%' }}>
          {data.labels.map((label, index) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ 
                width: '60px', 
                backgroundColor: '#007bff', 
                height: `${Math.max(...data.datasets[0].data) > 0 ? (data.datasets[0].data[index] / Math.max(...data.datasets[0].data)) * 180 : 10}px`,
                borderRadius: '4px 4px 0 0',
                marginBottom: '10px'
              }}></div>
              <small className="text-muted">{label}</small>
              <strong>{data.datasets[0].data[index]}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SimpleDoughnutChart = ({ data, title }) => {
    if (!data || !data.datasets || !data.datasets[0] || !data.datasets[0].data || data.datasets[0].data.length === 0) {
      return (
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h6 className="mb-3">{title}</h6>
          <div className="text-center text-muted">
            <i className="bi bi-pie-chart fs-1 mb-2"></i>
            <p>No data available</p>
          </div>
        </div>
      );
    }

    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
    const colors = ['#28a745', '#dc3545', '#ffc107', '#17a2b8'];
    
    return (
      <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h6 className="mb-3">{title}</h6>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: `conic-gradient(${data.labels.map((label, index) => {
              const percentage = total > 0 ? (data.datasets[0].data[index] / total) * 100 : 0;
              const startAngle = total > 0 ? data.datasets[0].data.slice(0, index).reduce((a, b) => a + b, 0) / total * 360 : 0;
              return `${colors[index]} ${startAngle}deg ${startAngle + (percentage * 3.6)}deg`;
            }).join(', ')})` 
          }}></div>
          <div>
            {data.labels.map((label, index) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: colors[index], borderRadius: '2px' }}></div>
                <small>{label}: {data.datasets[0].data[index]}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      case 'pending': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  // Prepare chart data using API data
  const prepareMonthlyData = async () => {
    try {
      const trends = await apiDataManager.getApplicationTrends();
      
      if (!trends || trends.length === 0) {
        return {
          labels: [],
          datasets: [{ data: [] }]
        };
      }

      return {
        labels: trends.map(t => {
          const date = new Date(t.month + '-01');
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'Total Applications',
            data: trends.map(t => t.total),
            backgroundColor: 'rgba(37, 99, 235, 0.8)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Approved',
            data: trends.map(t => t.approved),
            backgroundColor: 'rgba(22, 163, 74, 0.8)',
            borderColor: 'rgba(22, 163, 74, 1)',
            borderWidth: 1
          },
          {
            label: 'Pending',
            data: trends.map(t => t.pending),
            backgroundColor: 'rgba(217, 119, 6, 0.8)',
            borderColor: 'rgba(217, 119, 6, 1)',
            borderWidth: 1
          },
          {
            label: 'Rejected',
            data: trends.map(t => t.rejected),
            backgroundColor: 'rgba(220, 38, 38, 0.8)',
            borderColor: 'rgba(220, 38, 38, 1)',
            borderWidth: 1
          }
        ]
      };
    } catch (error) {
      console.error('Error preparing monthly data:', error);
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }
  };

  const prepareStatusData = () => {
    if (!dashboardData.metrics) {
      return {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: [
              'rgba(22, 163, 74, 0.8)',
              'rgba(217, 119, 6, 0.8)',
              'rgba(220, 38, 38, 0.8)'
            ],
            borderColor: [
              'rgba(22, 163, 74, 1)',
              'rgba(217, 119, 6, 1)',
              'rgba(220, 38, 38, 1)'
            ],
            borderWidth: 1
          }
        ]
      };
    }

    return {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [
            dashboardData.metrics.approvedApplications,
            dashboardData.metrics.pendingApplications,
            dashboardData.metrics.rejectedApplications
          ],
          backgroundColor: [
            'rgba(22, 163, 74, 0.8)',
            'rgba(217, 119, 6, 0.8)',
            'rgba(220, 38, 38, 0.8)'
          ],
          borderColor: [
            'rgba(22, 163, 74, 1)',
            'rgba(217, 119, 6, 1)',
            'rgba(220, 38, 38, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading dashboard with live data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4><i className="bi bi-exclamation-triangle me-2"></i>Error Loading Dashboard</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>
            <i className="bi bi-arrow-clockwise me-2"></i>Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* 🔝 Top Header Bar */}
      <div className="container-fluid px-4 py-3" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #e5e7eb' }}>
        <div className="row align-items-center">
          <div className="col-md-6">
            <h1 className="h2 mb-1" style={{ color: '#1f2937', fontWeight: '600' }}>
              <i className="bi bi-speedometer2 me-2 text-primary"></i>
              Smart Admin Dashboard
            </h1>
            <p className="mb-0" style={{ color: '#6b7280', fontSize: '14px' }}>
              Welcome back, {user?.name || 'Admin'} — Here's what needs your attention today
            </p>
          </div>
          <div className="col-md-6 text-md-end mt-2 mt-md-0">
            <div className="d-flex flex-column flex-md-row align-items-md-center gap-2">
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </small>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={loadDashboardData}
                  disabled={loading}
                  type="button"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh Data
                </button>
                <Link to="/applications/new" className="btn btn-primary btn-sm">
                  <i className="bi bi-plus-circle me-1"></i>
                  Add Application
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 Smart Insights Section */}
      <div className="container-fluid px-4 py-4">
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-lightbulb text-warning me-2" style={{ fontSize: '20px' }}></i>
                  <h5 className="mb-0">Smart Insights</h5>
                </div>
                <div className="row g-3">
                  {dashboardData.insights?.pendingOver3Days > 0 && (
                    <div className="col-md-4">
                      <div className="alert alert-danger d-flex align-items-center" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <div>
                          <strong>{dashboardData.insights.pendingOver3Days} Applications</strong> pending over 3 days
                          <br />
                          <small className="text-muted">Requires immediate attention</small>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dashboardData.insights?.highDemandProjects.length > 0 && (
                    <div className="col-md-4">
                      <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <i className="bi bi-graph-up me-2"></i>
                        <div>
                          <strong>{dashboardData.insights.highDemandProjects.length} High-Demand Projects</strong>
                          <br />
                          <small className="text-muted">
                            {dashboardData.insights.highDemandProjects.map(p => p.name).join(', ')}
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dashboardData.insights?.lowApprovalRate && (
                    <div className="col-md-4">
                      <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <i className="bi bi-percent me-2"></i>
                        <div>
                          <strong>Low Approval Rate</strong> ({dashboardData.metrics?.approvalRate}%)
                          <br />
                          <small className="text-muted">Consider reviewing criteria</small>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dashboardData.insights?.pendingOver3Days === 0 && 
                   dashboardData.insights?.highDemandProjects.length === 0 && 
                   !dashboardData.insights?.lowApprovalRate && (
                    <div className="col-12">
                      <div className="alert alert-success d-flex align-items-center" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        <div>
                          <strong>All Systems Running Smoothly</strong>
                          <br />
                          <small className="text-muted">No critical issues detected</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Enhanced KPI Cards */}
        <div className="row g-4 mb-4">
          <div className="col-xl-3 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                      <i className="bi bi-file-earmark-text text-primary" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <h6 className="mb-0 text-muted">Applications</h6>
                      <h3 className="mb-0 fw-bold">{dashboardData.metrics?.totalApplications || 0}</h3>
                    </div>
                  </div>
                  <div className="text-end">
                    {dashboardData.trends?.weeklyChange?.applications !== 0 && (
                      <span className={`badge bg-${dashboardData.trends.weeklyChange.applications > 0 ? 'success' : 'danger'} bg-opacity-10 text-${dashboardData.trends.weeklyChange.applications > 0 ? 'success' : 'danger'}`}>
                        <i className={`bi bi-arrow-${dashboardData.trends.weeklyChange.applications > 0 ? 'up' : 'down'} me-1`}></i>
                        {Math.abs(dashboardData.trends.weeklyChange.applications)}%
                      </span>
                    )}
                  </div>
                </div>
                <small className="text-muted">
                  {dashboardData.metrics?.pendingApplications || 0} pending • {dashboardData.metrics?.approvedApplications || 0} approved
                </small>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 rounded p-2 me-3">
                      <i className="bi bi-people text-info" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <h6 className="mb-0 text-muted">Users</h6>
                      <h3 className="mb-0 fw-bold">{dashboardData.metrics?.totalUsers || 0}</h3>
                    </div>
                  </div>
                  <div className="text-end">
                    {dashboardData.trends?.weeklyChange?.users !== 0 && (
                      <span className={`badge bg-${dashboardData.trends.weeklyChange.users > 0 ? 'success' : 'danger'} bg-opacity-10 text-${dashboardData.trends.weeklyChange.users > 0 ? 'success' : 'danger'}`}>
                        <i className={`bi bi-arrow-${dashboardData.trends.weeklyChange.users > 0 ? 'up' : 'down'} me-1`}></i>
                        {Math.abs(dashboardData.trends.weeklyChange.users)}%
                      </span>
                    )}
                  </div>
                </div>
                <small className="text-muted">
                  Active this week
                </small>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 rounded p-2 me-3">
                      <i className="bi bi-building text-success" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <h6 className="mb-0 text-muted">Projects</h6>
                      <h3 className="mb-0 fw-bold">{dashboardData.metrics?.totalProjects || 0}</h3>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success bg-opacity-10 text-success">
                      <i className="bi bi-arrow-up me-1"></i>
                      Active
                    </span>
                  </div>
                </div>
                <small className="text-muted">
                  {dashboardData.metrics?.activeProjects || 0} active • {dashboardData.metrics?.planningProjects || 0} planning
                </small>
                <div className="mt-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Weekly Change:</span>
                    <span className={`badge bg-${dashboardData.trends?.weeklyChange?.applications > 0 ? 'success' : 'danger'} bg-opacity-10 text-${dashboardData.trends?.weeklyChange?.applications > 0 ? 'success' : 'danger'}`}>
                      <i className={`bi bi-arrow-${dashboardData.trends?.weeklyChange?.applications > 0 ? 'up' : 'down'} me-1`}></i>
                      {Math.abs(dashboardData.trends?.weeklyChange?.applications || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 rounded p-2 me-3">
                      <i className="bi bi-percent text-warning" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <h6 className="mb-0 text-muted">Approval Rate</h6>
                      <h3 className="mb-0 fw-bold">{dashboardData.metrics?.approvalRate || 0}%</h3>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`badge bg-${dashboardData.insights?.lowApprovalRate ? 'danger' : 'success'} bg-opacity-10 text-${dashboardData.insights?.lowApprovalRate ? 'danger' : 'success'}`}>
                      {dashboardData.insights?.lowApprovalRate ? 'Low' : 'Good'}
                    </span>
                  </div>
                </div>
                <small className="text-muted">
                  {dashboardData.metrics?.approvedApplications || 0} of {dashboardData.metrics?.totalApplications || 0} approved
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ Quick Actions Panel */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-lightning-charge text-primary me-2" style={{ fontSize: '20px' }}></i>
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <Link to="/applications" className="btn btn-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4">
                      <i className="bi bi-clipboard-check mb-3" style={{ fontSize: '32px' }}></i>
                      <span className="fs-5 fw-bold">View Applications</span>
                      <small className="text-muted">Manage all applications</small>
                    </Link>
                  </div>
                  <div className="col-md-6">
                    <Link 
                      to="/applications?status=pending"
                      className="btn btn-success w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 text-decoration-none text-white"
                    >
                      <i className="bi bi-check-circle mb-3" style={{ fontSize: '32px' }}></i>
                      <span className="fs-5 fw-bold">Approve Pending</span>
                      <small className="text-muted">Review and approve pending applications</small>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* 📈 Enhanced Charts Section */}
        <div className="row g-4 mb-4">
          <div className="col-xl-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Application Trends (By Date)</h5>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary">
                      <i className="bi bi-calendar3 me-1"></i>
                      Last 6 Months
                    </span>
                    <small className="text-muted">
                      {dashboardData.metrics?.thisMonthApplications || 0} this month
                    </small>
                  </div>
                </div>
                <SimpleBarChart data={monthlyChartData} title="Monthly Applications" />
                <div className="mt-3 text-center">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Applications grouped by submission date
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Status Distribution</h5>
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-three-dots"></i>
                  </button>
                </div>
                <SimpleDoughnutChart data={prepareStatusData()} title="Application Status" />
                <div className="mt-3">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="bg-success bg-opacity-10 rounded p-2">
                        <small className="text-success d-block fw-bold">{dashboardData.metrics?.approvedApplications || 0}</small>
                        <small className="text-muted">Approved</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-warning bg-opacity-10 rounded p-2">
                        <small className="text-warning d-block fw-bold">{dashboardData.metrics?.pendingApplications || 0}</small>
                        <small className="text-muted">Pending</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-danger bg-opacity-10 rounded p-2">
                        <small className="text-danger d-block fw-bold">{dashboardData.metrics?.rejectedApplications || 0}</small>
                        <small className="text-muted">Rejected</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 Recent Applications with Real Actions */}
        <div className="row g-4 mb-4">
          <div className="col-xl-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Recent Applications</h5>
                  <Link to="/applications" className="btn btn-sm btn-outline-primary">
                    View All
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Applicant</th>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.length > 0 ? (
                        recentApplications.map((app) => (
                          <tr key={app.id}>
                            <td>
                              <small className="text-muted font-monospace">
                                #{app.id?.toString().slice(-6) || 'N/A'}
                              </small>
                            </td>
                            <td className="fw-medium">{app.applicantName || 'Unknown'}</td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {app.projectName || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(app.submittedDate)}
                              </small>
                            </td>
                            <td>
                              {app.status === 'pending' && (
                                <div className="btn-group btn-group-sm" role="group">
                                  <button 
                                    className="btn btn-success"
                                    onClick={() => handleApproveApplication(app.id)}
                                    disabled={actionLoading[app.id] === 'approving'}
                                  >
                                    {actionLoading[app.id] === 'approving' ? (
                                      <span className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                      </span>
                                    ) : (
                                      <i className="bi bi-check"></i>
                                    )}
                                  </button>
                                  <button 
                                    className="btn btn-danger"
                                    onClick={() => handleRejectApplication(app.id, 'Rejected by admin')}
                                    disabled={actionLoading[app.id] === 'rejecting'}
                                  >
                                    {actionLoading[app.id] === 'rejecting' ? (
                                      <span className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                      </span>
                                    ) : (
                                      <i className="bi bi-x"></i>
                                    )}
                                  </button>
                                </div>
                              )}
                              {app.status !== 'pending' && (
                                <span className="text-muted">
                                  <i className={`bi bi-${app.status === 'approved' ? 'check-circle text-success' : 'x-circle text-danger'}`}></i>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <div className="text-muted">
                              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                              <p className="mb-0">No recent applications found</p>
                              <small>Applications will appear here once submitted</small>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">System Health</h5>
                  <span className={`badge bg-${dashboardData.systemHealth?.databaseStatus === 'Connected' ? 'success' : 'danger'} bg-opacity-10 text-${dashboardData.systemHealth?.databaseStatus === 'Connected' ? 'success' : 'danger'}`}>
                    <i className="bi bi-circle-fill me-1"></i>
                    {dashboardData.systemHealth?.databaseStatus || 'Unknown'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Database</span>
                    <span className={`badge bg-${dashboardData.systemHealth?.databaseStatus === 'Connected' ? 'success' : 'danger'}`}>
                      {dashboardData.systemHealth?.databaseStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">API Response</span>
                    <span className={`badge bg-${dashboardData.systemHealth?.apiResponseTime === 'Fast' ? 'success' : dashboardData.systemHealth?.apiResponseTime === 'Medium' ? 'warning' : 'danger'}`}>
                      {dashboardData.systemHealth?.apiResponseTime || 'Unknown'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Storage</span>
                    <span className={`badge bg-${dashboardData.systemHealth?.storageUsage > 80 ? 'danger' : dashboardData.systemHealth?.storageUsage > 60 ? 'warning' : 'success'}`}>
                      {Math.round(dashboardData.systemHealth?.storageUsage || 0)}%
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Last Backup</span>
                    <span className="badge bg-success">
                      {dashboardData.systemHealth?.lastBackup ? 
                        new Date(dashboardData.systemHealth.lastBackup).toLocaleDateString() : 
                        'Unknown'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 Recent Activity Feed */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Recent Activity</h5>
                  <Link to="/audit" className="btn btn-sm btn-outline-primary">
                    View All
                  </Link>
                </div>
                <div className="activity-feed">
                  {dashboardData.auditLogs?.slice(0, 5).map(log => (
                    <div key={log.id} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                      <div className={`rounded-circle p-2 me-3 bg-${log.action.includes('approved') ? 'success' : log.action.includes('rejected') ? 'danger' : 'primary'} bg-opacity-10`}>
                        <i className={`bi bi-${log.action.includes('approved') ? 'check-circle' : log.action.includes('rejected') ? 'x-circle' : 'file-earmark'} text-${log.action.includes('approved') ? 'success' : log.action.includes('rejected') ? 'danger' : 'primary'}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between">
                          <h6 className="mb-1">{log.details}</h6>
                          <small className="text-muted">{formatDate(log.timestamp)}</small>
                        </div>
                        <small className="text-muted">by {log.userName}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
