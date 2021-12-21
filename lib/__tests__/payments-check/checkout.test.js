const checkout_payments = require('../../src/payments-check/checkout')

jest.setTimeout(60000)

afterEach(() => {
    checkout_payments.resetCachedData()
})

test("reading empty checkout payments stop the program", () => {
    return expect(checkout_payments.getPayments("1BcVlQSAqZlMTp9Y3rSCH_NEFj1AFSntgl7f5GhVXoQU", "checkout")).rejects.toThrow("Empty Checkout payments")
})

test("empty zoho book payments stop the program", () => {
    return expect(checkout_payments.getZohoBookCheckoutPayments("1BcVlQSAqZlMTp9Y3rSCH_NEFj1AFSntgl7f5GhVXoQU", "zb-payments")).rejects.toThrow("Empty Checkout payments in Zoho Book")
})

test("Not founded checkout payment in zoho book payment is listed in UNFOUNDED PAYMENTS", async () => {
    await checkout_payments.matchCheckoutPaymentsWithZohoBook("1q1wEeqTMj3H4RoEmvyENZHAfWXEvlqUDbo7fe0UZ51g", "checkout", "zb-payments")
    expect(checkout_payments.UNFOUNDED_PAYMENTS.length).toBe(3)
    expect(checkout_payments.UNFOUNDED_PAYMENTS[0]["Action ID"]).toBe("act_dberijxdubkkhgopmvaxfxeuym")
    expect(checkout_payments.UNFOUNDED_PAYMENTS[1]["Action ID"]).toBe("act_j3cgadis3nc2bon7xabytpmtda")
    expect(checkout_payments.UNFOUNDED_PAYMENTS[2]["Action ID"]).toBe("act_w3dpbjxum4o2fhnhskeny4bzae")
})

test("UNFOUNDED PAYMENTS empty if all checkout payments are founded in zoho book payments", async () => {
    await checkout_payments.matchCheckoutPaymentsWithZohoBook("1GshKc5nMmTNlhk31wkrzj86KlqYxzvfHgXnpwhgkhQ8", "checkout", "zb-payments")
    expect(checkout_payments.UNFOUNDED_PAYMENTS.length).toBe(0)
})

test("checkout payment founded in zoho book payment but amounts are not equal, the payment is listed in the PAYMENT'S AMOUNT ERRORS", async () => {
    await checkout_payments.matchCheckoutPaymentsWithZohoBook("1FqfTppX1PPbVEKv-PeMNHE8945XZ3zFIK9t4o3vrlT4", "checkout", "zb-payments")
    expect(checkout_payments.PAYMENTS_AMOUNT_ERRORS.length).toBe(2)
    expect(checkout_payments.PAYMENTS_AMOUNT_ERRORS[0]["Action ID"]).toBe("act_4fmk7bvhb352bi4ap5l47idlcy")
})

test("PAYMENT'S AMOUNT ERRORS empty if all founded checkout payments in zoho book payment's amounts matches", async () => {
    await checkout_payments.matchCheckoutPaymentsWithZohoBook("1IIaUsrGU4e9TfGpOF4zZ6GhCZUQQ_XyKUclfR642R70", "checkout", "zb-payments")
    expect(checkout_payments.PAYMENTS_AMOUNT_ERRORS.length).toBe(0)
})

test("PAYMENT'S AMOUNT ERRORS empty and UNFOUNDED PAYMENTS empty, the program show CHECKOUT PAYMENT OK", async () => {
    await checkout_payments.matchCheckoutPaymentsWithZohoBook("1IIaUsrGU4e9TfGpOF4zZ6GhCZUQQ_XyKUclfR642R70", "checkout", "zb-payments")
    expect(checkout_payments.PAYMENT_STATUS).toBe("OK")
})