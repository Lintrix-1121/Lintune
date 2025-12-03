const { Tune } = require('../models/song');
const path = require('path');
const fs = require('fs');

class DownloadController {
  constructor(Tune) {
    this.Tune = Tune;
  }

  async downloadFile(req, res) {
    try {
      const { id } = req.params;

      const tune = await this.Tune.findByPk(id);
      
      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      if (tune.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'File is not available for download'
        });
      }

      // Check if file exists
      if (!fs.existsSync(tune.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Update play count
      await tune.update({
        play_count: tune.play_count + 1,
        last_played: new Date()
      });

      // Set appropriate headers for download
      const filename = `${tune.artist} - ${tune.title}${path.extname(tune.file_path)}`;
      
      res.setHeader('Content-Type', this.getMimeType(tune.file_format));
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', tune.file_size);

      // Stream the file
      const fileStream = fs.createReadStream(tune.file_path);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file'
          });
        }
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading file',
        error: error.message
      });
    }
  }

  getMimeType(fileFormat) {
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'm4a': 'audio/x-m4a',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'mov': 'video/quicktime',
      'webm': 'video/webm'
    };

    return mimeTypes[fileFormat.toLowerCase()] || 'application/octet-stream';
  }



    async getFileInfo(req, res) {
    try {
      const { id } = req.params;

      const tune = await Tune.findByPk(id, {
        attributes: { 
          exclude: ['file_path', 'checksum', 'fingerprint'] 
        }
      });
      
      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      res.json({
        success: true,
        data: tune
      });

    } catch (error) {
      console.error('File info error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving file information',
        error: error.message
      });
    }
  }

}

module.exports = DownloadController;

