const stripe_api = require('../stripe-api')

module.exports = {
    TOO_MUCH_DIFFTRANS: [],
    TOTAL_DIFFTRANS: undefined,
    START_DATE: undefined,
    END_DATE: undefined,
    resetCachedData: () => {
        module.exports.TOO_MUCH_DIFFTRANS = []
        module.exports.TOTAL_DIFFTRANS = undefined
        module.exports.START_DATE = undefined
        module.exports.END_DATE = undefined
    },
    diffTrans: async (ZBamountAed, ZBbankChargeEur, ZBexchRate, ZBchargeId) => {

        var chObj = await stripe_api.getCharge(ZBchargeId);
        var txnObj = await stripe_api.getBalanceTransaction(chObj.balance_transaction);

        var zbTransaction = (ZBamountAed.toFixed(2) - (ZBbankChargeEur * ZBexchRate)).toFixed(2);
        var stripeTransaction = (txnObj.net / 100).toFixed(2)

        if(txnObj.currency.toLowerCase() !== "aed") {
            throw new Error("The currency of the stripe transaction of this charge " + 
            ZBchargeId + " is not AED. Unable to calculate the difference of money not in the same currency !")
        }
        return {
            diffTrans: (stripeTransaction - zbTransaction).toFixed(2),
            zoho: zbTransaction,
            stripe: stripeTransaction
        }
    },
    checkDiff: async (zb_payments) => {
        for(const payment of zb_payments) {
            const {diffTrans, zoho, stripe} = await module.exports.diffTrans(payment.aed, payment.bank, payment.exch, payment.id)
            if(parseFloat(diffTrans) >= 0.04) {
                module.exports.TOO_MUCH_DIFFTRANS.push({
                    "Stripe charge ID": payment.id,
                    "Zoho transaction": zoho,
                    "Stripe transaction": stripe,
                    "Difference of transaction": diffTrans
                })
            }
            if(! module.exports.TOTAL_DIFFTRANS) {
                module.exports.TOTAL_DIFFTRANS = 0
            }
            module.exports.TOTAL_DIFFTRANS += parseFloat(diffTrans)

            let payment_date = new Date(payment.date)
            if(! module.exports.START_DATE) {
                module.exports.START_DATE = payment_date
            } else {
                if(payment_date < module.exports.START_DATE) {
                    module.exports.START_DATE = payment_date
                }
            }

            if(! module.exports.END_DATE) {
                module.exports.END_DATE = payment_date
            } else {
                if(payment_date > module.exports.END_DATE) {
                    module.exports.END_DATE = payment_date
                }
            }
        }
        if(module.exports.START_DATE.getMonth() !== module.exports.END_DATE.getMonth()) {
            throw new Error("The data analyzed exceed one month. Start date on " + module.exports.START_DATE.toDateString() + " and end date on " + module.exports.END_DATE.toDateString())
        }
    }
}