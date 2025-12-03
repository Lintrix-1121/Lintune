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

const User = db.user;
const Tune = db.tune;

User.hasMany(Tune, {
    forienKey: 'id',
    sourceKey: 'id'
});

Tune.belongaTo(User, {
    foreignKey: 'id',
    targetKey: 'id'
});

module.exports = db;