const dotenv = require('dotenv')

dotenv.config()

const stripe = require('stripe')(process.env.STRIPE_API_KEY)

module.exports = {
    getCharge: async (chargeID) => {
        try {
            const charge = await stripe.charges.retrieve(chargeID)
            return charge
        } catch(err) {
            throw new Error('This charge ' + chargeID + ' not exists in Stripe')
        }
    },
    getBalanceTransaction: async (transactionID) => {
        try {
            const bt = await stripe.balanceTransactions.retrieve(transactionID)
            return bt
        } catch(err) {
            throw new Error('This balance transaction ' + transactionID + ' not exists in Stripe')
        }
    }
}