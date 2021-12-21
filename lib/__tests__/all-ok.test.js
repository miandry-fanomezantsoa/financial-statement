const stripe_payments = require('../src/payments-check/stripe')
const checkout_payments = require('../src/payments-check/checkout')
const stripe_refunds = require('../src/refunds-check/stripe')
const checkout_refunds = require('../src/refunds-check/checkout')

jest.setTimeout(60000)

test("all stripe payments OK", async () => {
    await stripe_payments.matchStripePaymentsWithZohoBook("1EdFS5exuWdQZpeqc02_aoS0AOK8t-D_5GYE6uF-jF_I", "stripe-payments", "zb-payments")
    expect(stripe_payments.PAYMENT_STATUS).toBe("OK")

    await checkout_payments.matchCheckoutPaymentsWithZohoBook("1EdFS5exuWdQZpeqc02_aoS0AOK8t-D_5GYE6uF-jF_I", "checkout", "zb-payments")
    expect(checkout_payments.PAYMENT_STATUS).toBe("OK")

    expect(await stripe_refunds.getRefundsStatus("1EdFS5exuWdQZpeqc02_aoS0AOK8t-D_5GYE6uF-jF_I", "zb-payments", "zb-refunds", "stripe-payments", "stripe-refunds")).toBe("OK")
    expect(await checkout_refunds.getRefundsStatus("1EdFS5exuWdQZpeqc02_aoS0AOK8t-D_5GYE6uF-jF_I", "zb-payments", "zb-refunds", "checkout", "checkout")).toBe("OK")

    expect(stripe_payments.COUNT).toBe(5)
    expect(checkout_payments.COUNT).toBe(4)
    expect(stripe_refunds.COUNT).toBe(4)
    expect(checkout_refunds.COUNT).toBe(3)

    expect(stripe_payments.SUM.toFixed(2)).toBe("986.50")
    expect(checkout_payments.SUM.toFixed(2)).toBe("526.90")
    expect(stripe_refunds.SUM.toFixed(2)).toBe("434.00")
    expect(checkout_refunds.SUM.toFixed(2)).toBe("477.00")
})