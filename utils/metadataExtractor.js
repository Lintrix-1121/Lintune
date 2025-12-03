// utils/metadataExtractor.js
const mm = require('music-metadata');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

class MetadataExtractor {
  static async extractAudioMetadata(filePath) {
    try {
      const metadata = await mm.parseFile(filePath);
      const stats = fs.statSync(filePath);

      return {
        file_size: stats.size,
        file_format: path.extname(filePath).toLowerCase().replace('.', ''),
        duration: Math.round(metadata.format.duration),
        bitrate: metadata.format.bitrate,
        sample_rate: metadata.format.sampleRate,
        channels: metadata.format.numberOfChannels,
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        album_artist: metadata.common.albumartist,
        genre: metadata.common.genre ? metadata.common.genre.join(', ') : null,
        year: metadata.common.year,
        track_number: metadata.common.track ? metadata.common.track.no : null,
        disk_number: metadata.common.disk ? metadata.common.disk.no : null,
        composer: metadata.common.composer ? metadata.common.composer.join(', ') : null,
        lyricist: metadata.common.lyricist ? metadata.common.lyricist.join(', ') : null
      };
    } catch (error) {
      console.error('Error extracting audio metadata:', error);
      return null;
    }
  }

  static async extractVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        const stats = fs.statSync(filePath);

        resolve({
          file_size: stats.size,
          file_format: path.extname(filePath).toLowerCase().replace('.', ''),
          duration: Math.round(metadata.format.duration),
          bitrate: parseInt(metadata.format.bit_rate) / 1000,
          sample_rate: audioStream ? audioStream.sample_rate : null,
          channels: audioStream ? audioStream.channels : null,
          video_codec: videoStream ? videoStream.codec_name : null,
          audio_codec: audioStream ? audioStream.codec_name : null,
          width: videoStream ? videoStream.width : null,
          height: videoStream ? videoStream.height : null,
          frame_rate: videoStream ? eval(videoStream.r_frame_rate) : null
        });
      });
    });
  }

  static generateChecksum(filePath) {
    // Simple checksum implementation - you might want to use crypto for better checksum
    const stats = fs.statSync(filePath);
    return `${stats.size}-${stats.mtimeMs}`;
  }
}

module.exports = MetadataExtractor;