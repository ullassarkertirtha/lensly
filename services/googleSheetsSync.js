const { google } = require('googleapis')

const SHEET_CACHE = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function indexToColumn(index) {
    let col = ''
    while (index >= 0) {
        col = String.fromCharCode(65 + (index % 26)) + col
        index = Math.floor(index / 26) - 1
    }
    return col
}

function getAuth(readonly = true) {
    return new google.auth.GoogleAuth({
        credentials: {
            client_email: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').replace(/^["']|["']$/g, '').trim(),
            private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim(),
        },
        scopes: [
            readonly
                ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
                : 'https://www.googleapis.com/auth/spreadsheets',
        ],
    })
}

async function getSheets(readonly = true) {
    const auth = getAuth(readonly)
    return google.sheets({ version: 'v4', auth })
}

function getSheetId() {
    return (process.env.GOOGLE_SHEET_ID || '').replace(/^["']|["']$/g, '').trim()
}

// Reads a full tab and returns it as an array of objects, keyed by header row
async function getTabData(tabName, forceLive = false) {
    const now = Date.now()
    if (!forceLive && SHEET_CACHE[tabName] && (now - SHEET_CACHE[tabName].timestamp < CACHE_TTL)) {
        return SHEET_CACHE[tabName].data
    }

    const sheets = await getSheets(true)
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: getSheetId(),
        range: tabName,
    })

    const [headers, ...rows] = response.data.values || []
    if (!headers) return []

    const data = rows.map(row =>
        headers.reduce((obj, header, i) => {
            obj[header] = row[i] ?? ''
            return obj
        }, {})
    )

    SHEET_CACHE[tabName] = { data, timestamp: now }
    return data
}

// Appends a new row to a tab. rowObject keys must match the tab's header names.
async function appendRow(tabName, rowObject) {
    const sheets = await getSheets(false)
    const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: getSheetId(),
        range: `${tabName}!1:1`,
    })
    const headers = headerResponse.data.values[0]
    const row = headers.map(h => rowObject[h] ?? '')

    await sheets.spreadsheets.values.append({
        spreadsheetId: getSheetId(),
        range: tabName,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
    })

    delete SHEET_CACHE[tabName]
}

// Updates specific cells for a row matched by a key column (e.g. order_id, consultation_id)
async function updateRowByKey(tabName, keyColumn, keyValue, updates) {
    const sheets = await getSheets(false)
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: getSheetId(),
        range: tabName,
    })
    const [headers, ...rows] = response.data.values
    const keyIdx = headers.indexOf(keyColumn)
    const rowIndex = rows.findIndex(r => r[keyIdx] === keyValue)
    if (rowIndex === -1) throw new Error(`${keyValue} not found in ${tabName}`)

    const requests = Object.entries(updates).map(([col, value]) => {
        const colIdx = headers.indexOf(col)
        return {
            range: `${tabName}!${indexToColumn(colIdx)}${rowIndex + 2}`,
            values: [[value]],
        }
    })

    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: getSheetId(),
        requestBody: { valueInputOption: 'RAW', data: requests },
    })

    delete SHEET_CACHE[tabName]
}

// Batch stock decrement
async function decrementStock(cartItems) {
    const sheets = await getSheets(false)
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: getSheetId(),
        range: 'stock',
    })
    const [headers, ...rows] = response.data.values
    const folderIdx = headers.indexOf('folder_id')
    const stockIdx = headers.indexOf('stock')

    const updates = []
    for (const item of cartItems) {
        rows.forEach((row, i) => {
            if (row[folderIdx] === item.folder_id) {
                const newStock = Math.max(0, Number(row[stockIdx]) - item.qty)
                updates.push({
                    range: `stock!${indexToColumn(stockIdx)}${i + 2}`,
                    values: [[newStock]],
                })
            }
        })
    }

    if (updates.length) {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: getSheetId(),
            requestBody: { valueInputOption: 'RAW', data: updates },
        })

        delete SHEET_CACHE['stock']
    }
}

module.exports = { getTabData, appendRow, updateRowByKey, decrementStock }
