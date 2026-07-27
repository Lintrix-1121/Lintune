const { Tune } = require('../models/song');
const TuneEvent = require('../models/tuneEvent');
const sequelize = require('../config/dbConfig');
const { Sequelize, Op } = require('sequelize');

class TuneController {
  constructor() {
    //initialize anything
  }



    // Fetch recently uploaded tunes
  async getRecentTunes(req, res) {
    try {
      const { limit = 10 } = req.query;

      const tunes = await Tune.findAll({
        where: { status: 'active' },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        attributes: { 
          exclude: ['file_path', 'checksum', 'updatedAt'] 
        }
      });

      res.status(200).json({
        success: true,
        data: {
          tunes,
          count: tunes.length,
          timeRange: 'recent'
        }
      });

    } catch (error) {
      console.error('Get recent tunes error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching recent tunes',
        error: error.message
      });
    }
  }

//get total number of tunes
  async getTotalTuneCount(req, res) {
  try {
    const { status = 'active' } = req.query;

    // Build where clause
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    // Get total count
    const totalCount = await Tune.count({
      where: whereClause
    });

    // Get breakdown by file format
    const formatBreakdown = await Tune.findAll({
      where: whereClause,
      attributes: [
        'file_format',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('file_size')), 'total_size']
      ],
      group: ['file_format'],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        total_count: totalCount,
        format_breakdown: formatBreakdown.map(item => ({
          format: item.file_format,
          count: parseInt(item.count),
          total_size: parseInt(item.total_size || 0),
          total_size_gb: parseFloat((item.total_size || 0) / (1024 * 1024 * 1024)).toFixed(3)
        })),
        filters: {
          status: status
        }
      }
    });

  } catch (error) {
    console.error('Get total tune count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching total tune count',
      error: error.message
    });
  }
}

  // Record play event
  async recordPlay(req, res) {
    try {
      const { id } = req.params;

      const tune = await Tune.findOne({
        where: { id, status: 'active' }
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }  
      const userId = req.user ? req.user.userId : null;
        await Promise.all([
          tune.increment('stream_count'),
          TuneEvent.create({
            tune_id: tune_id,
            user_id: userId,
            event_type: 'stream',
            timestamp: new Date()
          })
        ]);
      

      // Update play statistics
      await tune.update({
        play_count: (tune.play_count || 0) + 1,
        last_played: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Play recorded successfully',
        data: {
          stream_count: tune.stream_count + 1,
          play_count: tune.play_count + 1,
          last_played: new Date()
        }
      });

    } catch (error) {
      console.error('Record play error:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording play',
        error: error.message
      });
    }
  }

  // Record skip event
  async recordSkip(req, res) {
    try {
      const { id } = req.params;

      const tune = await Tune.findOne({
        where: { id, status: 'active' }
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }

      // Update skip statistics
      await tune.update({
        skip_count: (tune.skip_count || 0) + 1
      });

      res.status(200).json({
        success: true,
        message: 'Skip recorded successfully',
        data: {
          skip_count: tune.skip_count + 1
        }
      });

    } catch (error) {
      console.error('Record skip error:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording skip',
        error: error.message
      });
    }
  }

  // Update rating
  async updateRating(req, res) {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (rating === undefined || rating < 0 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 0 and 5'
        });
      }

      const tune = await Tune.findOne({
        where: { id, status: 'active' }
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }

      await tune.update({ rating });

      res.status(200).json({
        success: true,
        message: 'Rating updated successfully',
        data: { rating }
      });

    } catch (error) {
      console.error('Update rating error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating rating',
        error: error.message
      });
    }
  }

  // Toggle favorite status
  async toggleFavorite(req, res) {
    try {
      const { id } = req.params;

      const tune = await Tune.findOne({
        where: { id, status: 'active' }
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }

      const newFavoriteStatus = !tune.favorite;
      await tune.update({ favorite: newFavoriteStatus });

      res.status(200).json({
        success: true,
        message: `Tune ${newFavoriteStatus ? 'added to' : 'removed from'} favorites`,
        data: { favorite: newFavoriteStatus }
      });

    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating favorite status',
        error: error.message
      });
    }
  }

  // Get playback statistics
  async getPlaybackStats(req, res) {
    try {
      const { id } = req.params;

      const tune = await Tune.findOne({
        where: { id, status: 'active' },
        attributes: [
          'id', 'title', 'artist', 'stream_count', 'download_count',
          'play_count', 'skip_count', 'rating',
          'last_played', 'favorite', 'duration'
        ]
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }

      // Calculate completion rate if we have play data
      const completionRate = tune.play_count > 0 
        ? Math.max(0, Math.min(100, ((tune.play_count - tune.skip_count) / tune.play_count) * 100))
        : 0;

      res.status(200).json({
        success: true,
        data: {
          ...tune.toJSON(),
          completion_rate: completionRate,
          skip_rate: tune.play_count > 0 ? (tune.skip_count / tune.play_count) * 100 : 0
        }
      });

    } catch (error) {
      console.error('Get playback stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching playback statistics',
        error: error.message
      });
    }
  }

  // Get most played tunes
  async getMostPlayed(req, res) {
    try {
      const { 
        limit = 10, 
        period = 'all' // 'day', 'week', 'month', 'year', 'all'
      } = req.query;

      let dateFilter = {};
      
      if (period !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        dateFilter = {
          last_played: {
            [Op.gte]: startDate
          }
        };
      }

      const tunes = await Tune.findAll({
        where: {
          status: 'active',
          play_count: { [Op.gt]: 0 },
          ...dateFilter
        },
        order: [['play_count', 'DESC']],
        limit: parseInt(limit),
        attributes: [
          'id', 'title', 'artist', 'album', 'duration',
          'play_count', 'skip_count', 'rating', 'last_played', 'favorite'
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          tunes,
          period,
          count: tunes.length
        }
      });

    } catch (error) {
      console.error('Get most played error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching most played tunes',
        error: error.message
      });
    }
  }

  // Get favorite tunes
  async getFavorites(req, res) {
    try {
      const { 
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows: tunes } = await Tune.findAndCountAll({
        where: { 
          status: 'active',
          favorite: true
        },
        order: [['last_played', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: { 
          exclude: ['file_path', 'checksum'] 
        }
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          tunes,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching favorite tunes',
        error: error.message
      });
    }
  }

  // Get recently played tunes
  async getRecentlyPlayed(req, res) {
    try {
      const { limit = 10 } = req.query;

      const tunes = await Tune.findAll({
        where: { 
          status: 'active',
          last_played: { [Op.ne]: null }
        },
        order: [['last_played', 'DESC']],
        limit: parseInt(limit),
        attributes: [
          'id', 'title', 'artist', 'album', 'duration',
          'play_count', 'last_played', 'favorite', 'rating'
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          tunes,
          count: tunes.length
        }
      });

    } catch (error) {
      console.error('Get recently played error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching recently played tunes',
        error: error.message
      });
    }
  }

  // Update existing getAllTunes to include playback stats
  async getAllTunes(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        genre,
        year,
        format,
        favorite, // New filter for favorites
        minRating // New filter for minimum rating
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where clause for filters
      const whereClause = { status: 'active' };
      
      if (genre) {
        whereClause.genre = { [Op.iLike]: `%${genre}%` };
      }
      
      if (year) {
        whereClause.year = year;
      }
      
      if (format) {
        whereClause.file_format = format.toLowerCase();
      }

      if (favorite !== undefined) {
        whereClause.favorite = favorite === 'true';
      }

      if (minRating !== undefined) {
        whereClause.rating = { [Op.gte]: parseFloat(minRating) };
      }

      const { count, rows: tunes } = await Tune.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: { 
          exclude: ['file_path', 'checksum'] 
        }
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          tunes,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get all tunes error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tunes',
        error: error.message
      });
    }
  }

  // Update existing searchTunes to include playback stats in results
  async searchTunes(req, res) {
    try {
      const {
        query,
        page = 1,
        limit = 20,
        searchIn = 'both',
        includePlaybackStats = 'true' // New parameter to include playback stats
      } = req.query;

      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const offset = (page - 1) * limit;
      const searchTerm = `%${query.trim()}%`;

      // Build search conditions based on searchIn parameter
      const searchConditions = [];
      
      if (searchIn === 'title' || searchIn === 'both') {
        searchConditions.push({ title: { [Op.iLike]: searchTerm } });
      }
      
      if (searchIn === 'artist' || searchIn === 'both') {
        searchConditions.push({ artist: { [Op.iLike]: searchTerm } });
      }

      const whereClause = {
        status: 'active',
        [Op.or]: searchConditions
      };

      // Select attributes based on whether to include playback stats
      const attributes = includePlaybackStats === 'true' 
        ? { exclude: ['file_path', 'checksum'] }
        : { 
            exclude: ['file_path', 'checksum', 'play_count', 'skip_count', 'rating', 'last_played', 'favorite'] 
          };

      const { count, rows: tunes } = await Tune.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          tunes,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          search: {
            query,
            searchIn,
            resultsCount: count
          }
        }
      });

    } catch (error) {
      console.error('Search tunes error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching tunes',
        error: error.message
      });
    }
  }



    // Get tune by ID
  async getTuneById(req, res) {
    try {
      const { id } = req.params;

      const tune = await Tune.findOne({
        where: { id, status: 'active' },
        attributes: { exclude: ['checksum'] }
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }

      res.status(200).json({
        success: true,
        data: tune
      });

    } catch (error) {
      console.error('Get tune by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tune',
        error: error.message
      });
    }
  }


    // Update tune
  async updateTune(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Find the tune
      const tune = await Tune.findOne({
        where: { id, status: 'active' }
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }

      // List of allowed fields to update
      const allowedFields = [
        'title', 'artist', 'album', 'album_artist', 'genre', 
        'year', 'track_number', 'disk_number', 'composer'
      ];

      // Filter update data to only include allowed fields
      const filteredUpdateData = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      });

      // Update the tune
      await tune.update(filteredUpdateData);

      // Fetch the updated tune
      const updatedTune = await Tune.findByPk(id, {
        attributes: { exclude: ['file_path', 'checksum'] }
      });

      res.status(200).json({
        success: true,
        message: 'Tune updated successfully',
        data: updatedTune
      });

    } catch (error) {
      console.error('Update tune error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating tune',
        error: error.message
      });
    }
  }



    // Delete single tune
  async deleteTune(req, res) {
    try {
      const { id } = req.params;

      const tune = await Tune.findOne({
        where: { id, status: 'active' }
      });

      if (!tune) {
        return res.status(404).json({
          success: false,
          message: 'Tune not found'
        });
      }

      // Soft delete by updating status
      await tune.update({ status: 'deleted' });

      res.status(200).json({
        success: true,
        message: 'Tune deleted successfully'
      });

    } catch (error) {
      console.error('Delete tune error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting tune',
        error: error.message
      });
    }
  }


    // Delete multiple tunes
  async deleteMultipleTunes(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Array of tune IDs is required'
        });
      }

      // Verify all tunes exist and are active
      const tunes = await Tune.findAll({
        where: { 
          id: { [Op.in]: ids },
          status: 'active'
        }
      });

      if (tunes.length !== ids.length) {
        const foundIds = tunes.map(tune => tune.id);
        const notFoundIds = ids.filter(id => !foundIds.includes(id));
        
        return res.status(404).json({
          success: false,
          message: 'Some tunes not found',
          notFound: notFoundIds
        });
      }

      // Soft delete all tunes
      await Tune.update(
        { status: 'deleted' },
        { 
          where: { 
            id: { [Op.in]: ids },
            status: 'active'
          }
        }
      );

      res.status(200).json({
        success: true,
        message: `${ids.length} tune(s) deleted successfully`
      });

    } catch (error) {
      console.error('Delete multiple tunes error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting tunes',
        error: error.message
      });
    }
  }

  
  async getMonthlyStreams(req, res) {
    try {
      const { id } = req.params;
      const { year, month } = req.query; //default to current month

      const where = { tune_id: id, event_type: 'stream' };
      if (year && month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        where.timestamp = { [Op.gte]: start, [Op.lt]: end };
      } else {
        // current month
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        where.timestamp = { [Op.gte]: start, [Op.lt]: end };
      }

      const count = await TuneEvent.count({ where });
      // Also get total streams of all time
      const totalStreams = await TuneEvent.count({ where: { tune_id: id, event_type: 'stream' } });

      res.status(200).json({
        success: true,
        data: {
          tune_id: id,
          monthly_streams: count,
          total_streams: totalStreams,
          month: year && month ? `${year}-${month}` : 'current'
        }
      });
    } catch (error) {  }
  }

  async getAverageStreams(req, res) {
    try {
      const { days = 30 } = req.query;
      const start = new Date();
      start.setDate(start.getDate() - parseInt(days));

      const count = await TuneEvent.count({
        where: {
          event_type: 'stream',
          timestamp: { [Op.gte]: start }
        }
      });
      const avg = count / days;

      res.status(200).json({
        success: true,
        data: {
          period_days: parseInt(days),
          total_streams: count,
          average_streams_per_day: avg.toFixed(2)
        }
      });
    } catch (error) {  }
}


  async getMonthlyStreams(req, res) {
    try {
      const { id } = req.params;
      const { year, month } = req.query; // default to current month

      const where = { tune_id: id, event_type: 'stream' };
      let start, end;
      if (year && month) {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 1);
      } else {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
      where.timestamp = { [Op.gte]: start, [Op.lt]: end };

      const monthlyStreams = await TuneEvent.count({ where });
      const totalStreams = await TuneEvent.count({ where: { tune_id: id, event_type: 'stream' } });

      res.status(200).json({
        success: true,
        data: {
          tune_id: id,
          monthly_streams: monthlyStreams,
          total_streams: totalStreams,
          period: `${start.toISOString().slice(0,7)}`
        }
      });
    } catch (error) {
      console.error('Get monthly streams error:', error);
      res.status(500).json({ success: false, message: 'Error fetching monthly streams', error: error.message });
    }
  }

  //Overall monthly streams for all tunes
  async getOverallMonthlyStreams(req, res) {
    try {
      const { year, month } = req.query;
      const now = new Date();
      const start = year && month ? new Date(year, month - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = year && month ? new Date(year, month, 1) : new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const totalStreams = await TuneEvent.count({
        where: {
          event_type: 'stream',
          timestamp: { [Op.gte]: start, [Op.lt]: end }
        }
      });
      const totalDownloads = await TuneEvent.count({
        where: {
          event_type: 'download',
          timestamp: { [Op.gte]: start, [Op.lt]: end }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          period: `${start.toISOString().slice(0,7)}`,
          total_streams: totalStreams,
          total_downloads: totalDownloads
        }
      });
    } catch (error) {
      console.error('Get overall monthly streams error:', error);
      res.status(500).json({ success: false, message: 'Error fetching overall streams', error: error.message });
    }
  }

  //Average streams per day over last N days
  async getAverageStreams(req, res) {
    try {
      const { days = 30 } = req.query;
      const start = new Date();
      start.setDate(start.getDate() - parseInt(days));

      const totalStreams = await TuneEvent.count({
        where: {
          event_type: 'stream',
          timestamp: { [Op.gte]: start }
        }
      });
      const avg = totalStreams / days;

      res.status(200).json({
        success: true,
        data: {
          period_days: parseInt(days),
          total_streams: totalStreams,
          average_streams_per_day: avg.toFixed(2)
        }
      });
    } catch (error) {
      console.error('Get average streams error:', error);
      res.status(500).json({ success: false, message: 'Error fetching average streams', error: error.message });
    }
  }

  // Repeat rate for a specific tune 
  //Percentage of streams that are repeated by the same user within a configurable threshold (default 24 hours).
  async getRepeatRate(req, res) {
    try {
      const { id } = req.params;
      const { thresholdHours = 24 } = req.query;

      // Fetch all stream events for this tune, ordered by user and timestamp
      const events = await TuneEvent.findAll({
        where: { tune_id: id, event_type: 'stream' },
        order: [['user_id', 'ASC'], ['timestamp', 'ASC']],
        attributes: ['user_id', 'timestamp']
      });

      if (events.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            tune_id: id,
            repeat_rate: 0,
            total_plays: 0,
            repeated_plays: 0,
            threshold_hours: parseFloat(thresholdHours)
          }
        });
      }

      // Group by user
      const userTimestamps = {};
      events.forEach(e => {
        const uid = e.user_id || 'anonymous'; // treat null as a group
        if (!userTimestamps[uid]) userTimestamps[uid] = [];
        userTimestamps[uid].push(e.timestamp);
      });

      let repeatedCount = 0;
      for (const uid in userTimestamps) {
        const timestamps = userTimestamps[uid].sort((a, b) => a - b);
        for (let i = 1; i < timestamps.length; i++) {
          const diffHours = (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60);
          if (diffHours <= thresholdHours) {
            repeatedCount++;
          }
        }
      }

      const totalPlays = events.length;
      const repeatRate = totalPlays > 0 ? (repeatedCount / totalPlays) * 100 : 0;

      res.status(200).json({
        success: true,
        data: {
          tune_id: id,
          repeat_rate: repeatRate.toFixed(2),
          total_plays: totalPlays,
          repeated_plays: repeatedCount,
          threshold_hours: parseFloat(thresholdHours)
        }
      });
    } catch (error) {
      console.error('Get repeat rate error:', error);
      res.status(500).json({ success: false, message: 'Error calculating repeat rate', error: error.message });
    }
  }

  //Playlist add count for a specific tune
  // Assumes we log playlist_add events in TuneEvent.
  async getPlaylistAddCount(req, res) {
    try {
      const { id } = req.params;
      const count = await TuneEvent.count({
        where: { tune_id: id, event_type: 'playlist_add' }
      });
      res.status(200).json({
        success: true,
        data: {
          tune_id: id,
          playlist_add_count: count
        }
      });
    } catch (error) {
      console.error('Get playlist add count error:', error);
      res.status(500).json({ success: false, message: 'Error fetching playlist add count', error: error.message });
    }
  }



}

module.exports = TuneController;


