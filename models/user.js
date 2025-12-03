module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    userId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    provider: {
      type: Sequelize.STRING,
      defaultValue: 'local'
    },
    providerId: {
      type: Sequelize.STRING,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true 
  });

  return User;
};


