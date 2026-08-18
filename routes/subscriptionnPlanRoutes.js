const express = require('express');

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
        '/', subscriptionPlanController.createPlan
    );

    router.put(
        '/:id', subscriptionPlanController.updatePlan
    );

    router.delete(
        '/:id', subscriptionPlanController.deactivatePlan
    );

    return router;
};