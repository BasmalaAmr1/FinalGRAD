// API Service for Findoor Backend Integration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error Response:', data);
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => err.msg).join(', ');
        throw new Error(errorMessages || data.message || 'API request failed');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Applications API
export const applicationsAPI = {
  // Get all applications
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/applications?${queryString}` : '/applications';
    return apiCall(url);
  },

  // Get single application by ID
  getById: async (id) => {
    return apiCall(`/applications/${id}`);
  },

  // Update application status
  updateStatus: async (id, statusData) => {
    console.log('🔍 Updating application status at endpoint: /applications/${id}/status');
    console.log('🔍 Status data being sent:', JSON.stringify(statusData, null, 2));
    return apiCall(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },

  // Update application (general update)
  update: async (id, updateData) => {
    return apiCall(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete application
  delete: async (id) => {
    return apiCall(`/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // Get application statistics
  getStats: async () => {
    return apiCall('/applications/stats');
  },

  // Create new application
  create: async (applicationData) => {
    console.log('🔍 Creating application at endpoint: /applications');
    console.log('🔍 Application data being sent:', JSON.stringify(applicationData, null, 2));
    return apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },
};

// Projects API
export const projectsAPI = {
  // Get all projects
  getAll: async () => {
    return apiCall('/projects');
  },

  // Get single project by ID
  getById: async (id) => {
    return apiCall(`/projects/${id}`);
  },

  // Create new project
  create: async (projectData) => {
    return apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Update project
  update: async (id, projectData) => {
    return apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  // Delete project
  delete: async (id) => {
    return apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersAPI = {
  // Get all users
  getAll: async () => {
    return apiCall('/users');
  },

  // Get single user by ID
  getById: async (id) => {
    return apiCall(`/users/${id}`);
  },

  // Create new user
  create: async (userData) => {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user
  update: async (id, userData) => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  delete: async (id) => {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Audit Logs API
export const auditLogsAPI = {
  // Get all audit logs
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/auditLogs?${queryString}` : '/auditLogs';
    return apiCall(url);
  },

  // Create audit log
  create: async (logData) => {
    return apiCall('/auditLogs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  // Get dashboard metrics
  getMetrics: async () => {
    return apiCall('/dashboard/metrics');
  },

  // Get dashboard insights
  getInsights: async () => {
    return apiCall('/dashboard/insights');
  },

  // Get application trends
  getTrends: async () => {
    return apiCall('/dashboard/trends');
  },

  // Get system health
  getHealth: async () => {
    return apiCall('/dashboard/health');
  },
};

// Notifications API
export const notificationsAPI = {
  // Get all notifications
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    return apiCall(url);
  },

  // Get single notification by ID
  getById: async (id) => {
    return apiCall(`/notifications/${id}`);
  },

  // Create new notification
  create: async (notificationData) => {
    return apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // Update notification
  update: async (id, notificationData) => {
    return apiCall(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(notificationData),
    });
  },

  // Delete notification
  delete: async (id) => {
    return apiCall(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Mark notification as read
  markAsRead: async (id) => {
    return apiCall(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (targetUserId) => {
    return apiCall('/notifications/mark-all-read', {
      method: 'PATCH',
      body: JSON.stringify({ targetUserId }),
    });
  },

  // Get unread notifications count
  getUnreadCount: async (targetUserId) => {
    const queryString = new URLSearchParams({ targetUserId }).toString();
    return apiCall(`/notifications/unread-count?${queryString}`);
  },

  // Delete expired notifications
  deleteExpired: async () => {
    return apiCall('/notifications/cleanup-expired', {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthCheck = async () => {
  return apiCall('/health');
};

export default applicationsAPI;
