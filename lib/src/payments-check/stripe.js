const helpers = require('../helpers')

let remaining_zoho_book_stripe_payments = []

module.exports = {
    UNFOUNDED_PAYMENTS: [],
    PAYMENTS_AMOUNT_ERRORS: [],
    PAYMENT_STATUS: "KO",
    COUNT: 0,
    SUM: 0,
    PAYMENTS_DATA: [],
    resetCachedData: () => {
        module.exports.UNFOUNDED_PAYMENTS = []
        module.exports.PAYMENTS_AMOUNT_ERRORS = []
        module.exports.PAYMENT_STATUS = "KO"
        remaining_zoho_book_stripe_payments = []
        module.exports.COUNT = 0
        module.exports.SUM = 0
        module.exports.PAYMENTS_DATA = []
    },
    getPayments: async (spreadSheetId, sheetName) => {
        const stripe_payments = await helpers.readWorkSheet(spreadSheetId, sheetName)
        const stripe_payments_rows = await stripe_payments.getRows()
        if(stripe_payments_rows.length === 0) {
            throw new Error("Empty Stripe payments")
        }
        return stripe_payments_rows
    },
    getZohoBookStripePayments: async (spreadSheetId, sheetName) => {
        const zoho_book_payments = await helpers.readWorkSheet(spreadSheetId, sheetName)
        
        const zoho_book_payments_rows = helpers.sortRowsByColumn(await zoho_book_payments.getRows(), "CF.Payment Plat Payment Id")
        const zoho_book_stripe_payments_rows = zoho_book_payments_rows.filter(payment => payment["Deposit To"] == "Stripe AED")
        
        if(zoho_book_stripe_payments_rows.length === 0) {
            throw new Error("Empty Stripe payments in Zoho Book")
        }
        return zoho_book_stripe_payments_rows
    },
    matchStripePaymentsWithZohoBook: async (spreadSheetId, stripePayementSheetName, ZohoBookSheetName, incrementCount) => {
        let stripe_payments = await module.exports.getPayments(spreadSheetId, stripePayementSheetName)
        let zoho_book_stripe_payments = await module.exports.getZohoBookStripePayments(spreadSheetId, ZohoBookSheetName)
        module.exports.PAYMENTS_DATA = zoho_book_stripe_payments.map((payment) => {
            return {
                exch: payment["Exchange Rate"],
                bank: payment["Bank Charges"],
                eur: payment["Amount"],
                id: payment["CF.Payment Plat Payment Id"],
                aed: payment["CF.Amount in AED"],
                date: payment["Date"]
            }
        })

        // Sort stripe_payments by their "id" column
        stripe_payments = helpers.sortRowsByColumn(stripe_payments, "id")

        // Sort zoho_book_stripe_payments by their "CF.Payment Plat Payment Id" column
        zoho_book_stripe_payments = helpers.sortRowsByColumn(zoho_book_stripe_payments, "CF.Payment Plat Payment Id")

        const zoho_book_stripe_payments_ids = zoho_book_stripe_payments.map((row, i) => row["CF.Payment Plat Payment Id"])
        let startIndex = undefined
        let foundedPayments = 0
        const zoho_book_stripe_payments_have_matched_indexes = []
        stripe_payments.forEach((payment, i) => {
            // Search the index of the first stripe payment in the zoho book payment
            let payment_id = payment.id
            let founded = false
            let zoho_book_index = undefined

            if(startIndex === undefined) {
                let index = zoho_book_stripe_payments_ids.indexOf(payment_id)
                if(index >= 0) {
                    zoho_book_index = startIndex = index
                    founded = true
                    foundedPayments++;
                }
            } else {
                let index = zoho_book_stripe_payments_ids.indexOf(payment_id, (startIndex + foundedPayments ))
                if(index >= 0) {
                    founded = true
                    foundedPayments++;
                    zoho_book_index = index
                }
            }
            
            if(! founded) {
                module.exports.UNFOUNDED_PAYMENTS.push(payment)
            } else {
                if(incrementCount) {
                    module.exports.COUNT++
                    module.exports.SUM += parseFloat(payment["amount"])
                }
                zoho_book_stripe_payments_have_matched_indexes.push(zoho_book_index)
                // Check payment amount matching
                let matched_zoho_book_payment = zoho_book_stripe_payments[zoho_book_index]
                if(parseFloat(payment.amount).toFixed(2) != parseFloat(matched_zoho_book_payment["Amount"]).toFixed(2)) {
                    module.exports.PAYMENTS_AMOUNT_ERRORS.push(payment)
                }
            }
        })

        remaining_zoho_book_stripe_payments = zoho_book_stripe_payments.filter((payment, i) => ! zoho_book_stripe_payments_have_matched_indexes.includes(i))

        if(module.exports.UNFOUNDED_PAYMENTS.length === 0 && module.exports.PAYMENTS_AMOUNT_ERRORS.length === 0) {
            module.exports.PAYMENT_STATUS = "OK"
        }
    },
    getRemainingZohoBookPayments: async (spreadSheetId, zohoBookPaymentsSheetName, stripePaymentsSheetName) => {
        await module.exports.matchStripePaymentsWithZohoBook(spreadSheetId, stripePaymentsSheetName, zohoBookPaymentsSheetName, true)
        return remaining_zoho_book_stripe_payments
    }
}