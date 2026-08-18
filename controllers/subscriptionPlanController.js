const { createPlan } = require('../utils/dgateway');

class SubscriptionPlanController {
    constructor(SubscriptionPlan) {
        this.SubscriptionPlan = SubscriptionPlan;
    }

    // GET /subscription-plans
    getPlans = async (req, res) => {
        try {
            const plans =
                await this.SubscriptionPlan.findAll({
                    where: {
                        isActive: true
                    },
                    order: [
                        ['price', 'ASC']
                    ]
                });
            return res.json({
                success: true,
                data: plans
            });
        } catch (error) {
            console.error(
                'Get subscription plans error:',
                error
            );
            return res.status(500).json({
                success: false,
                message:
                    'Unable to load subscription plans'
            });
        }
    };
    
    // GET /subscription-plans/:id
    getPlan = async (req, res) => {
        try {
            const plan =
                await this.SubscriptionPlan.findByPk(
                    req.params.id
                );
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan not found'
                });
            }
            return res.json({
                success: true,
                data: plan
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Unable to load plan'
            });
        }
    };
  
    // POST /subscription-plans
    // Admin only
    createPlan = async (req, res) => {
        try {
            const {
                name,
                description,
                price,
                currency = 'UGX',
                interval = 'monthly',
                trialDays = 14,
                graceDays = 3
            } = req.body;

            if (!name || price === undefined) {
                return res.status(400).json({
                    success: false,
                    message:
                        'name and price are required'
                });
            }

            const existing =
                await this.SubscriptionPlan.findOne({
                    where: {
                        name
                    }
                });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        'A plan with this name already exists'
                });
            }

            // Create plan at DGateway first
            const dgatewayPlan =
                await createPlan({
                    name,
                    description,
                    amount: price,
                    currency,
                    interval,
                    trialDays,
                    graceDays
                });
            const dgPlan = dgatewayPlan?.data;

            const plan =
                await this.SubscriptionPlan.create({
                    name,
                    description,
                    price,
                    currency,
                    interval,
                    trialDays,
                    graceDays,
                    dgatewayPlanId:
                        dgPlan?.id
                            ? String(dgPlan.id)
                            : null,
                    isActive: true
                });
            return res.status(201).json({
                success: true,
                message:
                    'Subscription plan created',
                data: plan
            });
        } catch (error) {
            console.error(
                'Create plan error:',
                error
            );
            return res.status(
                error.status || 500
            ).json({
                success: false,
                message:
                    error.message ||
                    'Unable to create subscription plan'
            });
        }
    };

    // PUT /subscription-plans/:id
    updatePlan = async (req, res) => {
        try {
            const plan =
                await this.SubscriptionPlan.findByPk(
                    req.params.id
                );
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan not found'
                });
            }
            await plan.update(req.body);
            return res.json({
                success: true,
                data: plan
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message:
                    'Unable to update subscription plan'
            });
        }
    };

    // DELETE /subscription-plans/:id
    deactivatePlan = async (req, res) => {
        try {
            const plan =
                await this.SubscriptionPlan.findByPk(
                    req.params.id
                );
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan not found'
                });
            }
            await plan.update({
                isActive: false
            });
            return res.json({
                success: true,
                message:
                    'Subscription plan deactivated'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message:
                    'Unable to deactivate plan'
            });
        }
    };
}


module.exports = SubscriptionPlanController;

