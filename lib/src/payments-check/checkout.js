const helpers = require('../helpers')

let remaining_zoho_book_checkout_payments = []

module.exports = {
    UNFOUNDED_PAYMENTS: [],
    PAYMENTS_AMOUNT_ERRORS: [],
    PAYMENT_STATUS: "KO",
    COUNT: 0,
    SUM: 0,
    resetCachedData: () => {
        module.exports.UNFOUNDED_PAYMENTS = []
        module.exports.PAYMENTS_AMOUNT_ERRORS = []
        module.exports.PAYMENT_STATUS = "KO"
        remaining_zoho_book_checkout_payments = []
        module.exports.COUNT = 0
        module.exports.SUM = 0
    },
    getPayments: async (spreadSheetId, sheetName) => {
        const checkout_payments = await helpers.readWorkSheet(spreadSheetId, sheetName)
        const checkout_payments_rows = (await checkout_payments.getRows()).filter((payment, i) => payment["Action Type"] == "Capture")
        if(checkout_payments_rows.length === 0) {
            throw new Error("Empty Checkout payments")
        }
        return checkout_payments_rows
    },
    getZohoBookCheckoutPayments: async (spreadSheetId, sheetName) => {
        const zoho_book_payments = await helpers.readWorkSheet(spreadSheetId, sheetName)
        const zoho_book_payments_rows = helpers.sortRowsByColumn(await zoho_book_payments.getRows(), "Deposit To")
        const zoho_book_checkout_payments_rows = zoho_book_payments_rows.filter(payment => payment["Deposit To"] == "Checkout.com EUR")
        
        if(zoho_book_checkout_payments_rows.length === 0) {
            throw new Error("Empty Checkout payments in Zoho Book")
        }
        return zoho_book_checkout_payments_rows
    },
    matchCheckoutPaymentsWithZohoBook: async (spreadSheetId, checkoutPaymentSheetName, zohoBookSheetName, incrementCount) => {
        let checkout_payments = await module.exports.getPayments(spreadSheetId, checkoutPaymentSheetName)
        let zoho_book_checkout_payments = await module.exports.getZohoBookCheckoutPayments(spreadSheetId, zohoBookSheetName)

        // Sort checkout_payments by their "Action ID" column
        checkout_payments = helpers.sortRowsByColumn(checkout_payments, "Action ID")

        // Sort zoho_book_checkout_payments by their "CF.Payment Plat Action ID" column
        zoho_book_checkout_payments = helpers.sortRowsByColumn(zoho_book_checkout_payments, "CF.Payment Plat Action ID")

        const zoho_book_checkout_payments_ids = zoho_book_checkout_payments.map((row, i) => row["CF.Payment Plat Action ID"])
        let startIndex = undefined
        let foundedPayments = 0
        const zoho_book_checkout_payments_have_matched_indexes = []
        checkout_payments.forEach((payment, i) => {
            // Search the index of the first stripe payment in the zoho book payment
            let payment_id = payment["Action ID"]
            let founded = false
            let zoho_book_index = undefined

            if(startIndex === undefined) {
                let index = zoho_book_checkout_payments_ids.indexOf(payment_id)
                if(index >= 0) {
                    zoho_book_index = startIndex = index
                    founded = true
                    foundedPayments++;
                }
            } else {
                let index = zoho_book_checkout_payments_ids.indexOf(payment_id, (startIndex + foundedPayments ))
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
                    module.exports.SUM += parseFloat(payment["Amount"])
                }
                zoho_book_checkout_payments_have_matched_indexes.push(zoho_book_index)
                // Check payment amount matching
                let matched_zoho_book_payment = zoho_book_checkout_payments[zoho_book_index]
                if(parseFloat(payment["Amount"]).toFixed(2) != parseFloat(matched_zoho_book_payment["Amount"]).toFixed(2)) {
                    module.exports.PAYMENTS_AMOUNT_ERRORS.push(payment)
                }
            }
        })

        remaining_zoho_book_checkout_payments = zoho_book_checkout_payments.filter((payment, i) => ! zoho_book_checkout_payments_have_matched_indexes.includes(i))

        if(module.exports.UNFOUNDED_PAYMENTS.length === 0 && module.exports.PAYMENTS_AMOUNT_ERRORS.length === 0) {
            module.exports.PAYMENT_STATUS = "OK"
        }
    },
    getRemainingZohoBookPayments: async (spreadSheetId, zohoBookPaymentsSheetName, stripePaymentsSheetName) => {
        await module.exports.matchCheckoutPaymentsWithZohoBook(spreadSheetId, stripePaymentsSheetName, zohoBookPaymentsSheetName, true)
        return remaining_zoho_book_checkout_payments
    },
}