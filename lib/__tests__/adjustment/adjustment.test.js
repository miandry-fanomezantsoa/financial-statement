const stripe_api = require('../../src/adjustment/adjustment')

test('Error when Stripe payment not found in Stripe', () => {
    expect(stripe_api.getCharge('ch_3K1GFVLqBZMTwzGL15ihPOwgqjdkqfs')).toThrow('Payment not exists in Stripe')
})