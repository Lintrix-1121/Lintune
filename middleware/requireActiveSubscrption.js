const requireActiveSubscription = (
    Subscription
) => {

    return async (req, res, next) => {

        try {

            const userId =
                req.user.userId ||
                req.user.id;

            const subscription =
                await Subscription.findOne({

                    where: {
                        userId,
                        status: [
                            'trialing',
                            'active'
                        ]
                    },

                    order: [
                        ['createdAt', 'DESC']
                    ]

                });


            if (!subscription) {

                return res.status(403).json({

                    success: false,

                    message:
                        'An active subscription is required'

                });

            }


            /*
             * Check trial expiry
             */

            if (
                subscription.status ===
                'trialing' &&
                new Date() >
                new Date(subscription.trialEnd)
            ) {

                subscription.status =
                    'expired';

                await subscription.save();

                return res.status(403).json({

                    success: false,

                    message:
                        'Your trial has expired'

                });

            }


            next();

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message:
                    'Unable to verify subscription'

            });
        }

    };
};

module.exports =
    requireActiveSubscription;