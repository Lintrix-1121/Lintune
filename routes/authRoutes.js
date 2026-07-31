const express = require('express');
const authenticate = require('../middleware/jwtAuth');


module.exports = (authController) => {
  const router = express.Router();
  // Google OAuth routes
  router.get('/google', authController.googleAuth);
  router.get('/google/callback', authController.googleCallback);
  
  // Success and failure routes
  // router.get('/success', authController.authSuccess);
  router.get('/failure', authController.authFailure);
  
  //Other auth routes
  router.post('/logout', authController.logout);
  router.get('/status', authenticate, authController.getAuthStatus);

  return router;
};



