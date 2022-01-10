const stripe_api = require('../stripe-api')

module.exports = {
    TOO_MUCH_DIFFTRANS: [],
    TOTAL_DIFFTRANS: undefined,
    resetCachedData: () => {
        module.exports.TOO_MUCH_DIFFTRANS = []
        module.exports.TOTAL_DIFFTRANS = undefined
    },
    diffTrans: async (ZBexchRate, ZBEur, ZBchargeId) => {

        try {
        
            var chObj = await stripe_api.getCharge(ZBchargeId);
            var txnObj = undefined;
    
            var list = chObj.refunds.data;
    
            for (const element of list) {
                if (element.charge == ZBchargeId)
                {
                    txnObj = await stripe_api.getBalanceTransaction(element.balance_transaction);
                }
            }
    
            if (txnObj === undefined)
            {
                throw new Error("This refund not exists in Stripe : " + ZBchargeId)
            }

            if(txnObj.currency.toLowerCase() !== "aed") {
                throw new Error("The stripe transaction of this charge " + ZBchargeId + " is not in AED. Unable to compute difference !")
            }
    
            var zbValaed = ZBEur * ZBexchRate;
            const zbTransaction = (Math.round(zbValaed * 100)/100).toFixed(2)
            const stripeTransaction = Math.abs(txnObj.net / 100)
    
            return {
                diffTrans: (Math.round((stripeTransaction - zbTransaction) * 100)/100).toFixed(2),
                zoho: zbTransaction,
                stripe: stripeTransaction.toFixed(2)
            }
        } catch (error) {
            console.log('cannot retrieve invoice', error);
        }
    },
    checkDiff: async (zb_refunds) => {
        for(const refund of zb_refunds) {
            const {diffTrans, zoho, stripe} = await module.exports.diffTrans(refund.exch, refund.eur, refund.id)
            if(parseFloat(diffTrans) >= 0.01) {
                module.exports.TOO_MUCH_DIFFTRANS.push({
                    "Stripe charge ID": refund.id,
                    "Zoho transaction": zoho,
                    "Stripe transaction": stripe,
                    "Difference of transaction": diffTrans
                })
            }
            if(! module.exports.TOTAL_DIFFTRANS) {
                module.exports.TOTAL_DIFFTRANS = 0
            }
            module.exports.TOTAL_DIFFTRANS = parseFloat((module.exports.TOTAL_DIFFTRANS + parseFloat(diffTrans)).toFixed(2))
        }
    }
}