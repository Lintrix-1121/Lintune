const cron = require('node-cron');
const { chargeSubscription } = require('../utils/dgateway');

function startSubscriptionJob({
    Subscription,
    SubscriptionPlan,
    Payments
}) {

    // Run every hour.
    cron.schedule(
        '0 * * * *',
        async () => {
            console.log(
                'Running subscription billing job...'
            );
            try {
                const now =
                    new Date();

                // Find trials that have expired.
                const expiredTrials =
                    await Subscription.findAll({
                        where: {
                            status:
                                'trialing',
                            trialEnd: {
                                [require('sequelize')
                                    .Op.lte]: now
                            }
                        },
                        include: [
                            {
                                model:
                                    SubscriptionPlan,
                                as: 'plan'
                            }
                        ]
                    });
                for (
                    const subscription
                    of expiredTrials
                ) {
                    try {
                        console.log(
                            `Trial expired: ${subscription.id}`
                        );

                        // Initiate first payment without granting another trial.
                        const charge =
                            await chargeSubscription({
                                subscriptionId:
                                    subscription
                                        .providerSubscriptionId,
                                phoneNumber:
                                    subscription
                                        .customerPhone,
                                provider:
                                    process.env
                                        .DGATEWAY_DEFAULT_PROVIDER ||
                                    'iotec'
                            });
                        const data =
                            charge?.data || {};
                        if (
                            !data.reference
                        ) {
                            console.error(
                                'No payment reference returned:',
                                charge
                            );
                            continue;
                        }

                        await Payments.findOrCreate({
                            where: {
                                reference:
                                    data.reference
                            },
                            defaults: {
                                userId:
                                    subscription.userId,
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
                                    'mobile_money',
                                status:
                                    'pending'
                            }
                        });
                        await subscription.update({
                            status:
                                'past_due'
                        });
                        console.log(
                            `Payment initiated for ${subscription.id}`
                        );
                    } catch (error) {
                        console.error(
                            `Failed to charge ${subscription.id}:`,
                            error.message
                        );
                    }
                }
            } catch (error) {
                console.error(
                    'Subscription job error:',
                    error
                );
            }
        }
    );

    console.log(
        'Subscription billing job started'
    );
}


module.exports = startSubscriptionJob;