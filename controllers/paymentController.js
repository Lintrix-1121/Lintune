const {
    chargeSubscription,
    verifyPayment
} = require('../utils/dgateway');

class PaymentsController {
    constructor(
        Payments,
        Subscription,
        SubscriptionPlan
    ) {
        this.Payments = Payments;
        this.Subscription = Subscription;
        this.SubscriptionPlan =
            SubscriptionPlan;
    }
    
    // POST /payments/subscribe
    // Initiate payment for trial expiry, renewal
     
    initiateSubscriptionPayment =
        async (req, res) => {
            try {
                const userId =
                    req.user.userId;
                const {
                    subscriptionId,
                    provider
                } = req.body;

                const subscription =
                    await this.Subscription.findOne({
                        where: {
                            id: subscriptionId,
                            userId
                        },
                        include: [
                            {
                                model:
                                    this.SubscriptionPlan,
                                as: 'plan'
                            }
                        ]
                    });
                if (!subscription) {
                    return res.status(404).json({
                        success: false,
                        message:
                            'Subscription not found'
                    });
                }
                if (
                    ![
                        'trialing',
                        'past_due',
                        'active'
                    ].includes(
                        subscription.status
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Subscription cannot be charged'
                    });
                }

                const charge =
                    await chargeSubscription({
                        subscriptionId:
                            subscription
                                .providerSubscriptionId,
                        phoneNumber:
                            subscription
                                .customerPhone,
                        provider:
                            provider ||
                            process.env
                                .DGATEWAY_DEFAULT_PROVIDER ||
                            'iotec'
                    });

                const data =
                    charge?.data || {};
                if (!data.reference) {
                    return res.status(502).json({
                        success: false,
                        message:
                            'DGateway did not return a payment reference',
                        data: charge
                    });
                }
                const payment =
                    await this.Payments.create({
                        userId,
                        subscriptionId:
                            subscription.id,
                        provider:
                            'dgateway',
                        providerTransactionId:
                            data.id
                                ? String(data.id)
                                : null,
                        reference:
                            data.reference,
                        amount:
                            data.amount ||
                            subscription.plan.price,
                        currency:
                            data.currency ||
                            subscription.plan.currency,
                        paymentMethod:
                            provider === 'airtel'
                                ? 'airtel'
                                : provider === 'mtn'
                                    ? 'mtn'
                                    : 'mobile_money',
                        status:
                            'pending'
                    });
                return res.status(201).json({
                    success: true,
                    message:
                        'Payment initiated. Please approve the Mobile Money prompt.',
                    data: {
                        payment,
                        reference:
                            data.reference,
                        gateway:
                            data
                    }
                });
            } catch (error) {
                console.error(
                    'Initiate payment error:',
                    error
                );
                return res.status(
                    error.status || 500
                ).json({
                    success: false,
                    message:
                        error.message ||
                        'Unable to initiate payment'
                });
            }
        };

    // GET /payments/:reference
    getPaymentStatus =
        async (req, res) => {
            try {
                const payment =
                    await this.Payments.findOne({
                        where: {
                            reference:
                                req.params.reference,
                            userId:
                                req.user.userId
                        }
                    });
                if (!payment) {
                    return res.status(404).json({
                        success: false,
                        message:
                            'Payment not found'
                    });
                }

                const gatewayStatus =
                    await verifyPayment(
                        payment.reference
                    );
                const data =
                    gatewayStatus?.data ||
                    {};
                let localStatus =
                    payment.status;
                if (
                    data.status === 'completed' ||
                    data.status === 'successful'
                ) {
                    localStatus =
                        'completed';
                } else if (
                    data.status === 'failed'
                ) {
                    localStatus =
                        'failed';
                } else if (
                    data.status === 'expired'
                ) {
                    localStatus =
                        'expired';
                }
                if (
                    localStatus !==
                    payment.status
                ) {
                    await payment.update({
                        status:
                            localStatus,
                        paidAt:
                            localStatus ===
                            'completed'
                                ? new Date()
                                : null
                    });
                }
                return res.json({
                    success: true,
                    data: {
                        payment,
                        gateway:
                            gatewayStatus
                    }
                });
            } catch (error) {
                console.error(
                    'Payment status error:',
                    error
                );
                return res.status(500).json({
                    success: false,
                    message:
                        'Unable to verify payment'
                });
            }
        };
 
    // DGateway webhook, the exact webhook payload/signature shown in your DGateway dashboard before
    // enabling production signature enforcement.
    webhook =
        async (req, res) => {
            try {
                console.log(
                    'DGateway webhook:',
                    JSON.stringify(
                        req.body,
                        null,
                        2
                    )
                );
                const event =
                    req.body.event;
                const data =
                    req.body.data || {};
                const reference =
                    data.reference ||
                    data.id;
                if (!reference) {
                    return res.status(200).json({
                        received: true
                    });
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
                    return res.status(200).json({
                        received: true
                    });
                }
                let status =
                    payment.status;
                if (
                    event ===
                    'collection.completed' ||
                    event ===
                    'subscription.payment_completed' ||
                    event ===
                    'subscription.renewed' ||
                    data.status === 'completed' ||
                    data.status === 'successful'
                ) {
                    status =
                        'completed';
                } else if (
                    event ===
                    'collection.failed' ||
                    data.status === 'failed'
                ) {
                    status =
                        'failed';
                } else if (
                    event ===
                    'collection.expired' ||
                    data.status === 'expired'
                ) {
                    status =
                        'expired';
                }
                await payment.update({
                    status,
                    providerTransactionId:
                        data.id
                            ? String(data.id)
                            : payment
                                .providerTransactionId,
                    paidAt:
                        status === 'completed'
                            ? new Date()
                            : payment.paidAt
                });

                // Successful payment gives the subscription access.
                if (
                    status === 'completed'
                ) {
                    const subscription =
                        await this.Subscription.findByPk(
                            payment.subscriptionId
                        );
                    if (subscription) {
                        const now =
                            new Date();
                        const plan =
                            await this
                                .SubscriptionPlan
                                .findByPk(
                                    subscription.planId
                                );
                        const periodEnd =
                            new Date(now);
                        if (
                            plan.interval ===
                            'monthly'
                        ) {
                            periodEnd.setMonth(
                                periodEnd.getMonth() +
                                1
                            );
                        } else if (
                            plan.interval ===
                            'yearly'
                        ) {
                            periodEnd.setFullYear(
                                periodEnd.getFullYear() +
                                1
                            );
                        } else if (
                            plan.interval ===
                            'weekly'
                        ) {
                            periodEnd.setDate(
                                periodEnd.getDate() +
                                7
                            );
                        } else {
                            periodEnd.setDate(
                                periodEnd.getDate() +
                                1
                            );
                        }
                        await subscription.update({
                            status:
                                'active',
                            currentPeriodStart:
                                now,
                            currentPeriodEnd:
                                periodEnd
                        });
                    }
                }
                return res.status(200).json({
                    received: true
                });
            } catch (error) {
                console.error(
                    'DGateway webhook error:',
                    error
                );

                /*
                  Return 200 only if you intentionally want to acknowledge the webhook.
                  For production, shld be based on DGateway's retry behavior.
                 */
                return res.status(200).json({
                    received: true
                });
            }
        };
}

module.exports = PaymentsController;