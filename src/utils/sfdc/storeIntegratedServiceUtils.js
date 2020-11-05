const MODULE = "storeIntegratedServiceUtils"
const logUtils = require('../logUtils')
const curlUtils = require('./curlUtils')
const configUtils = require('../configUtils')

const STORE_INTEGRATED_SERVICE_TYPES= {
    Price: "Price",
    Inventory: 'Inventory',
    Shipment: "Shipment",
    Tax: "Tax",
    Payment: "Payment",
    Flow: "Flow"
}
exports.STORE_INTEGRATED_SERVICE_TYPES = STORE_INTEGRATED_SERVICE_TYPES

async function deleteAll(storeId) {
    await logUtils.debug(`>> ${MODULE}.deleteAll: storeId=${storeId? storeId : ""}`) // just to make flow happy
    let ids = storeId? await _getIds() : await _getIds(storeId)
    for (const id of ids) {
        await curlUtils.deleteRecord("StoreIntegratedService", id)
    }
    await logUtils.debug(`<< ${MODULE}.deleteAll`)
}

module.exports.deleteAll = deleteAll

async function insert(storeId,
                      registeredExternalServiceId,
                      type) {
    await logUtils.debug(`>> ${MODULE}.insert: storeId=${storeId}, registeredExternalServiceId=${registeredExternalServiceId}, type=${type}`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/sobjects/StoreIntegratedService/`
    let json = {
        StoreId: storeId,
        Integration: registeredExternalServiceId,
        ServiceProviderType: type
    }
    //let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Content-Type: application/json" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint} -d '{"StoreId" : "${storeId}", "Integration" : "${registeredExternalServiceId}", "ServiceProviderType" : "${type}"}'`;
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Content-Type: application/json" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint} -d '${JSON.stringify(json)}'`
    let curlResult = await curlUtils.curlExec(curlRequest)
    await logUtils.debug(`<< ${MODULE}.insert: successfully inserted record with id=${curlResult.id}`)
}

module.exports.insert = insert

async function _getIds(storeId) {
    await logUtils.debug(`>> ${MODULE}._getIds: storeId=${storeId? storeId : ""}`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=Select+Id+FROM+StoreIntegratedService`;
    if (storeId) endpoint = endpoint + `+Where+StoreId=%27${storeId}%27`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlUtils.curlExec(curlRequest)
    let result = []
    curlResult.records.forEach(function (elt) {
        result.push(elt.Id)
    });
    await logUtils.debug(`<< ${MODULE}._getIds: result=[${result.toString()}]`)
    return result
}
