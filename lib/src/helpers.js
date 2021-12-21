const { GoogleSpreadsheet } = require('google-spreadsheet')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const key = require(path.resolve(__dirname + "/../.." + process.env.GOOGLE_API_KEY_PATH))


module.exports = {
    sortRowsByColumn: (rows, column, order) => {
        order = (order === undefined) ? "ASC" : order
        return rows.sort((a, b) => {
            if(a[column] < b[column]) {
                return  (order == "ASC") ? -1 : 1;
            } else if(a[column] > b[column]) {
                return (order == "ASC") ? 1 : -1;
            } else if(a[column] == b[column]) {
                return 0
            }
        })
    },
    readWorkSheet: async (spreadSheetId, sheetName) => {
        const doc = new GoogleSpreadsheet(spreadSheetId);
        await doc.useServiceAccountAuth(key);
        await doc.loadInfo(); // loads sheets
        return doc.sheetsByTitle[sheetName]
    }
}