const express = require('express');
const authenticate = require('../middleware/jwtAuth');

module.exports = (downloadController) => {
  const router = express.Router();
  
  const authWithQuery = (req, res, next) => {
    // If token is in query, set it as Authorization header for the existing middleware
    if (req.query.token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    authenticate(req, res, next);
  };

  // GET /tune/download/1
  router.get('/download/:id', authWithQuery, (req, res) => {
    console.log('Download route hit');
    downloadController.downloadFile(req, res);
  });
  
  // GET /tune/stream/1
  router.get('/stream/:id', authWithQuery, (req, res) => {
    downloadController.streamFile(req, res);
  });
  
  // GET /tune/info/1
  router.get('/info/:id', authWithQuery, (req, res) => {
    downloadController.getFileInfo(req, res);
  });

  return router;
};


