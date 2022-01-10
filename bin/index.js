#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const axios = require('axios')

const stripe_payments = require('../lib/src/payments-check/stripe')
const checkout_payments = require('../lib/src/payments-check/checkout')
const stripe_refunds = require('../lib/src/refunds-check/stripe')
const checkout_refunds = require('../lib/src/refunds-check/checkout')
const payment_adjustment = require('../lib/src/adjustment/payments')
const refund_adjustment = require('../lib/src/adjustment/refunds')

const csv_writer = require('csv-writer')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
    .command(
        "check", 
        "check monthly financial statement of the company", 
        (yargs, helpOrVersionSet) => {
            return yargs.options({
                "s": {
                    alias: "spreadSheetId",
                    describe: "The id of the google spreadsheet that holds data",
                    type: "string",
                    demandOption: true
                },
                "n": {
                    alias: "names",
                    describe: `Names of sheets that compose the spreadsheet in the order
                                <zoho book payments> <zoho book refunds> <stripe payments> <stripe refunds> <checkout payments> <checkout refunds>`,
                    type: "array",
                    default: ["zb-payments", "zb-refunds", "stripe-payments", "stripe-refunds", "checkout", "checkout"]
                },
                "p": {
                    alias: "payment-output",
                    describe: "The file to export the stripe payments data",
                    type: "string"
                }, 
                "r": {
                    alias: "refund-output",
                    describe: "The file to export the stripe refunds data",
                    type: "string"
                }, 
                "d": {
                    alias: "check-differences",
                    describe: "perform differences in payments and refunds transactions between calculated data by Zoho Book and Stripe",
                    type: "boolean"
                },
                "a": {
                    alias: "adjust",
                    describe: "Adjust Zoho Book after checking difference of payment's transactions",
                    type: "boolean"
                }
            })
        },
        argv => check(argv)
    )
    .command(
        "reset", 
        "reset all cached data stored after a check", 
        {},
        argv => {
            stripe_payments.resetCachedData()
            checkout_payments.resetCachedData()
            stripe_refunds.resetCachedData()
            checkout_refunds.resetCachedData()
        }
    )
    .argv;



