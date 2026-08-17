const axios = require('axios');
const crypto = require('crypto');

class PaymentsController {
    constructor(
        Payments,
        Subscription,
        SubscriptionPlan
    ) {
        this.Payments = Payments;
        this.Subscription = Subscription;
        this.SubscriptionPlan = SubscriptionPlan;
    }

    // VERIFY PAYMENT
    // GET /payments/verify/:transactionId
    verifyPayment = async (req, res) => {
        try {
            const {
                transactionId
            } = req.params;

            const response =
                await axios.get(

                    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${process.env.FLW_SECRET_KEY}`
                        }
                    }
                );

            const data =
                response.data.data;
            if (!data) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Transaction verification failed'
                });
            }
            // Flutterwave verification succeeded
            if (
                data.status === 'successful'
            ) {
                const reference =
                    data.tx_ref;
                const payment =
                    await this.Payments.findOne({
                        where: {
                            reference
                        }
                    });
                if (!payment) {
                    return res.status(404).json({
                        success: false,
                        message:
                            'Local payment record not found'
                    });
                }
                // Verify amount and currency
                if (
                    Number(data.amount) !==
                    Number(payment.amount)
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Payment amount mismatch'
                    });
                }
                if (
                    data.currency !==
                    payment.currency
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Payment currency mismatch'
                    });
                }
                await payment.update({
                    providerTransactionId:
                        String(data.id),
                    status:
                        'successful',
                    paidAt:
                        new Date()
                });
                const subscription =
                    await this.Subscription.findByPk(
                        payment.subscriptionId
                    );
                if (subscription) {
                    await subscription.update({
                        status: 'active',
                        // providerTransactionId:
                        //     undefined
                    });
                }
            }
            return res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error(
                'Payment verification error:',
                error.response?.data ||
                error.message
            );
            return res.status(500).json({
                success: false,
                message:
                    'Payment verification failed'
            });
        }
    };

    // FLUTTERWAVE WEBHOOK
    // POST /payments/webhook
    webhook = async (req, res) => {
        try {
            const signature =
                req.headers['flutterwave-signature'];
            const secretHash =
                process.env.FLW_SECRET_HASH;
            // New Flutterwave webhook signature
            if (signature) {
                const rawBody =
                    req.rawBody;
                if (!rawBody) {
                    return res.status(400).send(
                        'Missing raw body'
                    );
                }
                const expected =
                    crypto
                        .createHmac(
                            'sha256',
                            secretHash
                        )
                        .update(rawBody)
                        .digest('base64');
                if (
                    signature !== expected
                ) {
                    return res.status(401).send(
                        'Invalid signature'
                    );
                }
            } else {

                // Flutterwave webhook configuration 4 Compatibility with older
                  const oldSignature =
                    req.headers['verif-hash'];
                if (
                    !oldSignature ||
                    oldSignature !== secretHash
                ) {
                    return res.status(401).send(
                        'Invalid webhook signature'
                    );
                }
            }
            const payload =
                req.body;
            console.log(
                'Flutterwave webhook:',
                JSON.stringify(payload)
            );

            // Acknowledge Flutterwave quickly
            res.sendStatus(200);
            // Process payment
            const data =
                payload.data;
            if (!data) {
                return;
            }
            const reference =
                data.reference ||
                data.tx_ref;
            if (!reference) {
                return;
            }
            const payment =
                await this.Payments.findOne({
                    where: {
                        reference
                    }
                });
            if (!payment) {
                console.warn(
                    'Payment not found:',
                    reference
                );
                return;
            }
            // Prevent duplicate processing
            if (
                payment.status ===
                'successful'
            ) {
                return;
            }
            // Successful payment
            if (
                data.status ===
                'succeeded' ||
                data.status ===
                'successful'
            ) {
                // Verify the transaction with Flutterwave before granting access.
                const verification =
                    await axios.get(
                        `https://api.flutterwave.com/v3/transactions/${data.id}/verify`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${process.env.FLW_SECRET_KEY}`
                            }
                        }
                    );
                const verified =
                    verification.data.data;
                if (
                    verified.status !==
                    'successful'
                ) {
                    return;
                }
                if (
                    Number(verified.amount) !==
                    Number(payment.amount)
                ) {
                    console.error(
                        'Amount mismatch for:',
                        reference
                    );
                    return;
                }
                if (
                    verified.currency !==
                    payment.currency
                ) {
                    console.error(
                        'Currency mismatch for:',
                        reference
                    );
                    return;
                }
                await payment.update({
                    providerTransactionId:
                        String(verified.id),
                    status:
                        'successful',
                    paidAt:
                        new Date()
                });
                const subscription =
                    await this.Subscription.findByPk(
                        payment.subscriptionId
                    );
                if (!subscription) {
                    return;
                }
                const plan =
                    await this.SubscriptionPlan.findByPk(
                        subscription.planId
                    );
                if (!plan) {
                    return;
                }
                const start =
                    new Date();
                const end =
                    new Date(start);
                if (
                    plan.interval ===
                    'yearly'
                ) {
                    end.setFullYear(
                        end.getFullYear() + 1
                    );
                } else {
                    end.setMonth(
                        end.getMonth() + 1
                    );
                }
                await subscription.update({
                    status: 'active',
                    currentPeriodStart:
                        start,
                    currentPeriodEnd:
                        end
                });
                console.log(
                    `Subscription ${subscription.id} activated`
                );
            } else if (
                data.status ===
                'failed'
            ) {
                await payment.update({
                    status: 'failed'
                });
                await this.Subscription.update(
                    {
                        status: 'past_due'
                    },
                    {
                        where: {
                            id:
                                payment.subscriptionId
                        }
                    }
                );
            }
        } catch (error) {
            console.error(
                'Webhook processing error:',
                error.response?.data ||
                error.message
            );
            // Log error for investigation.
        }
    };
}

module.exports = PaymentsController;


