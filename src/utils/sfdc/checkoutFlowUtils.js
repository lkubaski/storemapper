const MODULE = "checkoutFlowUtils"
const logUtils = require('../logUtils')
const curlUtils = require('./curlUtils')
const configUtils = require('../configUtils')

let _checkoutFlows = []

async function init() {
    await logUtils.debug(`>> ${MODULE}.init`)
    _checkoutFlows = await _getAll()
    await logUtils.debug(`<< ${MODULE}.init`)
}

module.exports.init = init

async function getDisplayable() {
    await logUtils.debug(`>> ${MODULE}.getDisplayable`)
    let result = []
    if (_checkoutFlows) {
        _checkoutFlows.forEach(nextCheckoutFlow => {
            result.push(nextCheckoutFlow.ApiName)
        })
    }
    await logUtils.debug(`<< ${MODULE}.getDisplayable: result=${result.toString()}`)
    return result
}

module.exports.getDisplayable = getDisplayable

async function get(apiName) {
    await logUtils.debug(`>> ${MODULE}.get: apiName=[${apiName}]`)
    let result = null
    if (_checkoutFlows) {
        _checkoutFlows.forEach(nextFlow => {
            if (nextFlow.ApiName === apiName) result = nextFlow
        });
    }
    if (result === null) throw new Error(`Error: no checkout flow with apiName=${apiName}`)
    await logUtils.debug(`<< ${MODULE}.get: result=${JSON.stringify(result)}`)
    return result
}

module.exports.get = get

async function _getAll() {
    await logUtils.debug(`>> ${MODULE}._getAll`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=SELECT+Id,ApiName+from+FlowDefinitionView+Where+IsActive=true+And+ProcessType=%27CheckoutFlow%27+And+ManageableState=%27unmanaged%27`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlUtils.curlExec(curlRequest)
    let result = []
    for (const nextFlow of curlResult.records) {
        result.push(nextFlow)
    }
    result.sort()
    await logUtils.debug(`<< ${MODULE}._getAll: result=${JSON.stringify(result)}`)
    return result;
}
