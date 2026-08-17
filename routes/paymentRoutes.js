module.exports = (
    paymentsController,
    authenticate
) => {
    const express = require('express');
    const router = express.Router();

    //Flutterwave webhook authentication
    router.post(
        '/webhook',
        paymentsController.webhook
    );

    // Manual transaction verification
    router.get(
        '/verify/:transactionId',
        authenticate,
        paymentsController.verifyPayment
    );

    return router;
};