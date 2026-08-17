const Sequelize = require('sequelize');
const sequelize = require('../config/dbConfig');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require('./user')(sequelize, Sequelize);
db.tune = require('./song')(sequelize, Sequelize);
db.tuneEvent = require('./tuneEvent')(sequelize, Sequelize);

db.subscriptionPlan = require('./subscriptionPlans')(sequelize, Sequelize);
db.subscription = require('./subscriptions')(sequelize, Sequelize);
db.payment = require('./payments')(sequelize, Sequelize);

const User = db.user;
const Tune = db.tune;
const TuneEvent = db.tuneEvent;

const SubscriptionPlan = db.subscriptionPlan;
const Subscription = db.subscription;
const Payment = db.payment;

User.hasMany(Tune, {
    foreignKey: 'owner_id',
});

Tune.belongsTo(User, {
    foreignKey: 'owner_id'
});

Tune.belongsTo(User, { 
    foreignKey: 'uploaded_by', as: 'uploader' 
});
User.hasMany(Tune, { 
    foreignKey: 'uploaded_by', as: 'uploadedTunes' 
});

Tune.hasMany(TuneEvent, {
    foreignKey: 'tune_id'
});
TuneEvent.belongsTo(Tune, {
    foreignKey: 'tune_id'
});

User.hasMany(TuneEvent, {
    foreignKey: 'userId'
});
TuneEvent.belongsTo(User, {
    foreignKey: 'userId'
});

SubscriptionPlan.hasMany(Subscription, {
    foreignKey: 'planId',
    as: 'subscriptions'
});
Subscription.belongsTo(SubscriptionPlan, {
    foreignKey: 'planId',
    as: 'plan'
});
User.hasMany(Subscription, {
    foreignKey: 'userId',
    as: 'subscriptions'
});
Subscription.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});
Subscription.hasMany(Payment, {
    foreignKey: 'subscriptionId',
    as: 'payments'
});
Payment.belongsTo(Subscription, {
    foreignKey: 'subscriptionId',
    as: 'subscription'
});


module.exports = db;