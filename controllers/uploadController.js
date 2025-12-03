const TuneModel = require('../models/song');
const sequelize = require('../config/dbConfig');
const { Sequelize } = require('sequelize');
const Tune = TuneModel(sequelize, Sequelize);


const MetadataExtractor = require('../utils/metadataExtractor');
const { audioDir, videoDir } = require('../config/multerConfig');
const path = require('path');
const fs = require('fs');

class UploadController {
  constructor() {
    //initialize anything
  }

  async uploadMusic(req, res) {  
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = req.file.path;
      const isAudio = req.file.mimetype.startsWith('audio/');
      const isVideo = req.file.mimetype.startsWith('video/');

      // Extract metadata based on file type
      let metadata = {};
      if (isAudio) {
        metadata = await MetadataExtractor.extractAudioMetadata(filePath);
      } else if (isVideo) {
        metadata = await MetadataExtractor.extractVideoMetadata(filePath);
      }

      // Generate checksum
      const checksum = MetadataExtractor.generateChecksum(filePath);

      // Create tune record in database
      const tuneData = {
        file_name: req.file.originalname,
        file_path: filePath,
        file_size: req.file.size,
        file_format: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
        title: req.body.title || metadata.title || path.parse(req.file.originalname).name,
        artist: req.body.artist || metadata.artist || 'Unknown Artist',
        album: req.body.album || metadata.album,
        album_artist: req.body.album_artist || metadata.album_artist,
        genre: req.body.genre || metadata.genre,
        year: req.body.year || metadata.year,
        track_number: req.body.track_number || metadata.track_number,
        disk_number: req.body.disk_number || metadata.disk_number,
        composer: req.body.composer || metadata.composer,
        bitrate: metadata.bitrate,
        sample_rate: metadata.sample_rate,
        channels: metadata.channels,
        duration: metadata.duration,
        checksum: checksum,
        uploaded_by: req.user?.id || 1, // Fallback for testing
        status: 'active'
      };

      const tune = await Tune.create(tuneData);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: tune.id,
          title: tune.title,
          artist: tune.artist,
          file_size: tune.file_size,
          duration: tune.duration,
          file_format: tune.file_format
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      // Clean up uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error uploading file',
        error: error.message
      });
    }
  }

  async uploadMultipleMusic(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadResults = [];

      for (const file of req.files) {
        try {
          const filePath = file.path;
          const isAudio = file.mimetype.startsWith('audio/');
          
          let metadata = {};
          if (isAudio) {
            metadata = await MetadataExtractor.extractAudioMetadata(filePath);
          }

          const checksum = MetadataExtractor.generateChecksum(filePath);

          const tuneData = {
            file_name: file.originalname,
            file_path: filePath,
            file_size: file.size,
            file_format: path.extname(file.originalname).toLowerCase().replace('.', ''),
            title: req.body.title || metadata.title || path.parse(file.originalname).name,
            artist: req.body.artist || metadata.artist || 'Unknown Artist',
            album: req.body.album || metadata.album,
            album_artist: req.body.album_artist || metadata.album_artist,
            genre: req.body.genre || metadata.genre,
            year: req.body.year || metadata.year,
            track_number: req.body.track_number || metadata.track_number,
            disk_number: req.body.disk_number || metadata.disk_number,
            composer: req.body.composer || metadata.composer,
            bitrate: metadata.bitrate,
            sample_rate: metadata.sample_rate,
            channels: metadata.channels,
            duration: metadata.duration,
            checksum: checksum,
            uploaded_by: req.user?.id || 1, // Fallback for testing
            status: 'active'
          };

          const tune = await Tune.create(tuneData);

          uploadResults.push({
            success: true,
            file: file.originalname,
            id: tune.id,
            title: tune.title,
            artist: tune.artist
          });

        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          
          // Clean up file if there was an error
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          uploadResults.push({
            success: false,
            file: file.originalname,
            error: fileError.message
          });
        }
      }

      res.status(207).json({ // 207 Multi-Status
        success: true,
        message: 'Batch upload completed',
        results: uploadResults
      });

    } catch (error) {
      console.error('Batch upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing batch upload',
        error: error.message
      });
    }
  }
}

module.exports = UploadController;