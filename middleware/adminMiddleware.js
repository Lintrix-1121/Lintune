const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Adjust this according to your User model.
        const isAdmin =
            req.user.role === 'admin' ||
            req.user.isAdmin === true;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Administrator access required'
            });
        }

        next();

    } catch (error) {
        console.error('Admin middleware error:', error);

        return res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

module.exports = requireAdmin;

