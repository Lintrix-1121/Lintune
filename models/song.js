module.exports = (sequelize, Sequelize) => {
  const Tune = sequelize.define('tune', {
    
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },

    // Identification
    isrc: { type: Sequelize.STRING },
    upc: { type: Sequelize.STRING },

    // File Information
    file_name: { type: Sequelize.STRING, allowNull: false },
    file_path: { type: Sequelize.STRING, allowNull: false },
    file_size: { type: Sequelize.BIGINT },
    file_format: { type: Sequelize.STRING },
    bitrate: { type: Sequelize.INTEGER },
    sample_rate: { type: Sequelize.INTEGER },
    channels: { type: Sequelize.INTEGER },
    duration: { type: Sequelize.INTEGER },

    // Basic Metadata
    title: { type: Sequelize.STRING, allowNull: false },
    artist: { type: Sequelize.STRING, allowNull: false },
    album: { type: Sequelize.STRING },
    album_artist: { type: Sequelize.STRING },
    track_number: { type: Sequelize.INTEGER },
    disk_number: { type: Sequelize.INTEGER },
    genre: { type: Sequelize.STRING },
    year: { type: Sequelize.INTEGER },
    release_date: { type: Sequelize.DATE },
    composer: { type: Sequelize.STRING },
    lyricist: { type: Sequelize.STRING },
    producer: { type: Sequelize.STRING },

    // Extended Metadata
    bpm: { type: Sequelize.INTEGER },
    key: { type: Sequelize.STRING },
    mood: { type: Sequelize.STRING },
    language: { type: Sequelize.STRING },
    copyright: { type: Sequelize.STRING },
    publisher: { type: Sequelize.STRING },
    label: { type: Sequelize.STRING },

    // Artwork & Media
    cover_art_url: { type: Sequelize.STRING },
    thumbnail_url: { type: Sequelize.STRING },
    lyrics: { type: Sequelize.TEXT },

    // Technical Audio Features
    loudness: { type: Sequelize.FLOAT },
    peak_level: { type: Sequelize.FLOAT },
    fingerprint: { type: Sequelize.STRING(500) },

    // Playback & User Data
    play_count: { type: Sequelize.INTEGER, defaultValue: 0 },
    skip_count: { type: Sequelize.INTEGER, defaultValue: 0 },
    rating: { type: Sequelize.FLOAT },
    last_played: { type: Sequelize.DATE },
    favorite: { type: Sequelize.BOOLEAN, defaultValue: false },

    // Ownership & Licensing
    owner_id: { type: Sequelize.BIGINT },
    uploaded_by: { type: Sequelize.BIGINT },
    license_type: { type: Sequelize.STRING },
    allowed_territories: { type: Sequelize.JSON },
    blocked_territories: { type: Sequelize.JSON },

    // System & Processing
    checksum: { type: Sequelize.STRING },
    transcoded_versions: { type: Sequelize.JSON },
    waveform_preview_url: { type: Sequelize.STRING },
    status: {
      type: Sequelize.ENUM('active', 'processing', 'disabled'),
      defaultValue: 'active'
    }

  }, {
    tableName: 'tunes',
    timestamps: true
  });

  return Tune;
};
