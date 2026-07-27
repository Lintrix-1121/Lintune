const Sequelize = require('sequelize');
const sequelize = require('../config/dbConfig');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require('./user')(sequelize, Sequelize);
db.tune = require('./song')(sequelize, Sequelize);
db.tuneEvent = require('./tuneEvent')(sequelize, Sequelize);

const User = db.user;
const Tune = db.tune;
const TuneEvent = db.tuneEvent;

User.hasMany(Tune, {
    foreignKey: 'owner_id',
    sourceKey: 'owner_id'
});

Tune.belongsTo(User, {
    foreignKey: 'owner_id',
    targetKey: 'owner_id'
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
    foreignKey: 'user_id'
});
TuneEvent.belongsTo(User, {
    foreignKey: 'user_id'
})

module.exports = db;