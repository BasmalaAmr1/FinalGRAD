import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dataService from '../services/dataService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    type: 'all',
    priority: 'all',
    status: 'all'
  });

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load notifications from API
      await dataService.loadNotificationsFromAPI();
      const notificationsData = dataService.getNotifications();
      console.log('Notifications loaded:', notificationsData);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Setup data service subscription
  useEffect(() => {
    loadNotifications();
    
    const unsubscribe = dataService.subscribe((changeType, data, cache) => {
      if (changeType === 'notification_added' || changeType === 'notification_read') {
        loadNotifications();
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter.type !== 'all' && (notification.type || '') !== filter.type) return false;
    if (filter.priority !== 'all' && (notification.priority || 'medium') !== filter.priority) return false;
    if (filter.status !== 'all') {
      if (filter.status === 'read' && !notification.isRead) return false;
      if (filter.status === 'unread' && notification.isRead) return false;
    }
    return true;
  });

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await dataService.markNotificationRead(notificationId);
      await loadNotifications(); // Reload to update the UI
    } catch (err) {
      setError('Failed to mark notification as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await dataService.deleteNotification(notificationId);
        await loadNotifications();
      } catch (err) {
        setError('Failed to delete notification');
      }
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = filteredNotifications.filter(n => !n.isRead);
      for (const notification of unreadNotifications) {
        await dataService.markNotificationRead(notification._id);
      }
      await loadNotifications(); // Reload to update the UI
    } catch (err) {
      setError('Failed to mark all notifications as read');
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_application': return 'bi-file-earmark-text';
      case 'application_approved': return 'bi-check-circle';
      case 'application_rejected': return 'bi-x-circle';
      case 'deadline_reminder': return 'bi-clock';
      case 'system_alert': return 'bi-gear';
      case 'user_action': return 'bi-person';
      case 'system_update': return 'bi-gear';
      default: return 'bi-bell';
    }
  };

  // Get priority badge color
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><i className="bi bi-bell me-2"></i>Notifications</h2>
          <p className="text-muted mb-0">Manage system notifications and alerts</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={markAllAsRead}
            disabled={filteredNotifications.filter(n => !n.isRead).length === 0}
          >
            <i className="bi bi-check-all me-2"></i>Mark All Read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select 
                className="form-select"
                value={filter.type}
                onChange={(e) => setFilter({...filter, type: e.target.value})}
              >
                <option value="all">All Types</option>
                <option value="application_submitted">Application Submitted</option>
                <option value="application_approved">Application Approved</option>
                <option value="application_rejected">Application Rejected</option>
                <option value="deadline_reminder">Deadline Reminder</option>
                <option value="system_update">System Update</option>
                <option value="user_action">User Action</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Priority</label>
              <select 
                className="form-select"
                value={filter.priority}
                onChange={(e) => setFilter({...filter, priority: e.target.value})}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button 
                className="btn btn-outline-secondary d-block w-100"
                onClick={() => setFilter({ type: 'all', priority: 'all', status: 'all' })}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Notifications List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash fs-1 text-muted mb-3"></i>
              <h5 className="text-muted">No notifications found</h5>
              <p className="text-muted">
                {notifications.length === 0 
                  ? "No notifications available" 
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Type</th>
                    <th className="border-0">Message</th>
                    <th className="border-0">Priority</th>
                    <th className="border-0">Target</th>
                    <th className="border-0">Date</th>
                    <th className="border-0">Status</th>
                    <th className="border-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((notification) => (
                    <tr 
                      key={notification._id}
                      className={!notification.isRead ? 'table-active' : ''}
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          <i className={`bi ${getNotificationIcon(notification.type)} fs-5 me-2`}></i>
                          <div>
                            <div className="fw-medium">
                              {notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            {notification.actionRequired && (
                              <small className="text-warning">
                                <i className="bi bi-exclamation-triangle me-1"></i>Action Required
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{notification.title}</div>
                          <small className="text-muted">{notification.message}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(notification.priority || 'medium')}`}>
                          {(notification.priority || 'medium').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {notification.targetUserId ? `User: ${notification.targetUserId}` : 'System'}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}
                          <br />
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString() : 'N/A'}
                        </small>
                      </td>
                      <td>
                        {notification.isRead ? (
                          <span className="badge bg-success">Read</span>
                        ) : (
                          <span className="badge bg-warning">Unread</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {!notification.isRead && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => markAsRead(notification._id)}
                              title="Mark as read"
                            >
                              <i className="bi bi-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteNotification(notification._id)}
                            title="Delete notification"
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

      {/* Statistics */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-primary mb-1">{notifications.length}</h3>
              <p className="text-muted mb-0">Total Notifications</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-warning mb-1">{notifications.filter(n => !n.isRead).length}</h3>
              <p className="text-muted mb-0">Unread</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-danger mb-1">{notifications.filter(n => (n.priority || 'medium') === 'high').length}</h3>
              <p className="text-muted mb-0">High Priority</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-info mb-1">{notifications.filter(n => n.actionRequired).length}</h3>
              <p className="text-muted mb-0">Action Required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
