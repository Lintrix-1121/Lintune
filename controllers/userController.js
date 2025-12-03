class UserController {
  constructor(User) {
    this.User = User;
  }

  // Get current user profile
  getCurrentUser = async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      const user = await this.User.findByPk(req.user.userId, {
        attributes: { exclude: ['providerId'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          userId: user.userId,
          userName: user.userName,
          email: user.email,
          provider: user.provider
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile',
        error: error.message
      });
    }
  };

  // Get user by ID
  getUserById = async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      // Users can only view their own profile
      if (parseInt(id) !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const user = await this.User.findByPk(id, {
        attributes: { exclude: ['providerId'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          userId: user.userId,
          userName: user.userName,
          email: user.email,
          provider: user.provider
        }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  };

  // Update user profile
  updateUser = async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      const { userName } = req.body;
      const userId = req.user.userId;

      const user = await this.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update allowed fields
      if (userName) {
        user.userName = userName;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: {
          userId: user.userId,
          userName: user.userName,
          email: user.email,
          provider: user.provider
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  };

  // Delete user account
  deleteUser = async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      const userId = req.user.userId;
      const user = await this.User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.destroy();

      // Logout after account deletion
      req.logout((err) => {
        if (err) {
          console.error('Logout error after account deletion:', err);
        }
      });

      res.status(200).json({
        success: true,
        message: 'User account deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user account',
        error: error.message
      });
    }
  };
}

module.exports = UserController;

