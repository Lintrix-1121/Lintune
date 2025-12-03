const express = require('express');
const router = express.Router();

module.exports = (authController) => {
  // Google OAuth routes
  router.get('/google', authController.googleAuth);
  router.get('/google/callback', authController.googleCallback);
  
  // Success and failure routes
  router.get('/success', authController.authSuccess);
  router.get('/failure', authController.authFailure);
  
  //Other auth routes
  router.post('/logout', authController.logout);
  router.get('/status', authController.getAuthStatus);

  return router;
};



