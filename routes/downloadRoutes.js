const express = require('express');

module.exports = (downloadController) => {
  const router = express.Router();
  
  // GET /tune/download/1
  router.get('/download/:id', (req, res) => {
    console.log('Download route hit');
    downloadController.downloadFile(req, res);
  });
  
  // GET /tune/stream/1
  router.get('/stream/:id', (req, res) => {
    downloadController.streamFile(req, res);
  });
  
  // GET /tune/info/1
  router.get('/info/:id', (req, res) => {
    downloadController.getFileInfo(req, res);
  });

  return router;
};