const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        ref: 'User'
    },
    userName: {
        type: String,
        required: [true, 'User name is required'],
        trim: true
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: [
            'LOGIN',
            'LOGOUT',
            'APPLICATION_CREATED',
            'APPLICATION_UPDATED',
            'APPLICATION_APPROVED',
            'APPLICATION_REJECTED',
            'PROJECT_CREATED',
            'PROJECT_UPDATED',
            'PROJECT_DELETED',
            'USER_CREATED',
            'USER_UPDATED',
            'USER_DELETED',
            'USER_VERIFIED'
        ]
    },
    targetId: {
        type: String,
        required: false
    },
    targetType: {
        type: String,
        enum: ['user', 'application', 'project', 'system'],
        required: false
    },
    ipAddress: {
        type: String,
        required: [true, 'IP address is required']
    },
    userAgent: {
        type: String,
        required: [true, 'User agent is required']
    },
    details: {
        type: String,
        required: [true, 'Details are required'],
        trim: true,
        maxlength: [500, 'Details cannot exceed 500 characters']
    },
    previousStatus: {
        type: String,
        required: false
    },
    newStatus: {
        type: String,
        required: false
    },
    rejectionReason: {
        type: String,
        required: false,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Index for better query performance
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetId: 1, targetType: 1 });

// Virtual for formatted creation date
auditLogSchema.virtual('createdFormatted').get(function() {
    return this.createdAt ? this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
