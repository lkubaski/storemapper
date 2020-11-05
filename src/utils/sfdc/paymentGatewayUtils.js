const MODULE = "paymentGatewayUtils"
const logUtils = require('../logUtils')
const curlUtils = require('./curlUtils')
const configUtils = require('../configUtils')

let _paymentGateways = []

async function init() {
    await logUtils.debug(`>> ${MODULE}.init`)
    _paymentGateways = await _getAll()
    await logUtils.debug(`<< ${MODULE}.init`)
}

module.exports.init = init

async function getDisplayable() {
    await logUtils.debug(`>> ${MODULE}.getDisplayable`)
    let result = []
    _paymentGateways.forEach(elt => {
        result.push(elt.PaymentGatewayName)
    });
    await logUtils.debug(`<< ${MODULE}.getDisplayable: result=${result.toString()}`)
    return result
}

module.exports.getDisplayable = getDisplayable

async function get(paymentGatewayName ) {
    await logUtils.debug(`>> ${MODULE}.get: paymentGatewayName=[${paymentGatewayName}]`)
    let result = null
    _paymentGateways.forEach(elt => {
        if (elt.PaymentGatewayName === paymentGatewayName) result = elt
    });
    if (result === null) throw new Error(`Error: no payment gateway with name=${paymentGatewayName}`)
    await logUtils.debug(`<< ${MODULE}.get: result=${JSON.stringify(result)}`)
    return result
}

module.exports.get = get

async function _getAll() {
    await logUtils.debug(`>> ${MODULE}._getAll`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=SELECT+Id,PaymentGatewayName+from+PaymentGateway`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlUtils.curlExec(curlRequest)
    let result = []
    curlResult.records.forEach(elt => {
        result.push(elt)
    });
    result.sort()
    await logUtils.debug(`<< ${MODULE}._getAll: result=${JSON.stringify(result)}`)
    return result
}
