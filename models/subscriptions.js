const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Subscription = sequelize.define(
        'Subscription',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false
            },

            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            planId: {
                type: DataTypes.UUID,
                allowNull: false
            },

            status: {
                type: DataTypes.ENUM(
                    'trialing',
                    'active',
                    'past_due',
                    'paused',
                    'cancelled',
                    'expired'
                ),
                allowNull: false,
                defaultValue: 'trialing'
            },

            trialStart: {
                type: DataTypes.DATE,
                allowNull: true
            },

            trialEnd: {
                type: DataTypes.DATE,
                allowNull: true
            },

            currentPeriodStart: {
                type: DataTypes.DATE,
                allowNull: true
            },

            currentPeriodEnd: {
                type: DataTypes.DATE,
                allowNull: true
            },

            provider: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: 'dgateway'
            },

            providerCustomerId: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            providerSubscriptionId: {
                type: DataTypes.STRING(255),
                allowNull: true,
                unique: true
            },

            customerPhone: {
                type: DataTypes.STRING(20),
                allowNull: false
            },

            cancelAtPeriodEnd: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            canceledAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: 'subscriptions',
            timestamps: true,
            indexes: [
                {
                    fields: ['userId']
                },
                {
                    fields: ['status']
                },
                {
                    unique: true,
                    fields: ['userId'],
                    name: 'unique_active_user_subscription'
                }
            ]
        }
    );

    return Subscription;
};


