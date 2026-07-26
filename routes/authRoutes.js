const express = require('express');
const authenticate = require('../middleware/jwtAuth');
const router = express.Router();

module.exports = (authController) => {

  console.log({
    authenticate: typeof authenticate,
    googleAuth: typeof authController.googleAuth,
    googleCallback: typeof authController.googleCallback,
    authFailure: typeof authController.authFailure,
    logout: typeof authController.logout,
    getAuthStatus: typeof authController.getAuthStatus,
  });
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



