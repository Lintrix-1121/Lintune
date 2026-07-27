module.exports = (sequelize, Sequelize) => {
  const TuneEvent = sequelize.define('tune_event', {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    tune_id: {
      type: Sequelize.BIGINT,
      allowNull: false
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: true  // null if unauthenticated
    },
    event_type: {
      type: Sequelize.ENUM('stream', 'download', 'playlist_add'),
      allowNull: false
    },
    duration_played: {
      type: Sequelize.FLOAT,   //seconds for completion rate
      allowNull: true
    },
    timestamp: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false
    }
  }, {
    tableName: 'tune_events',
    timestamps: false,   //manage timestamp manually
    indexes: [
      { fields: ['tune_id'] },
      { fields: ['timestamp'] },
      { fields: ['user_id', 'tune_id', 'timestamp'] }  //for repeat detection
    ]
  });

  return TuneEvent;
};

