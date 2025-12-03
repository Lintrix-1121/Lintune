const express = require('express');
const router = express.Router();

module.exports = (userController) => {
  router.get('/me', userController.getCurrentUser);
  router.get('/:id', userController.getUserById);
  router.put('/me', userController.updateUser);
  router.delete('/me', userController.deleteUser);

  return router;
};



