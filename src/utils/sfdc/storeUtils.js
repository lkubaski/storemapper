const MODULE = "storeUtils"
const logUtils = require('../logUtils')
const curlUtils = require('./curlUtils')
const configUtils = require('../configUtils')

let _stores = []

async function init() {
    await logUtils.debug(`>> ${MODULE}.init`)
    _stores = await _getAll()
    await logUtils.debug(`<< ${MODULE}.init`)
}

module.exports.init = init

async function getDisplayable() {
    await logUtils.debug(`>> ${MODULE}.getDisplayable`)
    let result = []
    _stores.forEach(nextStore => {
        result.push(nextStore.Name)
    })
    await logUtils.debug(`<< ${MODULE}.getDisplayable: result=${result.toString()}`)
    return result
}

module.exports.getDisplayable = getDisplayable

async function get(storeName) {
    await logUtils.debug(`>> ${MODULE}.get: storeName=${storeName}`)
    let result = null
    _stores.forEach(nextStore => {
        if (nextStore.Name === storeName) result = nextStore
    })
    if (result === null) throw new Error(`Error: no store with name=${storeName}`)
    await logUtils.debug(`<< ${MODULE}.get: result=${JSON.stringify(result)}`)
    return result
}

module.exports.get = get

async function _getAll() {
    await logUtils.debug(`>> ${MODULE}._getAll`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=SELECT+Id,Name+from+WebStore`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlUtils.curlExec(curlRequest)
    let result = []
    curlResult.records.forEach(nextStore => {
        result.push(nextStore)
    })
    result.sort()
    await logUtils.debug(`<< ${MODULE}._getAll: result=${JSON.stringify(result)}`)
    return result
}
