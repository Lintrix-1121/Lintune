module.exports = (sequelize, Sequelize) => {
    const Payments = sequelize.define('payments', {
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

        subscriptionId: {
            type: Sequelize.UUID,
            allowNull: false
        },

        provider: {
            type: Sequelize.STRING,
            allowNull: false
        },

        providerTransactionId: {
            type: Sequelize.STRING,
            allowNull: true
        },

        reference: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },

        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },

        currency: {
            type: Sequelize.STRING(3),
            allowNull: false
        },

        status: {
            type: Sequelize.ENUM(
                'pending',
                'successful',
                'failed',
                'cancelled'
            ),
            allowNull: false,
            defaultValue: 'pending'
        },

        paidAt: {
            type: Sequelize.DATE,
            allowNull: true
        }

    });

    return Payments;
};