const MODULE = "integrationClassUtils"
const logUtils = require('../logUtils')
const curlUtils = require('./curlUtils')
const configUtils = require('../configUtils')

let _integrationClassesMap = {
    Price : [],
    Inventory: [],
    Shipment: [],
    Tax: []
}

async function init(integrationClassesPrefix, statusCallback) {
    await logUtils.debug(`>> ${MODULE}.init: integrationClassesPrefix=${integrationClassesPrefix}`)
    _integrationClassesMap = await _getAll(integrationClassesPrefix, statusCallback)
    await logUtils.debug(`<< ${MODULE}.init`)
}

module.exports.init = init

async function getDisplayable(type) {
    await logUtils.debug(`>> ${MODULE}.getDisplayable: type=${type}`)
    let result = []
    _integrationClassesMap[type].forEach(nextClass => {
        result.push(nextClass.Name)
    });
    await logUtils.debug(`<< ${MODULE}.getDisplayable: result=${result.toString()}`)
    return result
}

module.exports.getDisplayable = getDisplayable

async function get(type, integrationClassName) {
    await logUtils.debug(`>> ${MODULE}.get: type=${type}, integrationClassName=${integrationClassName}`)
    let result = null
    if (_integrationClassesMap[type].length !== 0) {
        _integrationClassesMap[type].forEach(nextClass => {
            if (nextClass.Name === integrationClassName) result = nextClass
        })

    }
    if (result === null) throw new Error(`Error: no integration class for type=${type} and integrationClassName=${integrationClassName}`)
    await logUtils.debug(`<< ${MODULE}.get: result=${JSON.stringify(result)}`)
    return result
}

module.exports.get = get

async function _getAll(integrationClassesPrefix, statusCallback) {
    await logUtils.debug(`>> ${MODULE}._getAll: integrationClassesPrefix=${integrationClassesPrefix}`)
    let integrationClasses = {
        Price: [],
        Inventory: [],
        Shipment: [],
        Tax: []
    }
    let classes = await _getAllClasses(integrationClassesPrefix)
    for (let i = 0; i < classes.length; i++) {
        let nextClass = classes[i]
        if (statusCallback) {
            statusCallback(`${i}/${classes.length}`)
        }
        if (nextClass.Name.startsWith(integrationClassesPrefix)) {
            let classBody = await _getBody(nextClass.Name)
            if (classBody.includes("implements sfdc_checkout.CartInventoryValidation")) {
                await logUtils.debug(`${MODULE}._getAll: found inventory class=${nextClass.Name}`)
                integrationClasses.Inventory.push(nextClass)
            } else if (classBody.includes("implements sfdc_checkout.CartPriceCalculations")) {
                await logUtils.debug(`${MODULE}._getAll: found price class=${nextClass.Name}`)
                integrationClasses.Price.push(nextClass)
            } else if (classBody.includes("implements sfdc_checkout.CartShippingCharges")) {
                await logUtils.debug(`${MODULE}._getAll: found shipment class=${nextClass.Name}`)
                integrationClasses.Shipment.push(nextClass)
            } else if (classBody.includes("implements sfdc_checkout.CartTaxCalculations")) {
                await logUtils.debug(`${MODULE}._getAll: found tax class=${nextClass.Name}`)
                integrationClasses.Tax.push(nextClass)
            }
        } else {
            await logUtils.debug(`${MODULE}._getAll: skipping=${nextClass.Name}`)
        }
    }
    await logUtils.debug(`<< ${MODULE}._getAll: result=${JSON.stringify(integrationClasses)}`)
    return integrationClasses
}

async function _getAllClasses(prefix ) {
    await logUtils.debug(`>> ${MODULE}._getAllClasses: prefix=${prefix}`)
    let likeClause = (prefix && prefix.length > 0) ? "+Where+Name+LIKE+%27B2B%25%27" : ""
    let query = `SELECT+Id,Name+from+ApexClass${likeClause}`
    let queryResult = await curlUtils.query(query)
    let result = queryResult.records
    await logUtils.debug(`<< ${MODULE}._getAllClasses: returning nbClasses=${result.length}`)
    return result
}

async function _getBody(apexClassName) {
    await logUtils.debug(`>> ${MODULE}._getBody: apexClassName=${apexClassName}`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=SELECT+Body+from+ApexClass+Where+Name=%27${apexClassName}%27`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlUtils.curlExec(curlRequest)
    if (curlResult.records.length === 0) {
        throw new Error("Error: class name '" + apexClassName + "' is not valid")
    }
    let result = curlResult.records[0].Body
    await logUtils.debug(`<< ${MODULE}._getBody`)
    return result
}


