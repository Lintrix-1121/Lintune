const express = require('express');
const router = express.Router();
const TuneController = require('../controllers/tuneController');
const tuneController = new TuneController();

// Get all tunes with optional filtering and pagination
router.get('/', tuneController.getAllTunes.bind(tuneController));

//Get total number of tunes
router.get('/stats/count', tuneController.getTotalTuneCount.bind(tuneController));

// Search tunes by title or artist
router.get('/search', tuneController.searchTunes.bind(tuneController));

// Get recently uploaded tunes
router.get('/recent', tuneController.getRecentTunes.bind(tuneController));

// Get most played tunes
router.get('/most-played', tuneController.getMostPlayed.bind(tuneController));

// Get favorite tunes
router.get('/favorites', tuneController.getFavorites.bind(tuneController));

// Get recently played tunes
router.get('/recently-played', tuneController.getRecentlyPlayed.bind(tuneController));

// Get tune by ID
router.get('/:id', tuneController.getTuneById.bind(tuneController));

// Get playback statistics for a tune
router.get('/:id/stats', tuneController.getPlaybackStats.bind(tuneController));

// Record play event
router.post('/:id/play', tuneController.recordPlay.bind(tuneController));

// Record skip event
router.post('/:id/skip', tuneController.recordSkip.bind(tuneController));

// Update rating
router.put('/:id/rating', tuneController.updateRating.bind(tuneController));

// Toggle favorite status
router.put('/:id/favorite', tuneController.toggleFavorite.bind(tuneController));

// Update tune
router.put('/:id', tuneController.updateTune.bind(tuneController));

// Delete single tune
router.delete('/:id', tuneController.deleteTune.bind(tuneController));

// Delete multiple tunes
router.delete('/', tuneController.deleteMultipleTunes.bind(tuneController));

// Monthly streams for a specific tune
router.get('/:id/streams/monthly', tuneController.getMonthlyStreams.bind(tuneController));

// Overall monthly streams (all tunes)
router.get('/stats/monthly', tuneController.getOverallMonthlyStreams.bind(tuneController));

// Repeat rate
router.get('/:id/repeat-rate', tuneController.getRepeatRate.bind(tuneController));

// Averages e.g average daily streams
router.get('/stats/averages', tuneController.getAverageStreams.bind(tuneController));

// Get playlist add count if logged as events
router.get('/:id/playlist-adds', tuneController.getPlaylistAddCount.bind(tuneController));

// Monthly streams for a specific tune
router.get('/:id/streams/monthly', tuneController.getMonthlyStreams.bind(tuneController));

// Overall monthly streams (all tunes)
router.get('/stats/monthly', tuneController.getOverallMonthlyStreams.bind(tuneController));

// Average streams per day over last N days
router.get('/stats/averages', tuneController.getAverageStreams.bind(tuneController));

// Repeat rate for a tune
router.get('/:id/repeat-rate', tuneController.getRepeatRate.bind(tuneController));

// Playlist add count for a tune
router.get('/:id/playlist-adds', tuneController.getPlaylistAddCount.bind(tuneController));

module.exports = router;


