const checkout_refunds = require('../../src/refunds-check/checkout')

jest.setTimeout(60000)

afterEach(() => {
    checkout_refunds.resetCachedData()
})

test("reading empty checkout refunds stop the program", () => {
    return expect(checkout_refunds.getRefunds("11CUExcIoBXnNpzmCMM6MRDn2eByLd-WoyaW4MqpH-2M", "checkout")).rejects.toThrow("Empty Checkout refunds")
})

test("zoho book checkout payments not contained in checkout payments and not contained in checkout refunds is listed in UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS", async () => {
    await checkout_refunds.checkRemainingZohoBookPayments("116IZGN5D0LyDWxyXklBq7W9tkonzfUVDFKcGdFT0JxE", "zb-payments", "checkout", "checkout")
    expect(checkout_refunds.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS.length).toBe(1)
    expect(checkout_refunds.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS[0]["CF.Payment Plat Action ID"]).toBe("act_gp3b7b3ivunk3cbsmqkfjdfqezij")
})

test("all remaining zoho book payments are founded in checkout refunds, so UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS is empty", async () => {
    await checkout_refunds.checkRemainingZohoBookPayments("1wzYQN6lKZfqeDW8neynmbsjF5XhjQPmolNS0k8CSQms", "zb-payments", "checkout", "checkout")
    expect(checkout_refunds.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS.length).toBe(0)
})

test("empty zoho book checkout refunds stop the program", () => {
    return expect(checkout_refunds.getZohoBookCheckoutRefunds("1lFuY9ZAvdfc81lf95-nGlJUCizTc-NrdtKVExQZYvfc", "zb-refunds")).rejects.toThrow("Empty Zoho Book checkout refunds")
})

test("a zoho book checkout refund not found in checkout refunds is listed in UNKNOWN_ZOHO_BOOK_REFUNDS", async () => {
    await checkout_refunds.checkZohoBookRefunds("1oH4_446thNHgu9tds38gU2za4AdiSMDHAbjorNkHi7k", "zb-refunds", "checkout")
    expect(checkout_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.length).toBe(2)
    expect(checkout_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS[0]["Description"]).toBe("act_m4d76opssso2lb6qvbig7tfcuu")
    expect(checkout_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS[1]["Description"]).toBe("act_zlcnbpskogukdhytv2la272gxu")
})

test("UNKNOWN_ZOHO_BOOK_REFUNDS empty if all zoho book checkout refunds are founded in checkout refunds", async () => {
    await checkout_refunds.checkZohoBookRefunds("1gO285XZF-loBYrsNblXmG8ckT1cZZy2k4srG5jteYsg", "zb-refunds", "checkout")
    expect(checkout_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.length).toBe(0)
})

test("all zoho book checkout payments are founded and there is no unknown zoho book refunds, the refunds status is OK", () => {
    return expect(checkout_refunds.getRefundsStatus("1NZh4ERwoD9wLgYQtMDRZiHO2tnmZr2ElcTTcucU6bLQ", "zb-payments", "zb-refunds", "checkout", "checkout")).resolves.toBe("OK")
})