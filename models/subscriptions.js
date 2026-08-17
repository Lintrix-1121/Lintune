module.exports = (sequelize, Sequelize) => {
    const Subscription = sequelize.define('subscriptions', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },

        planId: {
            type: Sequelize.UUID,
            allowNull: false
        },

        status: {
            type: Sequelize.ENUM(
                'trialing',
                'pending',
                'active',
                'past_due',
                'cancelled',
                'expired'
            ),
            allowNull: false,
            defaultValue: 'trialing'
        },

        trialStart: {
            type: Sequelize.DATE,
            allowNull: true
        },

        trialEnd: {
            type: Sequelize.DATE,
            allowNull: true
        },

        currentPeriodStart: {
            type: Sequelize.DATE,
            allowNull: false
        },

        currentPeriodEnd: {
            type: Sequelize.DATE,
            allowNull: false
        },

        provider: {
            type: Sequelize.STRING,
            allowNull: true
        },

        providerCustomerId: {
            type: Sequelize.STRING,
            allowNull: true
        },

        providerSubscriptionId: {
            type: Sequelize.STRING,
            allowNull: true
        },

        cancelAtPeriodEnd: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

        cancelledAt: {
            type: Sequelize.DATE,
            allowNull: true
        }

    });

    return Subscription;
};