const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SubscriptionPlan = sequelize.define(
        'SubscriptionPlan',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false
            },

            name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },

            currency: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: 'UGX'
            },

            interval: {
                type: DataTypes.ENUM(
                    'daily',
                    'weekly',
                    'monthly',
                    'yearly'
                ),
                allowNull: false,
                defaultValue: 'monthly'
            },

            trialDays: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 14
            },

            graceDays: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 3
            },

            dgatewayPlanId: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            },

            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        },
        {
            tableName: 'subscription_plans',
            timestamps: true
        }
    );

    return SubscriptionPlan;
};

