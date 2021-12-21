#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const stripe_payments = require('../lib/src/payments-check/stripe')
const checkout_payments = require('../lib/src/payments-check/checkout')
const stripe_refunds = require('../lib/src/refunds-check/stripe')
const checkout_refunds = require('../lib/src/refunds-check/checkout')

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
    }
}

