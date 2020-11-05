const MODULE = "registeredExternalServiceUtils"
const logUtils = require('../logUtils')
const curlUtils = require('./curlUtils')
const configUtils = require('../configUtils')

const REGISTERED_EXTERNAL_SERVICE_TYPES= {
    Price: "Price",
    Inventory: 'Inventory',
    Shipment: "Shipment",
    Tax: "Tax"
}
exports.REGISTERED_EXTERNAL_SERVICE_TYPES = REGISTERED_EXTERNAL_SERVICE_TYPES

let _registeredExternalServicesMap = {
    Price: [],
    Inventory: [],
    Shipment: [],
    Tax: []
}

async function init() {
    await logUtils.debug(`>> ${MODULE}.init`)
    _registeredExternalServicesMap = await _getAll()
    await logUtils.debug(`<< ${MODULE}.init`)
}

module.exports.init = init

async function getDisplayable(type) {
    await logUtils.debug(`>> ${MODULE}.getDisplayableRegisteredExternalService: type=${type}`)
    let result = []
        _registeredExternalServicesMap[type].forEach(nextRes => {
            result.push(nextRes.MasterLabel)
        });
    await logUtils.debug(`<< ${MODULE}.getDisplayableRegisteredExternalService: result=${result.toString()}`)
    return result
}

module.exports.getDisplayable = getDisplayable

async function get(type, name) {
    await logUtils.debug(`>> ${MODULE}.get: type=${type}, name=${name}`)
    let result = null
    if (_registeredExternalServicesMap[type].length !== 0) {
        _registeredExternalServicesMap[type].forEach(nextRes => {
            if (nextRes.MasterLabel === name) result = nextRes
        });
    }
    if (result === null) throw new Error(`Error: no registered external service for type=${type}`)
    await logUtils.debug(`<< ${MODULE}.get: result=${JSON.stringify(result)}`)
    return result
}

module.exports.get = get

async function deleteAll() {
    await logUtils.debug(`>> ${MODULE}.deleteAll`)
    let services = await _getAll()
    for (const typeProperty in services) {
        if (services.hasOwnProperty(typeProperty)) {
            for (const nextRes of services[typeProperty]) {
                await curlUtils.deleteRecord("RegisteredExternalService", nextRes.Id)
            }
        }
    }
    await logUtils.debug(`<< ${MODULE}.deleteAll`)
}

module.exports.deleteAll = deleteAll

async function insert(apexClass,
                      externalServiceProviderType) {
    await logUtils.debug(`>> ${MODULE}.insert: apexClass=${JSON.stringify(apexClass)}, externalServiceProviderType=${externalServiceProviderType}`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/sobjects/RegisteredExternalService/`
    let resName = `${apexClass.Name}RegisteredExternalService`
    let json = {
        ExternalServiceProviderId: apexClass.Id,
        ExternalServiceProviderType: externalServiceProviderType,
        MasterLabel: resName,
        DeveloperName: resName
    }
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Content-Type: application/json" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint} -d '${JSON.stringify(json)}'`
    let curlResult = await curlUtils.curlExec(curlRequest)
    await logUtils.debug(`${MODULE}.insert: successfully inserted record with id=${curlResult.id}`)
    await logUtils.debug(`<< ${MODULE}.insert`)
}

module.exports.insert = insert

async function _getAll() {
    await logUtils.debug(`>> ${MODULE}._getAll`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=Select+Id,ExternalServiceProviderId,ExternalServiceProviderType,MasterLabel,DeveloperName+FROM+RegisteredExternalService`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlUtils.curlExec(curlRequest)

    let registeredExternalServicesMap = {
        Price: [],
        Inventory: [],
        Shipment: [],
        Tax: []
    }

    for (const nextRes of curlResult.records) {
        registeredExternalServicesMap[nextRes.ExternalServiceProviderType].push(nextRes)
    }
    await logUtils.debug(`<< ${MODULE}._getAll: result=${JSON.stringify(registeredExternalServicesMap)}`)
    return registeredExternalServicesMap
}