async function check(argv) {
    const spread_sheet_ID = argv.s
    let zoho_book_payment_sheet_name, zoho_book_refund_sheet_name,
        stripe_payment_sheet_name, stripe_refund_sheet_name,
        checkout_payment_sheet_name, checkout_refund_sheet_name;

    zoho_book_payment_sheet_name = argv.n[0]
    zoho_book_refund_sheet_name = argv.n[1]
    stripe_payment_sheet_name = argv.n[2]
    stripe_refund_sheet_name = argv.n[3]
    checkout_payment_sheet_name = argv.n[4]
    checkout_refund_sheet_name = argv.n[5]

    await stripe_payments.matchStripePaymentsWithZohoBook(spread_sheet_ID, stripe_payment_sheet_name, zoho_book_payment_sheet_name)
    await checkout_payments.matchCheckoutPaymentsWithZohoBook(spread_sheet_ID, checkout_payment_sheet_name, zoho_book_payment_sheet_name)
    if(
        ! (
            stripe_payments.PAYMENT_STATUS === "OK" &&
        checkout_payments.PAYMENT_STATUS === "OK" &&
        (await stripe_refunds.getRefundsStatus(spread_sheet_ID, zoho_book_payment_sheet_name, zoho_book_refund_sheet_name, stripe_payment_sheet_name, stripe_refund_sheet_name)) === "OK" &&
        (await checkout_refunds.getRefundsStatus(spread_sheet_ID, zoho_book_payment_sheet_name, zoho_book_refund_sheet_name, checkout_payment_sheet_name, checkout_refund_sheet_name)) === "OK"
        )
    ) {
        if(stripe_payments.UNFOUNDED_PAYMENTS.length > 0) {
            console.log("--------------ID des paiements STRIPE qui ne sont pas trouvés dans Zoho Book -----------------")
            console.log(
                "[" +
                stripe_payments.UNFOUNDED_PAYMENTS.map((payment) => payment.id).join(", ") + 
                "]"
            )
        }
        if(stripe_payments.PAYMENTS_AMOUNT_ERRORS.length > 0) {
            console.log("--------------ID des paiements STRIPE dont les montants diffèrent avec Zoho Book -----------------")
            console.log(
                "[" +
                stripe_payments.PAYMENTS_AMOUNT_ERRORS.map((payment) => payment.id).join(", ") + 
                "]"
            )
        }
        if(stripe_refunds.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS.length > 0) {
            console.log("--------------ID des paiements STRIPE dans Zoho Book qui ne sont pas trouvés dans les remboursementes STRIPE -----------------")
            console.log(
                "[" +
                stripe_refunds.UNKNOWN_ZOHO_BOOK_STRIPE_PAYMENTS.map((payment) => payment["CF.Payment Plat Payment Id"]).join(", ") + 
                "]"
            )
        }
        if(stripe_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.length > 0) {
            console.log("--------------ID des remboursements STRIPE dans Zoho Book qui ne sont pas trouvés dans les remboursementes STRIPE -----------------")
            console.log(
                "[" +
                stripe_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.map((refund) => refund["Reference Number"]).join(", ") + 
                "]"
            )
        }


        if(checkout_payments.UNFOUNDED_PAYMENTS.length > 0) {
            console.log("-------------- ID des paiements CHECKOUT qui ne sont pas trouvés dans Zoho Book -----------------")
            console.log(
                "[" +
                checkout_payments.UNFOUNDED_PAYMENTS.map((payment) => payment["Action ID"]).join(", ") + 
                "]"
            )
        }
        if(checkout_payments.PAYMENTS_AMOUNT_ERRORS.length > 0) {
            console.log("--------------ID des paiements CHECKOUT dont les montants diffèrent avec Zoho Book -----------------")
            console.log(
                "[" +
                stripe_payments.PAYMENTS_AMOUNT_ERRORS.map((payment) => payment["Action ID"]).join(", ") + 
                "]"
            )
        }
        if(checkout_refunds.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS.length > 0) {
            console.log("--------------ID des paiements CHECKOUT dans Zoho Book qui ne sont pas trouvés dans les remboursementes CHECKOUT -----------------")
            console.log(
                "[" +
                checkout_refunds.UNKNOWN_ZOHO_BOOK_CHECKOUT_PAYMENTS.map((payment) => payment["CF.Payment Plat Action ID"]).join(", ") + 
                "]"
            )
        }
        if(checkout_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.length > 0) {
            console.log("--------------ID des remboursements CHECKOUT dans Zoho Book qui ne sont pas trouvés dans les remboursementes CHECKOUT -----------------")
            console.log(
                "[" +
                checkout_refunds.UNKNOWN_ZOHO_BOOK_REFUNDS.map((refund) => refund["Description"]).join(", ") + 
                "]"
            )
        }
    } else {
        const payments_stats = {
            Nombre: {
                Stripe: stripe_payments.COUNT,
                Checkout: checkout_payments.COUNT
            },
            Somme: {
                Stripe: stripe_payments.SUM.toFixed(2) + " €",
                Checkout: checkout_payments.SUM.toFixed(2) + " €"
            }
        }
        console.log("------------- Statistiques sur les paiements ----------------")
        console.table(payments_stats)
        console.log("\n\n")

        const refunds_stats = {
            Nombre: {
                Stripe: stripe_refunds.COUNT,
                Checkout: checkout_refunds.COUNT
            },
            Somme: {
                Stripe: stripe_refunds.SUM.toFixed(2) + " €",
                Checkout: checkout_refunds.SUM.toFixed(2) + " €"
            }
        }
        console.log("------------- Statistiques sur les remboursements ----------------")
        console.table(refunds_stats)
        console.log("\n\n")

        const createCsvWriter = csv_writer.createObjectCsvWriter
        if(argv.p) {
            const file_path = path.resolve(argv.p.trim())
            if(path.extname(file_path) === ".csv") {
                const csvWriter = createCsvWriter({
                    path: file_path,
                    header: [
                        {id: 'id', title: 'Payment id'},
                        {id: 'exch', title: 'Exchange Rate'},
                        {id: 'bank', title: 'Bank Charges'},
                        {id: 'eur', title: 'Amount'},
                        {id: 'aed', title: 'Amount in AED'},
                    ]
                });
                const records = stripe_payments.PAYMENTS_DATA
                csvWriter.writeRecords(records)
                .then(() => {
                    console.log("------ EXPORTING STRIPE PAYMENTS DATA DONE ------------")
                })
            } else if(path.extname(file_path) === ".json"){
                const data = JSON.stringify(stripe_payments.PAYMENTS_DATA)
                fs.writeFile(file_path, data, err => {
                    if(err) {
                        console.error(err)
                        return
                    }
                    console.log("----------- EXPORTING STRIPE PAYMENTS DATA DONE -------------")
                })
            } else if(path.extname(file_path) === "") {
                throw new Error("Missing data format ! Please give the data format by providing it in the file extension.")
            } else {
                throw new Error("Not supported data format. CSV and JSON are the only supported data format.")
            }
        }
        if(argv.r) {
            const file_path = path.resolve(argv.r.trim())
            if(path.extname(file_path) === ".csv") {
                const csvWriter = createCsvWriter({
                    path: file_path,
                    header: [
                        {id: 'id', title: 'Payment id'},
                        {id: 'exch', title: 'Exchange Rate'},
                        {id: 'eur', title: 'Amount'},
                    ]
                });
                const records = stripe_refunds.REFUNDS_DATA
                csvWriter.writeRecords(records)
                .then(() => {
                    console.log("------ EXPORTING STRIPE REFUNDS DATA DONE ------------")
                })
            } else if(path.extname(file_path) === ".json"){
                const data = JSON.stringify(stripe_refunds.REFUNDS_DATA)
                fs.writeFile(file_path, data, err => {
                    if(err) {
                        console.error(err)
                        return
                    }
                    console.log("----------- EXPORTING STRIPE REFUNDS DATA DONE -------------")
                })
            } else if(path.extname(file_path) === "") {
                throw new Error("Missing data format ! Please give the data format by providing it in the file extension.")
            } else {
                throw new Error("Not supported data format. CSV and JSON are the only supported data format.")
            }
        }

        // Checking transaction's differences if the option is given
        if(argv.d) {
            await checkDifference()
        }

        if(argv.a) {
            if(!argv.d) {
                await checkDifference()
            }
            
            const last_day_of_month = new Date(
                payment_adjustment.END_DATE.getFullYear(),
                payment_adjustment.END_DATE.getMonth() === 11 ? 11 : payment_adjustment.END_DATE.getMonth() + 1,
                payment_adjustment.END_DATE.getMonth() === 11 ? 31 : 0
            )

            if(payment_adjustment.TOTAL_DIFFTRANS > 0) {
                const bankTransaction = {
                    "amount": payment_adjustment.TOTAL_DIFFTRANS.toFixed(2),
                    "date": "" + last_day_of_month.getFullYear() + "-" + formatInteger(last_day_of_month.getMonth() + 1, 2) + "-" + formatInteger(last_day_of_month.getDate(), 2),  
                    "description":"",
                    "from_account_id":"2332079000000000409",
                    "reference_number": "STRIPE-PAYMENTS-ADJUSTEMENT-" + last_day_of_month.getFullYear() + formatInteger(last_day_of_month.getMonth() + 1, 2),
                    "payment_mode":"Bank Remittance",
                    "to_account_id":"2332079000000090017",
                    "transaction_type":"expense_refund",
                    "is_inclusive_tax":false,
                    "tax_treatment":"out_of_scope"
                }

                // Sending payload
                const url = "https://books.zoho.com/api/v3/banktransactions?organization_id=721482724"
                // sendPayload(
                //     bankTransaction, 
                //     url,
                //     {
                //         success: "*********** Sending payload to " + url + " succeded ! ************",
                //         error: "*********** Sending payload to " + url + " has failed ! ************"
                //     }
                // )
                console.log(bankTransaction)
            } else if(payment_adjustment.TOTAL_DIFFTRANS < 0) {
                const bankTransaction = {
                    "account_id": 2332079000000000409,
                    "paid_through_account_id":"2332079000000090017",
                    "date": "" + last_day_of_month.getFullYear() + "-" + formatInteger(last_day_of_month.getMonth() + 1, 2) + "-" + formatInteger(last_day_of_month.getDate(), 2),  
                    "amount": parseFloat(payment_adjustment.TOTAL_DIFFTRANS.toFixed(2)), 
                    "tax_treatment":"out_of_scope",
                    "reference_number":"STRIPE-PAYMENTS-ADJUSTEMENT-" + last_day_of_month.getFullYear() + formatInteger(last_day_of_month.getMonth() + 1, 2)
                }

                // Sending payload
                const url = "https://books.zoho.com/api/v3/expenses?organization_id=721482724"
                // sendPayload(
                //     bankTransaction, 
                //     url,
                //     {
                //         success: "*********** Sending payload to " + url + " succeded ! ************",
                //         error: "*********** Sending payload to " + url + " has failed ! ************"
                //     }
                // )
                console.log(bankTransaction)
            }
        }
    }
}

