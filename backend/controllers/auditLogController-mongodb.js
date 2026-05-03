const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');

// @desc    Get all audit logs
// @route   GET /api/auditLogs
// @access  Public
exports.getAllAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const action = req.query.action;
        const userId = req.query.userId;
        const targetType = req.query.targetType;
        const search = req.query.search;

        // Build query
        let query = {};
        
        if (action) {
            query.action = action;
        }
        
        if (userId) {
            query.userId = userId;
        }
        
        if (targetType && ['user', 'application', 'project', 'system'].includes(targetType)) {
            query.targetType = targetType;
        }
        
        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } }
            ];
        }

        const auditLogs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: auditLogs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: auditLogs
        });
    } catch (error) {
        console.error('Error in getAllAuditLogs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit logs',
            error: error.message
        });
    }
};

// @desc    Get single audit log by ID
// @route   GET /api/auditLogs/:id
// @access  Public
exports.getAuditLogById = async (req, res) => {
    try {
        const auditLog = await AuditLog.findById(req.params.id);

        if (!auditLog) {
            return res.status(404).json({
                success: false,
                message: 'Audit log not found'
            });
        }

        res.status(200).json({
            success: true,
            data: auditLog
        });
    } catch (error) {
        console.error('Error in getAuditLogById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit log',
            error: error.message
        });
    }
};

// @desc    Create new audit log
// @route   POST /api/auditLogs
// @access  Public
exports.createAuditLog = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        // Create audit log
        const auditLog = await AuditLog.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Audit log created successfully',
            data: auditLog
        });
    } catch (error) {
        console.error('Error in createAuditLog:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating audit log',
            error: error.message
        });
    }
};

// @desc    Get audit log statistics
// @route   GET /api/auditLogs/stats
// @access  Public
exports.getAuditLogStats = async (req, res) => {
    try {
        const stats = await AuditLog.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalLogs = await AuditLog.countDocuments();

        const formattedStats = {
            total: totalLogs,
            login: 0,
            logout: 0,
            application_created: 0,
            application_updated: 0,
            application_approved: 0,
            application_rejected: 0,
            project_created: 0,
            project_updated: 0,
            project_deleted: 0,
            user_created: 0,
            user_updated: 0,
            user_deleted: 0,
            user_verified: 0
        };

        stats.forEach(stat => {
            const key = stat._id.toLowerCase();
            if (formattedStats.hasOwnProperty(key)) {
                formattedStats[key] = stat.count;
            }
        });

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Error in getAuditLogStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit log statistics',
            error: error.message
        });
    }
};

// @desc    Get recent audit logs
// @route   GET /api/auditLogs/recent
// @access  Public
exports.getRecentAuditLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const auditLogs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            count: auditLogs.length,
            data: auditLogs
        });
    } catch (error) {
        console.error('Error in getRecentAuditLogs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent audit logs',
            error: error.message
        });
    }
};
