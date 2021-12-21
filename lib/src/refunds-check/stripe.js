const helpers = require('../helpers')
const stripe_payments = require("../payments-check/stripe")


module.exports = {
    UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS: [],
    UNKNOWN_ZOHO_BOOK_REFUNDS: [],
    COUNT: 0,
    SUM: 0,
    REFUNDS_DATA: [],
    resetCachedData: () => {
        module.exports.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS = []
        module.exports.UNKNOWN_ZOHO_BOOK_REFUNDS = []
        module.exports.COUNT = 0
        module.exports.SUM = 0
        module.exports.REFUNDS_DATA = []
    },
    getRefunds: async (spreadSheetId, sheetName) => {
        const stripe_refunds = await helpers.readWorkSheet(spreadSheetId, sheetName)
        const stripe_refunds_rows = await stripe_refunds.getRows()
        if(stripe_refunds_rows.length === 0) {
            throw new Error("Empty Stripe refunds")
        }
        return stripe_refunds_rows
    },
    checkRemainingZohoBookPayments: async (spreadSheetId, zohoBookPaymentsSheetName, stripePaymentsSheetName, stripeRefundsSheetName) => {
        const remaining_zoho_book_stripe_payments = helpers.sortRowsByColumn(
            await stripe_payments.getRemainingZohoBookPayments(
                spreadSheetId, 
                zohoBookPaymentsSheetName, 
                stripePaymentsSheetName
            ), 
            "CF.Payment Plat Payment Id"
        )
        const stripe_refunds = helpers.sortRowsByColumn(
            await module.exports.getRefunds(spreadSheetId, stripeRefundsSheetName), 
            "id"
        )
        const stripe_refunds_ids = stripe_refunds.map((refund, i) => refund["id"])

        let startIndex = undefined
        let foundedPayments = 0
        remaining_zoho_book_stripe_payments.forEach((payment, i) => {
            // Search the index of the first remaining stripe payment in the zoho book inside the stripe refunds
            let payment_id = payment["CF.Payment Plat Payment Id"]
            let founded = false
            let stripe_refunds_index = undefined

            if(startIndex === undefined) {
                let index = stripe_refunds_ids.indexOf(payment_id)
                if(index >= 0) {
                    stripe_refunds_index = startIndex = index
                    founded = true
                    foundedPayments++;
                }
            } else {
                let index = stripe_refunds_ids.indexOf(payment_id, (startIndex + foundedPayments ))
                if(index >= 0) {
                    founded = true
                    foundedPayments++;
                    stripe_refunds_index = index
                }
            }
            
            if(! founded) {
                module.exports.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS.push(payment)
            } else {
                module.exports.COUNT++
                module.exports.SUM += parseFloat(payment["Amount"])
            }
        })
    },
    getZohoBookStripeRefunds: async (spreadSheetId, sheetName) => {
        const zoho_book_refunds = await (await helpers.readWorkSheet(spreadSheetId, sheetName)).getRows()
        const zoho_book_stripe_refunds = zoho_book_refunds.filter((row, i) => row["Refund From Account"] === "Stripe AED")
        if(zoho_book_stripe_refunds.length === 0) {
            throw new Error("Empty Zoho Book stripe refunds")
        }
        return zoho_book_stripe_refunds
    },
    checkZohoBookRefunds: async (spreadSheetId, zohoBookRefundsSheetName, stripeRefundsSheetName) => {
        const zoho_book_stripe_refunds = helpers.sortRowsByColumn(
            await module.exports.getZohoBookStripeRefunds(spreadSheetId, zohoBookRefundsSheetName),
            "Reference Number"
        )
        module.exports.REFUNDS_DATA = zoho_book_stripe_refunds.map((refund) => {
            return {
                exch: refund["Exchange Rate"],
                eur: refund["Amount"],
                id: refund["Reference Number"]
            }
        })

        const stripe_refunds = helpers.sortRowsByColumn(
            await module.exports.getRefunds(spreadSheetId, stripeRefundsSheetName),
            "id"
        )

        const stripe_refunds_ids = stripe_refunds.map((refund, i) => refund["id"])

        let startIndex = undefined
        let foundedRefunds = 0
        zoho_book_stripe_refunds.forEach((refund, i) => {
            // Search the index of the first remaining stripe refund in the zoho book inside the stripe refunds
            let refund_id = refund["Reference Number"]
            let founded = false
            let stripe_refunds_index = undefined

            if(startIndex === undefined) {
                let index = stripe_refunds_ids.indexOf(refund_id)
                if(index >= 0) {
                    stripe_refunds_index = startIndex = index
                    founded = true
                    foundedRefunds++;
                }
            } else {
                let index = stripe_refunds_ids.indexOf(refund_id, (startIndex + foundedRefunds ))
                if(index >= 0) {
                    founded = true
                    foundedRefunds++;
                    stripe_refunds_index = index
                }
            }
            
            if(! founded) {
                module.exports.UNKNOWN_ZOHO_BOOK_REFUNDS.push(refund)
            } else {
                module.exports.COUNT++
                module.exports.SUM += parseFloat(refund["Amount"])
            }
        })
    },
    getRefundsStatus: async (spreadSheetId, zohoBookPaymentsSheetName, zohoBookRefundsSheetName, stripePaymentsSheetName, stripeRefundsSheetName) => {
        await module.exports.checkRemainingZohoBookPayments(spreadSheetId, zohoBookPaymentsSheetName, stripePaymentsSheetName, stripeRefundsSheetName)
        await module.exports.checkZohoBookRefunds(spreadSheetId, zohoBookRefundsSheetName, stripeRefundsSheetName)
        if(module.exports.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS.length === 0 && 
            module.exports.UNKNOWN_ZOHO_BOOK_REFUNDS.length === 0) {
            return "OK"
        }
        return "KO"
    },
}