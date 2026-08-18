const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payments = sequelize.define(
        'Payments',
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

            subscriptionId: {
                type: DataTypes.UUID,
                allowNull: true
            },

            provider: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: 'dgateway'
            },

            providerTransactionId: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            reference: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true
            },

            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },

            currency: {
                type: DataTypes.STRING(10),
                allowNull: false,
                defaultValue: 'UGX'
            },

            provider: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: 'dgateway'
            },

            paymentMethod: {
                type: DataTypes.ENUM(
                    'mtn',
                    'airtel',
                    'mobile_money',
                    'card'
                ),
                allowNull: false,
                defaultValue: 'mobile_money'
            },

            status: {
                type: DataTypes.ENUM(
                    'pending',
                    'completed',
                    'failed',
                    'expired'
                ),
                allowNull: false,
                defaultValue: 'pending'
            },

            paidAt: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: 'payments',
            timestamps: true
        }
    );

    return Payments;
};

