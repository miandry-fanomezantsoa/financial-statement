const stripe_refunds = require('../../src/refunds-check/stripe')

jest.setTimeout(60000)

afterEach(() => {
    stripe_refunds.resetCachedData()
})

test("reading empty stripe refunds stop the program", () => {
    return expect(stripe_refunds.getRefunds("1KBL_9TxfFoSzmi4ShMGnhfDXUQJOGqRr0EIWNnH5Ni0", "stripe-refunds")).rejects.toThrow("Empty Stripe refunds")
})

test("zoho book stripe payments not contained in stripe payments and not contained in stripe refunds is listed in UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS", async () => {
    await stripe_refunds.checkRemainingZohoBookPayments("1pHYbCZ5AVV1kU1t2p7w4MfCm8MZrbQSorpaq3zNVDrk", "zb-payments", "stripe-payments", "stripe-refunds")
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS.length).toBe(2)
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS[0]["CF.Payment Plat Payment Id"]).toBe("ch_3JyjqpLqBZMTwzGL0EY08oDc")
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS[1]["CF.Payment Plat Payment Id"]).toBe("ch_3K1dVCLqBZMTwzGL06ToGEKb")
})

test("all remaining zoho book payments are founded in stripe refunds, so UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS is empty", async () => {
    await stripe_refunds.checkRemainingZohoBookPayments("1e9dyr8qGAAnYfjcCHmmplERMCHMQbSI1fXcvMStJf08", "zb-payments", "stripe-payments", "stripe-refunds")
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS.length).toBe(0)
})

test("empty zoho book stripe refunds stop the program", () => {
    return expect(stripe_refunds.getZohoBookStripeRefunds("1JiOx0kSdqmRHiKCf4UTNOIJqSQK-i8frlEyxhCHbthU", "zb-refunds")).rejects.toThrow("Empty Zoho Book stripe refunds")
})

test("a zoho book stripe refund not found in stripe refunds is listed in UNKNOWN_ZOHO_BOOK_REFUNDS", async () => {
    await stripe_refunds.checkZohoBookRefunds("1g487245d5FHfMycklUv_IBVApPToZ-xFTqJlrtLceVg", "zb-refunds", "stripe-refunds")
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.length).toBe(3)
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS[0]["Reference Number"]).toBe("ch_3JnL4mLqBZMTwzGL0ImsDNKD")
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS[1]["Reference Number"]).toBe("ch_3JocZhLqBZMTwzGL1V6lEabw")
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS[2]["Reference Number"]).toBe("ch_3JqhCoLqBZMTwzGL0qaHxVrc")
})

test("UNKNOWN_ZOHO_BOOK_REFUNDS empty if all zoho book stripe refunds are founded in stripe refunds", async () => {
    await stripe_refunds.checkZohoBookRefunds("1MoK_6vFet8z-x43UlW49TXAv0f71ASaWHPj8ZNQXAog", "zb-refunds", "stripe-refunds")
    expect(stripe_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.length).toBe(0)
})

test("all zoho book stripe payments are founded and there is no unknown zoho book refunds, the refunds status is OK", () => {
    return expect(stripe_refunds.getRefundsStatus("15RbTJqKjBaBAFKVgDlu4BdiU57qL6MCX_G0L9rToeso", "zb-payments", "zb-refunds", "stripe-payments", "stripe-refunds")).resolves.toBe("OK")
})