const express = require('express');

module.exports = (subscriptionController, authenticate) => {
    const router = express.Router();

        router.get(
        '/me', authenticate, subscriptionController.getMySubscription
    );

    router.post(
        '/', authenticate, subscriptionController.createSubscription
    );

    router.post(
        '/:id/cancel', authenticate, subscriptionController.cancel
    );


    router.post(
        '/:id/pause', authenticate, subscriptionController.pause
    );

    router.post(
        '/:id/resume', authenticate, subscriptionController.resume
    );

    return router;
};