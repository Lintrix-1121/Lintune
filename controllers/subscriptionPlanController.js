class SubscriptionPlanController {
    constructor(SubscriptionPlan) {
        this.SubscriptionPlan = SubscriptionPlan;
    }

    // GET /subscription-plans
    getPlans = async (req, res) => {
        try {
            const plans = await this.SubscriptionPlan.findAll({
                where: {
                    isActive: true
                },
                order: [['price', 'ASC']]
            });
            return res.status(200).json({
                success: true,
                count: plans.length,
                data: plans
            });
        } catch (error) {
            console.error(
                'Error fetching subscription plans:',
                error
            );
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch subscription plans'
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
                    message: 'Subscription plan not found'
                });
            }
            return res.json({
                success: true,
                data: plan
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch subscription plan'
            });
        }
    };

    // POST /subscription-plans
    createPlan = async (req, res) => {
        try {
            const {
                name,
                description,
                price,
                currency = 'UGX',
                interval = 'monthly',
                trialDays = 14
            } = req.body;
            if (!name || price === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and price are required'
                });
            }
            const plan =
                await this.SubscriptionPlan.create({
                    name,
                    description,
                    price,
                    currency,
                    interval,
                    trialDays,
                    isActive: true
                });
            return res.status(201).json({
                success: true,
                message: 'Subscription plan created',
                data: plan
            });
        } catch (error) {
            console.error(
                'Error creating subscription plan:',
                error
            );
            return res.status(500).json({
                success: false,
                message: error.message
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
                    message: 'Subscription plan not found'
                });
            }
            await plan.update(req.body);
            return res.json({
                success: true,
                message: 'Subscription plan updated',
                data: plan
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    // DELETE /subscription-plans/:id
    deletePlan = async (req, res) => {
        try {
            const plan =
                await this.SubscriptionPlan.findByPk(
                    req.params.id
                );
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription plan not found'
                });
            }
            // state to inactive beta of deleting
            await plan.update({
                isActive: false
            });
            return res.json({
                success: true,
                message: 'Subscription plan deactivated'
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
}

module.exports = SubscriptionPlanController;