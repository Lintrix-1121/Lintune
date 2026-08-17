const axios = require('axios');
const crypto = require('crypto');

class SubscriptionController {
    constructor(
        Subscription,
        SubscriptionPlan,
        Payments,
        User
    ) {
        this.Subscription = Subscription;
        this.SubscriptionPlan = SubscriptionPlan;
        this.Payments = Payments;
        this.User = User;
    }

    // GET CURRENT SUBSCRIPTION
    getCurrentSubscription = async (req, res) => {

        try {
            const userId = req.user.userId;
            const subscription =
                await this.Subscription.findOne({
                    where: {
                        userId
                    },
                    include: [
                        {
                            model: this.SubscriptionPlan,
                            as: 'plan'
                        }
                    ],
                    order: [
                        ['createdAt', 'DESC']
                    ]
                });
            if (!subscription) {
                return res.json({
                    success: true,
                    data: null
                });
            }
            return res.json({
                success: true,
                data: subscription
            });
        } catch (error) {
            console.error(
                'Get subscription error:',
                error
            );
            return res.status(500).json({
                success: false,
                message: 'Unable to retrieve subscription'
            });
        }
    };
  
    // START 14 DAY TRIAL
    startTrial = async (req, res) => {
        try {
            const userId = req.user.userId;
            const {
                planId
            } = req.body;
            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'planId is required'
                });
            }
            // Find plan
            const plan =
                await this.SubscriptionPlan.findOne({
                    where: {
                        id: planId,
                        isActive: true
                    }
                });
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription plan not found'
                });
            }

            // Check existing subscription
            const existing =
                await this.Subscription.findOne({
                    where: {
                        userId
                    },
                    order: [
                        ['createdAt', 'DESC']
                    ]
                });
            if (existing) {
                const activeStatuses = [
                    'trialing',
                    'active',
                    'past_due'
                ];
                if (
                    activeStatuses.includes(
                        existing.status
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'You already have an active subscription'
                    });
                }
            }

            const now = new Date();
            const trialEnd = new Date(now);
            trialEnd.setDate(
                trialEnd.getDate() +
                Number(plan.trialDays || 14)
            );

            // Create subscription
            const subscription =
                await this.Subscription.create({
                    userId,
                    planId,
                    status: 'trialing',
                    trialStart: now,
                    trialEnd,
                    currentPeriodStart: now,
                    currentPeriodEnd: trialEnd,
                    provider: null,
                    providerCustomerId: null,
                    providerSubscriptionId: null,
                    cancelAtPeriodEnd: false,
                    cancelledAt: null
                });
            return res.status(201).json({
                success: true,
                message:
                    `${plan.trialDays || 14}-day trial started`,
                data: subscription
            });
        } catch (error) {
            console.error(
                'Start trial error:',
                error
            );
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    // CREATE FLUTTERWAVE PAYMENT
    createPayment = async (req, res) => {
        try {
            const userId = req.user.userId;
            const {
                planId,
                phoneNumber,
                network
            } = req.body;
            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'planId is required'
                });
            }
            const plan =
                await this.SubscriptionPlan.findOne({
                    where: {
                        id: planId,
                        isActive: true
                    }
                });
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription plan not found'
                });
            }
            if (Number(plan.price) <= 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        'This plan does not require payment'
                });
            }
            const user =
                await this.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            const reference =
                `SUB-${userId}-${Date.now()}-${crypto
                    .randomBytes(5)
                    .toString('hex')}`;


            // Create pending subscription
            const now = new Date();
            const periodEnd =
                new Date(now);
            if (plan.interval === 'yearly') {
                periodEnd.setFullYear(
                    periodEnd.getFullYear() + 1
                );
            } else {
                periodEnd.setMonth(
                    periodEnd.getMonth() + 1
                );
            }
            const subscription =
                await this.Subscription.create({
                    userId,
                    planId,
                    status: 'past_due',
                    trialStart: null,
                    trialEnd: null,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    provider: 'flutterwave',
                    providerCustomerId: null,
                    providerSubscriptionId: null,
                    cancelAtPeriodEnd: false
                });

            // Record pending payment
            await this.Payments.create({
                userId,
                subscriptionId:
                    subscription.id,
                provider: 'flutterwave',
                providerTransactionId: null,
                reference,
                amount: plan.price,
                currency: plan.currency,
                status: 'pending',
                paidAt: null
            });

            // Flutterwave Uganda Mobile Money
            if (
                phoneNumber &&
                network
            ) {
                const response =
                    await axios.post(
                        'https://api.flutterwave.com/v3/charges?type=mobile_money_uganda',
                        {
                            amount: Number(plan.price),
                            currency: plan.currency,
                            email: user.email,
                            phone_number: phoneNumber,
                            network: network,
                            tx_ref: reference,
                            fullname:
                                user.name ||
                                user.username ||
                                user.email,
                            meta: {
                                userId,
                                subscriptionId:
                                    subscription.id,
                                planId
                            }
                        },
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${process.env.FLW_SECRET_KEY}`,
                                'Content-Type':
                                    'application/json'
                            }
                        }
                    );
                return res.status(200).json({
                    success: true,
                    message:
                        'Payment initiated',
                    data: response.data
                });
            }
            // No mobile money details, implement Flutterwave
            //  hosted checkout here.
            return res.status(400).json({
                success: false,
                message:
                    'phoneNumber and network are required for Uganda Mobile Money'
            });
        } catch (error) {
            console.error(
                'Flutterwave payment error:',
                error.response?.data ||
                error.message
            );
            return res.status(500).json({
                success: false,
                message:
                    'Unable to initiate payment',
                error:
                    error.response?.data ||
                    error.message
            });
        }
    };

    // CANCEL SUBSCRIPTION, /subscriptions/cancel
    cancelSubscription = async (req, res) => {
        try {
            const userId =
                req.user.userId;
            const subscription =
                await this.Subscription.findOne({
                    where: {
                        userId
                    },
                    order: [
                        ['createdAt', 'DESC']
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
                    'active'
                ].includes(subscription.status)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Subscription is not active'
                });
            }
            await subscription.update({
                cancelAtPeriodEnd: true,
                cancelledAt: new Date()
            });
            return res.json({
                success: true,
                message:
                    'Subscription will be cancelled at the end of the current period',
                data: subscription
            });
        } catch (error) {
            console.error(
                'Cancel subscription error:',
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    'Unable to cancel subscription'
            });
        }
    };
}

module.exports = SubscriptionController;

