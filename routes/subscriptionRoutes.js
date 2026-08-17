module.exports = (
    subscriptionController,
    authenticate
) => {
    const express = require('express');
    const router = express.Router();

    // Get current subscription
    router.get(
        '/current',
        authenticate,
        subscriptionController.getCurrentSubscription
    );

    // Start 14-day trial
    router.post(
        '/trial',
        authenticate,
        subscriptionController.startTrial
    );

    // Start payment
    router.post(
        '/pay',
        authenticate,
        subscriptionController.createPayment
    );

    // Cancel at period end
    router.post(
        '/cancel',
        authenticate,
        subscriptionController.cancelSubscription
    );

    return router;
};