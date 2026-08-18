const {
    createSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    chargeSubscription
} = require('../utils/dgateway');

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

    // GET /subscriptions/me
    getMySubscription = async (req, res) => {
        try {
            const userId = req.user.userId;
            const subscription =
                await this.Subscription.findOne({
                    where: {
                        userId
                    },
                    include: [
                        {
                            model:
                                this.SubscriptionPlan,
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
                    subscribed: false,
                    data: null
                });
            }
            // Local trial expiration protection
            if (
                subscription.status === 'trialing' &&
                subscription.trialEnd &&
                new Date(subscription.trialEnd) <= new Date()
            ) {
                await subscription.update({
                    status: 'past_due'
                });
            }
            return res.json({
                success: true,
                subscribed:
                    ['trialing', 'active']
                        .includes(subscription.status),
                data: subscription
            });
        } catch (error) {
            console.error(
                'Get subscription error:',
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    'Unable to retrieve subscription'
            });
        }
    };

    // POST /subscriptions, Starts a 14-day trial.
    createSubscription = async (req, res) => {
        try {
            const userId = req.user.userId;
            const {
                planId,
                phone,
                provider = 'iotec'
            } = req.body;
            if (!planId || !phone) {
                return res.status(400).json({
                    success: false,
                    message:
                        'planId and phone are required'
                });
            }

            // Making sure user doesn't already have
            // an active/trialing subscription
            const existing =
                await this.Subscription.findOne({
                    where: {
                        userId,
                        status: [
                            'trialing',
                            'active',
                            'past_due'
                        ]
                    }
                });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        'You already have a subscription',
                    data: existing
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
                    message:
                        'Subscription plan not found'
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
            const now = new Date();
            const trialEnd =
                new Date(now);
            trialEnd.setDate(
                trialEnd.getDate() +
                Number(plan.trialDays || 14)
            );

            // Create DGateway subscription.
            // start_now=false meaning  don't immediately
            // charge the user.
            const gatewaySubscription =
                await createSubscription({
                    planId:
                        plan.dgatewayPlanId,
                    customerEmail:
                        user.email,
                    customerName:
                        user.name ||
                        user.username ||
                        user.email,
                    customerPhone:
                        phone,
                    provider,
                    startNow: false,
                    metadata: {
                        userId: String(userId),
                        localPlanId:
                            String(plan.id)
                    }
                });
            const gatewayData =
                gatewaySubscription?.data || {};
            const subscription =
                await this.Subscription.create({
                    userId,
                    planId:
                        plan.id,
                    status:
                        'trialing',
                    trialStart:
                        now,
                    trialEnd,
                    currentPeriodStart:
                        now,
                    currentPeriodEnd:
                        trialEnd,
                    provider:
                        'dgateway',
                    providerCustomerId:
                        gatewayData.customer_id
                            ? String(
                                gatewayData.customer_id
                            )
                            : null,
                    providerSubscriptionId:
                        gatewayData.id
                            ? String(gatewayData.id)
                            : null,
                    customerPhone:
                        phone,
                    cancelAtPeriodEnd:
                        false
                });
            return res.status(201).json({
                success: true,
                message:
                    `Subscription started. You have ${plan.trialDays || 14} free days.`,
                data: subscription
            });

        } catch (error) {
            console.error(
                'Create subscription error:',
                error
            );
            return res.status(
                error.status || 500
            ).json({
                success: false,
                message:
                    error.message ||
                    'Unable to create subscription'
            });
        }
    };

    // POST /subscriptions/:id/cancel
    cancel = async (req, res) => {
        try {
            const userId =
                req.user.userId;
            const subscription =
                await this.Subscription.findOne({
                    where: {
                        id: req.params.id,
                        userId
                    }
                });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Subscription not found'
                });
            }
            if (
                subscription.providerSubscriptionId
            ) {
                await cancelSubscription(
                    subscription.providerSubscriptionId
                );
            }
            await subscription.update({
                status:
                    'cancelled',
                cancelAtPeriodEnd:
                    true,
                canceledAt:
                    new Date()
            });
            return res.json({
                success: true,
                message:
                    'Subscription cancelled',
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

    // POST /subscriptions/:id/pause
    pause = async (req, res) => {
        try {
            const subscription =
                await this.Subscription.findOne({
                    where: {
                        id: req.params.id,
                        userId:
                            req.user.userId
                    }
                });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Subscription not found'
                });
            }
            await pauseSubscription(
                subscription.providerSubscriptionId
            );
            await subscription.update({
                status: 'paused'
            });
            return res.json({
                success: true,
                message:
                    'Subscription paused'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message:
                    'Unable to pause subscription'
            });
        }
    };

    // POST /subscriptions/:id/resume
    resume = async (req, res) => {
        try {
            const subscription =
                await this.Subscription.findOne({
                    where: {
                        id: req.params.id,
                        userId:
                            req.user.userId
                    }
                });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Subscription not found'
                });
            }
            await resumeSubscription(
                subscription.providerSubscriptionId
            );
            await subscription.update({
                status: 'active'
            });
            return res.json({
                success: true,
                message:
                    'Subscription resumed'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message:
                    'Unable to resume subscription'
            });
        }
    };
}


module.exports = SubscriptionController;

