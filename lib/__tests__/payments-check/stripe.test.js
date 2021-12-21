const stripe_payments = require('../../src/payments-check/stripe')

jest.setTimeout(60000)

afterEach(() => {
    stripe_payments.resetCachedData()
})

test("reading empty stripe payments stop the program", () => {
    return expect(stripe_payments.getPayments("1lnQAl2WTyEMYU_J6rOoYMHBw8Q-5xW2ZJTHWltz5L5Q", "stripe-payments")).rejects.toThrow("Empty Stripe payments")
})

test("empty zoho book payments stop the program", () => {
    return expect(stripe_payments.getZohoBookStripePayments("1lnQAl2WTyEMYU_J6rOoYMHBw8Q-5xW2ZJTHWltz5L5Q", "zb-payments")).rejects.toThrow("Empty Stripe payments in Zoho Book")
})

test("Not founded stripe payment in zoho book payment is listed in UNFOUNDED PAYMENTS", async () => {
    await stripe_payments.matchStripePaymentsWithZohoBook("12Bxbth275sFpawNt2IiEFBaQgQYqc9kShtMwnHNVlF8", "stripe-payments", "zb-payments")
    expect(stripe_payments.UNFOUNDED_PAYMENTS.length).toBe(3)
    expect(stripe_payments.UNFOUNDED_PAYMENTS[0].id).toBe("ch_3JtfA4LqBZMTwzGL12XU2reX")
    expect(stripe_payments.UNFOUNDED_PAYMENTS[1].id).toBe("ch_3K1BZ8LqBZMTwzGL12X6zAAM")
    expect(stripe_payments.UNFOUNDED_PAYMENTS[2].id).toBe("ch_3K1VDfLqBZMTwzGL1ipHHba7")
})

test("UNFOUNDED PAYMENTS empty if all stripe payments are founded in zoho book payments", async () => {
    await stripe_payments.matchStripePaymentsWithZohoBook("1yFwnk2ISEdQdiqm6ilv8bUf1E1SnLaKyqCSNkbVtnHA", "stripe-payments", "zb-payments")
    expect(stripe_payments.UNFOUNDED_PAYMENTS.length).toBe(0)
})

test("stripe payment founded in zoho book payment but amounts are not equal, the payment is listed in the PAYMENT'S AMOUNT ERRORS", async () => {
    await stripe_payments.matchStripePaymentsWithZohoBook("1yFwnk2ISEdQdiqm6ilv8bUf1E1SnLaKyqCSNkbVtnHA", "stripe-payments", "zb-payments")
    expect(stripe_payments.PAYMENTS_AMOUNT_ERRORS.length).toBe(2)
    expect(stripe_payments.PAYMENTS_AMOUNT_ERRORS[0].id).toBe("ch_3JtaUqLqBZMTwzGL1Z1OXZA9")
    expect(stripe_payments.PAYMENTS_AMOUNT_ERRORS[1].id).toBe("ch_3K1BZ8LqBZMTwzGL12X6zAAM")
})

test("PAYMENT'S AMOUNT ERRORS empty if all founded stripe payments in zoho book payment's amounts matches", async () => {
    await stripe_payments.matchStripePaymentsWithZohoBook("1cKXLFuNPawLzUq91x13gqUezGCe9o_LfXNP17jECYkQ", "stripe-payments", "zb-payments")
    expect(stripe_payments.PAYMENTS_AMOUNT_ERRORS.length).toBe(0)
})

test("PAYMENT'S AMOUNT ERRORS empty and UNFOUNDED PAYMENTS empty, the program show STRIPE PAYMENT OK", async () => {
    await stripe_payments.matchStripePaymentsWithZohoBook("1cKXLFuNPawLzUq91x13gqUezGCe9o_LfXNP17jECYkQ", "stripe-payments", "zb-payments")
    expect(stripe_payments.PAYMENT_STATUS).toBe("OK")
})