async function checkDifference() {
    await payment_adjustment.checkDiff(stripe_payments.PAYMENTS_DATA)
    if(payment_adjustment.TOO_MUCH_DIFFTRANS.length > 0) {
        console.log("----------- Les paiements dont la différence de transaction entre la valeur dans ZohoBook et Stripe est supérieure à 0.04 ------------------")
        console.table(payment_adjustment.TOO_MUCH_DIFFTRANS)
    }
    console.log("---------------- Somme des différences de toutes les transactions de paiements -----------------------")
    console.log("TOTAL : " + payment_adjustment.TOTAL_DIFFTRANS.toFixed(2))

    await refund_adjustment.checkDiff(stripe_refunds.REFUNDS_DATA)
    if(refund_adjustment.TOO_MUCH_DIFFTRANS.length > 0) {
        console.log("----------- Les paiements dont la différence de transaction entre la valeur dans ZohoBook et Stripe est supérieure à 0.04 ------------------")
        console.table(refund_adjustment.TOO_MUCH_DIFFTRANS)
    }
    console.log("---------------- Somme des différences de toutes les transactions de remboursements -----------------------")
    console.log("TOTAL : " + refund_adjustment.TOTAL_DIFFTRANS.toFixed(2))
}


function formatInteger(number, length) {
    let r = "" + number
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

function sendPayload(payload, url, messages) {
    axios.post(url, payload)
    .then(res => {
        if(parseInt(parseInt(res.status)/100) === 2) {
            console.log(messages.success)
        } else if(parseInt(parseInt(res.status)/100) === 4 || parseInt(parseInt(res.status)/100) === 5) {
            console.error(messages.error)
        }
    })
}

