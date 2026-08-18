module.exports = (Subscription) => {
    return async (req, res, next) => {
        try {
            const userId =
                req.user.userId;

                const subscription =
                await Subscription.findOne({
                    where: {
                        userId,
                        status: [
                            'trialing',
                            'active'
                        ]
                    }
                });

            if (!subscription) {
                return res.status(403).json({
                    success: false,
                    code:
                        'SUBSCRIPTION_REQUIRED',
                    message:
                        'An active subscription is required'
                });
            }

            if (
                subscription.status ===
                'trialing' &&
                subscription.trialEnd &&
                new Date(
                    subscription.trialEnd
                ) <= new Date()
            ) {
                await subscription.update({
                    status:
                        'past_due'
                });
                return res.status(403).json({
                    success: false,
                    code:
                        'SUBSCRIPTION_EXPIRED',
                    message:
                        'Your free trial has expired'
                });
            }
            next();
        } catch (error) {
            console.error(
                'Subscription middleware:',
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    'Unable to verify subscription'
            });
        }
    };
};

