const dbConfig = require('../config/dbConfig');

const Sequelize = require('sequelize');
const sequelize_config = new Sequelize (
    dbConfig.database, dbConfig.username, dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        pool: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle
        }
    }
);


const db = {};
db.Sequelize = Sequelize;
db.sequelize_config = sequelize_config;

db.user = require('./user')(sequelize_config, Sequelize);
db.tune = require('./song')(sequelize_config, Sequelize);
db.tuneEvent = require('./tuneEvent')(sequelize_config, Sequelize);

const User = db.user;
const Tune = db.tune;
const TuneEvent = db.tuneEvent;

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