const Sequelize = require('sequelize');
const sequelize = require('../config/dbConfig');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require('./user')(sequelize_config, Sequelize);
db.tune = require('./song')(sequelize_config, Sequelize);
db.tuneEvent = require('./tuneEvent')(sequelize_config, Sequelize);

const User = db.user;
const Tune = db.tune;
const TuneEvent = db.tune_event;

User.hasMany(Tune, {
    forienKey: 'owner_id',
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
    forienKey: 'tune_id'
});

User.hasMany(TuneEvent, {
    forienKey: 'user_id'
});
TuneEvent.belongsTo(User, {
    forienKey: 'user_id'
})

module.exports = db;