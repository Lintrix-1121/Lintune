const DGATEWAY_URL =
    process.env.DGATEWAY_API_URL ||
    'https://dgatewayapi.desispay.com';

const DGATEWAY_API_KEY = process.env.DGATEWAY_API_KEY;
if (!DGATEWAY_API_KEY) {
    console.warn(
        'DGATEWAY_API_KEY is not configured'
    );
}

async function dgatewayRequest(
    endpoint,
    options = {}
) {
    const url = `${DGATEWAY_URL}${endpoint}`;
    const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': DGATEWAY_API_KEY,
            ...(options.headers || {})
        },
        body: options.body
            ? JSON.stringify(options.body)
            : undefined
    });

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {
            raw: text
        };
    }

    if (!response.ok) {
        const error = new Error(
            data?.message ||
            data?.error ||
            `DGateway HTTP ${response.status}`
        );
        error.status = response.status;
        error.response = data;

        throw error;
    }

    return data;
}

// Create DGateway subscription plan
async function createPlan({
    name,
    description,
    amount,
    currency = 'UGX',
    interval = 'monthly',
    trialDays = 14,
    graceDays = 3
}) {
    return dgatewayRequest(
        '/v1/subscriptions/plans',
        {
            method: 'POST',
            body: {
                name,
                description,
                amount: Number(amount),
                currency,
                interval,
                trial_days: Number(trialDays),
                grace_days: Number(graceDays)
            }
        }
    );
}

// Create customer subscription
async function createSubscription({
    planId,
    customerEmail,
    customerName,
    customerPhone,
    provider = 'iotec',
    startNow = false,
    metadata = {}
}) {
    return dgatewayRequest(
        '/v1/subscriptions',
        {
            method: 'POST',
            body: {
                plan_id: planId,
                customer_email: customerEmail,
                customer_name: customerName,
                customer_phone: customerPhone,
                provider,
                start_now: startNow,
                metadata
            }
        }
    );
}

// Charge subscription
async function chargeSubscription({
    subscriptionId,
    phoneNumber,
    provider = 'iotec'
}) {
    return dgatewayRequest(
        `/v1/subscriptions/${subscriptionId}/charge`,
        {
            method: 'POST',

            body: {
                phone_number: phoneNumber,
                provider
            }
        }
    );
}

// Verify payment
async function verifyPayment(reference) {
    return dgatewayRequest(
        '/v1/webhooks/verify',
        {
            method: 'POST',

            body: {
                reference
            }
        }
    );
}

// Cancel subscription
async function cancelSubscription(subscriptionId) {
    return dgatewayRequest(
        `/v1/subscriptions/${subscriptionId}/cancel`,
        {
            method: 'POST'
        }
    );
}

// Pause subscription
async function pauseSubscription(subscriptionId) {
    return dgatewayRequest(
        `/v1/subscriptions/${subscriptionId}/pause`,
        {
            method: 'POST'
        }
    );
}

// Resume subscription
async function resumeSubscription(subscriptionId) {
    return dgatewayRequest(
        `/v1/subscriptions/${subscriptionId}/resume`,
        {
            method: 'POST'
        }
    );
}


module.exports = {
    dgatewayRequest,
    createPlan,
    createSubscription,
    chargeSubscription,
    verifyPayment,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription
};

