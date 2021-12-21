const helpers = require('../helpers')
const checkout_payments = require("../payments-check/checkout")

module.exports = {
    UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS: [],
    UNKNOWN_ZOHO_BOOK_REFUNDS: [],
    COUNT: 0,
    SUM: 0,
    resetCachedData: () => {
        module.exports.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS = []
        module.exports.UNKNOWN_ZOHO_BOOK_REFUNDS = []
        module.exports.COUNT = 0
        module.exports.SUM = 0
    },
    getRefunds: async (spreadSheetId, sheetName) => {
        const checkout_refunds = await helpers.readWorkSheet(spreadSheetId, sheetName)
        const checkout_refunds_rows = await checkout_refunds.getRows()
        if(checkout_refunds_rows.length === 0) {
            throw new Error("Empty Checkout refunds")
        }
        return checkout_refunds_rows.filter((refund, i) => refund["Action Type"] === "Refund")
    },
    checkRemainingZohoBookPayments: async (spreadSheetId, zohoBookPaymentsSheetName, checkoutPaymentsSheetName, checkoutRefundsSheetName) => {
        const remaining_zoho_book_checkout_payments = helpers.sortRowsByColumn(
            await checkout_payments.getRemainingZohoBookPayments(
                spreadSheetId, 
                zohoBookPaymentsSheetName, 
                checkoutPaymentsSheetName
            ), 
            "CF.Payment Plat Action ID"
        )
        const checkout_refunds = helpers.sortRowsByColumn(
            await module.exports.getRefunds(spreadSheetId, checkoutRefundsSheetName), 
            "Action ID"
        )
        const checkout_refunds_ids = checkout_refunds.map((refund, i) => refund["Action ID"])

        let startIndex = undefined
        let foundedPayments = 0
        remaining_zoho_book_checkout_payments.forEach((payment, i) => {
            // Search the index of the first remaining stripe payment in the zoho book inside the stripe refunds
            let payment_id = payment["CF.Payment Plat Action ID"]
            let founded = false
            let checkout_refunds_index = undefined

            if(startIndex === undefined) {
                let index = checkout_refunds_ids.indexOf(payment_id)
                if(index >= 0) {
                    checkout_refunds_index = startIndex = index
                    founded = true
                    foundedPayments++;
                }
            } else {
                let index = checkout_refunds_ids.indexOf(payment_id, (startIndex + foundedPayments ))
                if(index >= 0) {
                    founded = true
                    foundedPayments++;
                    checkout_refunds_index = index
                }
            }
            
            if(! founded) {
                module.exports.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS.push(payment)
            } else {
                module.exports.COUNT++
                module.exports.SUM += parseFloat(payment["Amount"])
            }
        })
    },
    getZohoBookCheckoutRefunds: async (spreadSheetId, sheetName) => {
        const zoho_book_refunds = await (await helpers.readWorkSheet(spreadSheetId, sheetName)).getRows()
        const zoho_book_checkout_refunds = zoho_book_refunds.filter((row, i) => row["Refund From Account"] === "Checkout.com EUR")
        if(zoho_book_checkout_refunds.length === 0) {
            throw new Error("Empty Zoho Book checkout refunds")
        }
        return zoho_book_checkout_refunds
    },
    checkZohoBookRefunds: async (spreadSheetId, zohoBookRefundsSheetName, checkoutRefundsSheetName) => {
        const zoho_book_checkout_refunds = helpers.sortRowsByColumn(
            await module.exports.getZohoBookCheckoutRefunds(spreadSheetId, zohoBookRefundsSheetName),
            "Description"
        )
        const checkout_refunds = helpers.sortRowsByColumn(
            await module.exports.getRefunds(spreadSheetId, checkoutRefundsSheetName),
            "Action ID"
        )

        const checkout_refunds_ids = checkout_refunds.map((refund, i) => refund["Action ID"])

        let startIndex = undefined
        let foundedRefunds = 0
        zoho_book_checkout_refunds.forEach((refund, i) => {
            // Search the index of the first remaining stripe refund in the zoho book inside the stripe refunds
            let refund_id = refund["Description"]
            let founded = false
            let checkout_refunds_index = undefined

            if(startIndex === undefined) {
                let index = checkout_refunds_ids.indexOf(refund_id)
                if(index >= 0) {
                    checkout_refunds_index = startIndex = index
                    founded = true
                    foundedRefunds++;
                }
            } else {
                let index = checkout_refunds_ids.indexOf(refund_id, (startIndex + foundedRefunds ))
                if(index >= 0) {
                    founded = true
                    foundedRefunds++;
                    checkout_refunds_index = index
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
    getRefundsStatus: async (spreadSheetId, zohoBookPaymentsSheetName, zohoBookRefundsSheetName, checkoutPaymentsSheetName, checkoutRefundsSheetName) => {
        await module.exports.checkRemainingZohoBookPayments(spreadSheetId, zohoBookPaymentsSheetName, checkoutPaymentsSheetName, checkoutRefundsSheetName)
        await module.exports.checkZohoBookRefunds(spreadSheetId, zohoBookRefundsSheetName, checkoutRefundsSheetName)
        if(module.exports.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS.length === 0 && 
            module.exports.UNKNOWN_ZOHO_BOOK_REFUNDS.length === 0) {
            return "OK"
        }
        return "KO"
    }
}