const stripe_api = require('../../src/stripe-api')
const adjustment = require('../../src/adjustment/payments')

test('Error when Stripe payment not found in Stripe', () => {
    return expect(stripe_api.getCharge('ch_3K1GFVLqBZMTwzGL15ihPOwgqjdkqfs')).rejects.toThrow('Payment not exists in Stripe')
})

test('Difference of amount in AED of transaction ', async () => {
    const result = await adjustment.diffTrans(409.25464, 2.470, 4.192570, "ch_3JrPdSLqBZMTwzGL0xSyxseg")
    expect(result).toBe("-0.05")
})