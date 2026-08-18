const express = require('express');

module.exports = (paymentsController, authenticate) => {
    const router = express.Router();

    router.post(
        '/subscribe', authenticate, paymentsController.initiateSubscriptionPayment
    );

    router.get(
        '/:reference', authenticate, paymentsController.getPaymentStatus
    );

    // DGateway webhook with no user's JWT/authenticate
    router.post(
        '/webhook/dgateway', paymentsController.webhook
    );

    return router;
};