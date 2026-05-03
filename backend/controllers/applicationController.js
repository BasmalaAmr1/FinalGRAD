const Application = require('../models/Application');
const { validationResult } = require('express-validator');

// @desc    Get all applications
// @route   GET /api/applications
// @access  Public
exports.getAllApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;

        // Build query
        let query = {};
        
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { nationalId: { $regex: search, $options: 'i' } }
            ];
        }

        const applications = await Application.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Application.countDocuments(query);

        res.status(200).json({
            success: true,
            count: applications.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: applications
        });
    } catch (error) {
        console.error('Error in getAllApplications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching applications',
            error: error.message
        });
    }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
// @access  Public
exports.getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Error in getApplicationById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching application',
            error: error.message
        });
    }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Public
exports.createApplication = async (req, res) => {
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

        // Check if application with same national ID or email already exists
        const existingApplication = await Application.findOne({
            $or: [
                { nationalId: req.body.nationalId },
                { email: req.body.email }
            ]
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'An application with this National ID or email already exists'
            });
        }

        // Create application
        const application = await Application.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });
    } catch (error) {
        console.error('Error in createApplication:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `An application with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating application',
            error: error.message
        });
    }
};

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Public
exports.updateApplication = async (req, res) => {
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

        let application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update application
        application = await Application.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Application updated successfully',
            data: application
        });
    } catch (error) {
        console.error('Error in updateApplication:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `An application with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating application',
            error: error.message
        });
    }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Public
exports.deleteApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        await application.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Application deleted successfully',
            data: application
        });
    } catch (error) {
        console.error('Error in deleteApplication:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting application',
            error: error.message
        });
    }
};

// @desc    Update application status (approve/reject)
// @route   PATCH /api/applications/:id/status
// @access  Public
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, rejectionReason, reviewedBy } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be pending, approved, or rejected'
            });
        }

        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required when rejecting an application'
            });
        }

        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const previousStatus = application.status;

        // Update application status
        application.status = status;
        application.reviewedBy = reviewedBy;
        application.reviewedAt = new Date();
        
        if (status === 'rejected') {
            application.rejectionReason = rejectionReason;
        } else {
            application.rejectionReason = undefined;
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: `Application ${status} successfully`,
            data: application
        });
    } catch (error) {
        console.error('Error in updateApplicationStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application status',
            error: error.message
        });
    }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Public
exports.getApplicationStats = async (req, res) => {
    try {
        const stats = await Application.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalApplications = await Application.countDocuments();

        const formattedStats = {
            total: totalApplications,
            pending: 0,
            approved: 0,
            rejected: 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
        });

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Error in getApplicationStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching application statistics',
            error: error.message
        });
    }
};
