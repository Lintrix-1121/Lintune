module.exports = (sequelize, Sequelize) => {
    const SubscriptionPlan = sequelize.define('subscriptionPlans', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        name: {
            type: Sequelize.STRING,
            allowNull: false
        },

        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },

        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },

        currency: {
            type: Sequelize.STRING(3),
            allowNull: false,
            defaultValue: 'UGX'
        },

        interval: {
            type: Sequelize.ENUM('monthly', 'yearly'),
            allowNull: false,
            defaultValue: 'monthly'
        },

        trialDays: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 14
        },

        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    });

    return SubscriptionPlan;
};

