const { tune: Tune, tuneEvent: TuneEvent } = require('../models');
const path = require('path');
const fs = require('fs');


class DownloadController {
  constructor(Tune) {
    this.Tune = Tune;
  }

  // async downloadFile(req, res) {
  //   try {
  //     const { id } = req.params;

  //     const tune = await this.Tune.findByPk(id);
      
  //     if (!tune) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'File not found'
  //       });
  //     }

  //     if (tune.status !== 'active') {
  //       return res.status(403).json({
  //         success: false,
  //         message: 'File is not available for download'
  //       });
  //     }

  //     // Check if file exists
  //     if (!fs.existsSync(tune.file_path)) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'File not found on server'
  //       });
  //     }

  //     // Update play count 
  //     await tune.update({
  //       play_count: tune.play_count + 1,
  //       last_played: new Date()
  //     });

  //     // Set appropriate headers for download
  //     const filename = `${tune.artist} - ${tune.title}${path.extname(tune.file_path)}`;
      
  //     res.setHeader('Content-Type', this.getMimeType(tune.file_format));
  //     res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  //     res.setHeader('Content-Length', tune.file_size);

  //     // Stream file
  //     const fileStream = fs.createReadStream(tune.file_path);
  //     fileStream.pipe(res);

  //     fileStream.on('error', (error) => {
  //       console.error('File stream error:', error);
  //       if (!res.headersSent) {
  //         res.status(500).json({
  //           success: false,
  //           message: 'Error streaming file'
  //         });
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Download error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Error downloading file',
  //       error: error.message
  //     });
  //   }
  // }

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





  async streamFile(req, res) {
    try {
      const { id } = req.params;
      const tune = await Tune.findByPk(id);
      if (!tune) return res.status(404).json({ success: false, message: 'File not found' });
      if (tune.status !== 'active') return res.status(403).json({ success: false, message: 'File not available' });

      const filePath = tune.file_path;
      if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on server' });

      //Increment stream_count and log event
      const userId = req.user ? req.user.userId : null;
      await Promise.all([
        tune.increment('stream_count'),
        TuneEvent.create({
          tune_id: tune.id,
          user_id: userId,
          event_type: 'stream',
          timestamp: new Date()
        })
      ]);

      // Handle range request (streaming)
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': this.getMimeType(tune.file_format),
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': this.getMimeType(tune.file_format),
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }

    } catch (error) {
      console.error('Stream error:', error);
      res.status(500).json({ success: false, message: 'Streaming failed', error: error.message });
    }
  }

  async downloadFile(req, res) {
    try {
      const { id } = req.params;
      const tune = await Tune.findByPk(id);
      if (!tune) return res.status(404).json({ success: false, message: 'File not found' });
      if (tune.status !== 'active') return res.status(403).json({ success: false, message: 'File not available' });
      if (!fs.existsSync(tune.file_path)) return res.status(404).json({ success: false, message: 'File not found on server' });

      //Increment download_count and log event
      const userId = req.user ? req.user.userId : null;
      await Promise.all([
        tune.increment('download_count'),
        TuneEvent.create({
          tune_id: tune.id,
          user_id: userId,
          event_type: 'download',
          timestamp: new Date()
        })
      ]);

      // Set headers and stream
      const filename = `${tune.artist} - ${tune.title}${path.extname(tune.file_path)}`;
      res.setHeader('Content-Type', this.getMimeType(tune.file_format));
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', tune.file_size);
      const fileStream = fs.createReadStream(tune.file_path);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ success: false, message: 'Error downloading file', error: error.message });
    }
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

  // async streamFile(req, res) {
  //   try {
  //     const { id } = req.params;

  //     const tune = await this.Tune.findByPk(id);
  //     if (!tune) {
  //       return res.status(404).json({ success: false, message: 'File not found' });
  //     }

  //     if (tune.status !== 'active') {
  //       return res.status(403).json({ success: false, message: 'File not available' });
  //     }

  //     const filePath = tune.file_path;
  //     if (!fs.existsSync(filePath)) {
  //       return res.status(404).json({ success: false, message: 'File not found on server' });
  //     }

  //     const stat = fs.statSync(filePath);
  //     const fileSize = stat.size;
  //     const range = req.headers.range;

  //     // Handle range requests (for seeking)
  //     if (range) {
  //       const parts = range.replace(/bytes=/, "").split("-");
  //       const start = parseInt(parts[0], 10);
  //       const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  //       const chunksize = (end - start) + 1;

  //       const file = fs.createReadStream(filePath, { start, end });
  //       const head = {
  //         'Content-Range': `bytes ${start}-${end}/${fileSize}`,
  //         'Accept-Ranges': 'bytes',
  //         'Content-Length': chunksize,
  //         'Content-Type': this.getMimeType(tune.file_format),
  //       };
  //       res.writeHead(206, head);
  //       file.pipe(res);
  //     } else {
  //       // Full file stream (no range)
  //       const head = {
  //         'Content-Length': fileSize,
  //         'Content-Type': this.getMimeType(tune.file_format),
  //       };
  //       res.writeHead(200, head);
  //       fs.createReadStream(filePath).pipe(res);
  //     }

  //     // Update play count and last played
  //     await tune.update({
  //       play_count: (tune.play_count || 0) + 1,
  //       last_played: new Date()
  //     });

  //     await Promise.all([
  //       tune.increment('stream_count'),
  //       TuneEvent.create({
  //         tune_id: tune.id,
  //         user_id: req.user ? req.user.id : null,   // if authenticated
  //         event_type: 'stream',
  //         duration_played: null, // capture from client
  //         timestamp: new Date()
  //       })
  //     ]);

  //   } catch (error) {
  //     console.error('Stream error:', error);
  //     res.status(500).json({ success: false, message: 'Streaming failed', error: error.message });
  //   }
  // }

}

module.exports = DownloadController;

