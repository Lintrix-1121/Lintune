const express = require('express');
const authenticate = require('../middleware/jwtAuth');
const requireAdmin = require('../middleware/adminMiddleware');

module.exports = (subscriptionPlanController) => {
    const router = express.Router();

    router.get(
        '/', subscriptionPlanController.getPlans
    );

    router.get(
        '/:id', subscriptionPlanController.getPlan
    );

    //admin middleware
    router.post(
        '/', authenticate, requireAdmin, subscriptionPlanController.createPlan
    );

    router.put(
        '/:id', authenticate, requireAdmin, subscriptionPlanController.updatePlan
    );

    router.patch(
        '/:id/status', authenticate, requireAdmin, subscriptionPlanController.toggleStatus
    );

    router.delete(
        '/:id', authenticate, requireAdmin, subscriptionPlanController.deactivatePlan
    );

    return router;
};