module.exports = (
    controller,
    authenticate
) => {
    const express = require('express');
    const router = express.Router();

    // Public
    router.get(
        '/',
        controller.getPlans
    );

    router.get(
        '/:id',
        controller.getPlan
    );

   
    // authenticate shown 4 admin-only
    router.post(
        '/',
        authenticate,
        controller.createPlan
    );

    router.put(
        '/:id',
        authenticate,
        controller.updatePlan
    );

    router.delete(
        '/:id',
        authenticate,
        controller.deletePlan
    );

    return router;
};