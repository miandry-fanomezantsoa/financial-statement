const stripe_api = require('../../src/stripe-api')
const payment_adjustment = require('../../src/adjustment/payments')

afterEach(() => {
    payment_adjustment.resetCachedData()
})

test("Error when Stripe payment's charge not found in Stripe", () => {
    return expect(stripe_api.getCharge('ch_3K1GFVLqBZMTwzGL15ihPOwgqjdkqfs')).rejects.toThrow('Charge not exists in Stripe')
})

test("Error when Stripe payment's transaction not found in Stripe", () => {
    return expect(stripe_api.getBalanceTransaction('txn_3JrPdSLqBZMTwzGL00guJHupjqkfds')).rejects.toThrow('Balance transaction not exists in Stripe')
})

test("Difference of amount in AED of payment's transaction between ZohoBook and Stripe", async () => {
    const result1 = await payment_adjustment.diffTrans(409.25464, 2.470, 4.219120, "ch_3JrPdSLqBZMTwzGL0xSyxseg")
    expect(result1).toEqual({
        stripe: "398.84",
        zoho: "398.83",
        diffTrans: "0.01"
    })

    const result2 = await payment_adjustment.diffTrans(607.92265, 3.570, 4.192570, "ch_3JsU8CLqBZMTwzGL0kCAPsl6")
    expect(result2).toEqual({
        stripe: "592.94",
        zoho: "592.95",
        diffTrans: "-0.01"
    })
})

test("Compute sum of difference of transaction", async () => {
    const data = [
        {
            exch: 4.210120,
            bank: 1.320,
            eur: 47.000,
            id: "ch_3JrfJ3LqBZMTwzGL1acc18hT",
            aed: 197.87564,
            date: "2021-11-03"
        },
        {
            exch: 4.199460,
            bank: 7.830,
            eur: 330.000,
            id: "ch_3JsMcTLqBZMTwzGL17CT2OcT",
            aed: 1385.8218,
            date: "2021-11-05"
        },
        {
            exch: 4.200440,
            bank: 2.620,
            eur: 103.470,
            id: "ch_3JsvHBLqBZMTwzGL0COZnR1R",
            aed: 434.619527,
            date: "2021-11-06"
        }
    ]

    await payment_adjustment.checkDiff(data)
    expect(payment_adjustment.TOTAL_DIFFTRANS.toFixed(2)).toBe("0.03")
})

test("Error when data exceeds one month", () => {
    const data = [
        {
            exch: 4.210120,
            bank: 1.320,
            eur: 47.000,
            id: "ch_3JrfJ3LqBZMTwzGL1acc18hT",
            aed: 197.87564,
            date: "2021-11-03"
        },
        {
            exch: 4.199460,
            bank: 7.830,
            eur: 330.000,
            id: "ch_3JsMcTLqBZMTwzGL17CT2OcT",
            aed: 1385.8218,
            date: "2021-11-05"
        },
        {
            exch: 4.200440,
            bank: 2.620,
            eur: 103.470,
            id: "ch_3JsvHBLqBZMTwzGL0COZnR1R",
            aed: 434.619527,
            date: "2021-12-06"
        }
    ]
    return expect(payment_adjustment.checkDiff(data)).rejects.
    toThrow("The data analyzed exceed one month. Start date on Wed Nov 03 2021 and end date on Mon Dec 06 2021")
})

test("Finding start and end date when checking difference of transaction", async () => {
    const data = [
        {
            exch: 4.210120,
            bank: 1.320,
            eur: 47.000,
            id: "ch_3JrfJ3LqBZMTwzGL1acc18hT",
            aed: 197.87564,
            date: "2021-11-03"
        },
        {
            exch: 4.199460,
            bank: 7.830,
            eur: 330.000,
            id: "ch_3JsMcTLqBZMTwzGL17CT2OcT",
            aed: 1385.8218,
            date: "2021-11-05"
        },
        {
            exch: 4.200440,
            bank: 2.620,
            eur: 103.470,
            id: "ch_3JsvHBLqBZMTwzGL0COZnR1R",
            aed: 434.619527,
            date: "2021-11-06"
        }
    ]
    await payment_adjustment.checkDiff(data)
    expect(payment_adjustment.START_DATE).toEqual(new Date("2021-11-03"))
    expect(payment_adjustment.END_DATE).toEqual(new Date("2021-11-06"))
})

