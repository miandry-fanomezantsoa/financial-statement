const stripe_api = require('../../src/stripe-api')
const refund_adjustment = require('../../src/adjustment/refunds')

afterEach(() => {
    refund_adjustment.resetCachedData()
})

test("Error when Stripe refund's charge not found in Stripe", () => {
    return expect(stripe_api.getCharge('ch_3JsqKFLqBZMTwzGL0ew6M8zPkqlfdq')).rejects.toThrow('This charge ch_3JsqKFLqBZMTwzGL0ew6M8zPkqlfdq not exists in Stripe')
})

test("Error when Stripe refund's transaction not found in Stripe", () => {
    return expect(stripe_api.getBalanceTransaction('txn_3JrPdSLqBZMTwzGL00guJHupjqkfds')).rejects.toThrow('This balance transaction txn_3JrPdSLqBZMTwzGL00guJHupjqkfds not exists in Stripe')
})

test("Difference of amount in AED of refund's transaction between ZohoBook and Stripe", async () => {
    const result1 = await refund_adjustment.diffTrans(4.125060, 249.000, "ch_3JsqKFLqBZMTwzGL0ew6M8zP")
    expect(result1).toEqual({
        stripe: "1027.14",
        zoho: "1027.14",
        diffTrans: "0.00"
    })

    const result2 = await refund_adjustment.diffTrans(4.105930, 145.000, "ch_3JyIZuLqBZMTwzGL0BMwT8vL")
    expect(result2).toEqual({
        stripe: "595.36",
        zoho: "595.36",
        diffTrans: "0.00"
    })
})

test("Compute sum of difference of transaction", async () => {
    const data = [
        {
            exch: 4.200430,
            eur: 483.000,
            id: "ch_3JrTRRLqBZMTwzGL1AFt4EBo"
        },
        {
            exch: 4.090213,
            eur: 1547.000,
            id: "ch_3Jx94zLqBZMTwzGL0YsVz7W5"
        },
        {
            exch: 4.105930,
            eur: 145.000,
            id: "ch_3JxYr5LqBZMTwzGL1eTeWkDe"
        }
    ]

    await refund_adjustment.checkDiff(data)
    expect(refund_adjustment.TOTAL_DIFFTRANS.toFixed(2)).toBe("0.00")
})

// test.skip("Error when data exceeds one month", () => {
//     const data = [
//         {
//             exch: 4.210120,
//             bank: 1.320,
//             eur: 47.000,
//             id: "ch_3JrfJ3LqBZMTwzGL1acc18hT",
//             aed: 197.87564,
//             date: "2021-11-03"
//         },
//         {
//             exch: 4.199460,
//             bank: 7.830,
//             eur: 330.000,
//             id: "ch_3JsMcTLqBZMTwzGL17CT2OcT",
//             aed: 1385.8218,
//             date: "2021-11-05"
//         },
//         {
//             exch: 4.200440,
//             bank: 2.620,
//             eur: 103.470,
//             id: "ch_3JsvHBLqBZMTwzGL0COZnR1R",
//             aed: 434.619527,
//             date: "2021-12-06"
//         }
//     ]
//     return expect(refund_adjustment.checkDiff(data)).rejects.
//     toThrow("The data analyzed exceed one month. Start date on Wed Nov 03 2021 and end date on Mon Dec 06 2021")
// })

// test.skip("Finding start and end date when checking difference of transaction", async () => {
//     const data = [
//         {
//             exch: 4.210120,
//             bank: 1.320,
//             eur: 47.000,
//             id: "ch_3JrfJ3LqBZMTwzGL1acc18hT",
//             aed: 197.87564,
//             date: "2021-11-03"
//         },
//         {
//             exch: 4.199460,
//             bank: 7.830,
//             eur: 330.000,
//             id: "ch_3JsMcTLqBZMTwzGL17CT2OcT",
//             aed: 1385.8218,
//             date: "2021-11-05"
//         },
//         {
//             exch: 4.200440,
//             bank: 2.620,
//             eur: 103.470,
//             id: "ch_3JsvHBLqBZMTwzGL0COZnR1R",
//             aed: 434.619527,
//             date: "2021-11-06"
//         }
//     ]
//     await refund_adjustment.checkDiff(data)
//     expect(refund_adjustment.START_DATE).toEqual(new Date("2021-11-03"))
//     expect(refund_adjustment.END_DATE).toEqual(new Date("2021-11-06"))
// })

