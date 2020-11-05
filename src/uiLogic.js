const MODULE = "uiLogic"
const logUtils = require('./utils/logUtils')
const checkoutFlowUtils = require('./utils/sfdc/checkoutFlowUtils')
const loginUtils = require('./utils/sfdc/loginUtils')
const storeUtils = require('./utils/sfdc/storeUtils')
const paymentGatewayUtils = require('./utils/sfdc/paymentGatewayUtils')
const integrationClassUtils = require('./utils/sfdc/integrationClassUtils')
const registeredExternalServiceUtils = require('./utils/sfdc/registeredExternalServiceUtils')
const storeIntegratedServiceUtils = require('./utils/sfdc/storeIntegratedServiceUtils')
const configUtils = require('./utils/configUtils')
const curlUtils = require('./utils/sfdc/curlUtils')

async function initLoginTab(serverQLineEdit ,
                            usernameQLineEdit,
                            passwordQLineEdit,
                            integrationClassesPrefixQLineEdit) {
    await logUtils.debug(`>> ${MODULE}.initLoginTab`)
    const config = await configUtils.getConfig()
    if (config) {
        serverQLineEdit.setText(config.server)
        usernameQLineEdit.setText(config.username)
        passwordQLineEdit.setText(config.password)
        integrationClassesPrefixQLineEdit.setText(config.integrationClassesPrefix)
    }
    await logUtils.debug(`<< ${MODULE}.initLoginTab`)
}

module.exports.initLoginTab = initLoginTab

async function login(server,
                     username,
                     password,
                     integrationClassesPrefix,
                     statusCallback) {
    await logUtils.debug(`>> ${MODULE}.login`)
    server = server.trim()
    username = username.trim()
    password = password.trim()
    if (server === "" ||
        username === "" ||
        password === "") {
        throw new Error("Error: please enter a server, username & password")
    }
    statusCallback("Connecting...")
    let token = await loginUtils.loginSoap(server, username, password)
    configUtils.setToken(token)
    let config = await configUtils.getConfig()
    config.server = server
    config.username = username
    config.password = password
    config.integrationClassesPrefix = integrationClassesPrefix
    await configUtils.saveConfig(config)
    let orgName = await loginUtils.getOrganizationName()
    await logUtils.debug(`<< ${MODULE}.login: orgName=${orgName}`)
    return orgName
}

module.exports.login = login

async function initExternalServicesTab(inventoryClassQComboBox,
                                       shipmentClassQComboBox,
                                       priceClassQComboBox,
                                       taxClassQComboBox,
                                       statusCallback,
                                       messageBoxCallback) {
    await logUtils.debug(`>> ${MODULE}.initExternalServicesTab`)
    let config = await configUtils.getConfig()
    let nbApexClasses = await curlUtils.count("ApexClass")
    await logUtils.debug(`${MODULE}.initExternalServicesTab : nbApexClasses=${nbApexClasses}`)
    await logUtils.debug(`${MODULE}.initExternalServicesTab : config.integrationClassesPrefix.length=${config.integrationClassesPrefix.length}`)
    if (nbApexClasses > 200 && config.integrationClassesPrefix.length === 0) {
        messageBoxCallback(`Warning: you have ${nbApexClasses} Apex classes in your org, consider adding a filter in the configuration file to increase the loading performances (see the documentation for more details).`)
    }
    statusCallback("Loading integration classes...")
    await integrationClassUtils.init(config.integrationClassesPrefix, async function (progress) {
        await logUtils.debug(`${MODULE}.initExternalServicesTab: progress=${progress}`)
        statusCallback(`Searching for integration classes: ${progress}`)
    })
    inventoryClassQComboBox.clear()
    inventoryClassQComboBox.addItem(undefined, "")
    inventoryClassQComboBox.addItems(await integrationClassUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Inventory))
    shipmentClassQComboBox.clear()
    shipmentClassQComboBox.addItem(undefined, "")
    shipmentClassQComboBox.addItems(await integrationClassUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Shipment))
    priceClassQComboBox.clear()
    priceClassQComboBox.addItem(undefined, "")
    priceClassQComboBox.addItems(await integrationClassUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Price))
    taxClassQComboBox.clear()
    taxClassQComboBox.addItem(undefined, "")
    taxClassQComboBox.addItems(await integrationClassUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Tax))
    await logUtils.debug(`<< ${MODULE}.initExternalServicesTab`)
}

module.exports.initExternalServicesTab = initExternalServicesTab

async function registerExternalServices(inventoryClassName,
                                        shipmentClassName,
                                        priceClassName,
                                        taxClassName,
                                        statusCallback) {
    await logUtils.debug(`>> ${MODULE}.registerExternalServices`)
    if (inventoryClassName === "" ||
        shipmentClassName === "" ||
        priceClassName === "" ||
        taxClassName === "") {
        throw new Error("Error: all the fields are mandatory")
    }
    statusCallback("Getting selected integration classes...")
    let inventoryClass = await integrationClassUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Inventory, inventoryClassName)
    let shipmentClass = await integrationClassUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Shipment, shipmentClassName)
    let priceClass = await integrationClassUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Price, priceClassName)
    let taxClass = await integrationClassUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Tax, taxClassName)
    statusCallback("Deleting store integrated services...")
    await storeIntegratedServiceUtils.deleteAll()
    statusCallback("Deleting registered external services...")
    await registeredExternalServiceUtils.deleteAll()
    statusCallback("Inserting registered external services...")
    await registeredExternalServiceUtils.insert(inventoryClass, registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Inventory)
    await registeredExternalServiceUtils.insert(shipmentClass, registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Shipment)
    await registeredExternalServiceUtils.insert(priceClass, registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Price)
    await registeredExternalServiceUtils.insert(taxClass, registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Tax)
    await logUtils.debug(`<< ${MODULE}.registerExternalServices`)
}

module.exports.registerExternalServices = registerExternalServices

async function initStoreServicesTab(storeQComboBox,
                                    checkoutFlowQComboBox,
                                    paymentGatewayQComboBox,
                                    inventoryServiceQComboBox,
                                    priceServiceQComboBox,
                                    shipmentServiceQComboBox,
                                    taxServiceQComboBox,
                                    statusCallback) {
    await logUtils.debug(`>> ${MODULE}.initStoreServicesTab`)
    statusCallback("Loading stores...")
    await storeUtils.init()
    statusCallback("Loading checkout flows...")
    await checkoutFlowUtils.init()
    statusCallback("Loading payment gateways...")
    await paymentGatewayUtils.init()
    statusCallback("Loading registered external services...")
    await registeredExternalServiceUtils.init() // reload cache
    storeQComboBox.clear()
    storeQComboBox.addItem(undefined, "")
    storeQComboBox.addItems(await storeUtils.getDisplayable())
    checkoutFlowQComboBox.clear()
    checkoutFlowQComboBox.addItem(undefined, "")
    checkoutFlowQComboBox.addItems(await checkoutFlowUtils.getDisplayable())
    paymentGatewayQComboBox.clear()
    paymentGatewayQComboBox.addItem(undefined, "")
    paymentGatewayQComboBox.addItems(await paymentGatewayUtils.getDisplayable())
    inventoryServiceQComboBox.clear()
    inventoryServiceQComboBox.addItem(undefined, "")
    inventoryServiceQComboBox.addItems(await registeredExternalServiceUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Inventory))
    priceServiceQComboBox.clear()
    priceServiceQComboBox.addItem(undefined, "")
    priceServiceQComboBox.addItems(await registeredExternalServiceUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Price))
    shipmentServiceQComboBox.clear()
    shipmentServiceQComboBox.addItem(undefined, "")
    shipmentServiceQComboBox.addItems(await registeredExternalServiceUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Shipment))
    taxServiceQComboBox.clear()
    taxServiceQComboBox.addItem(undefined, "")
    taxServiceQComboBox.addItems(await registeredExternalServiceUtils.getDisplayable(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Tax))

    await logUtils.debug(`<< ${MODULE}.initStoreServicesTab`)
}

module.exports.initStoreServicesTab = initStoreServicesTab

async function registerStoreServices(storeName,
                                     checkoutFlowName,
                                     paymentGatewayName,
                                     inventoryServiceName,
                                     priceServiceName,
                                     shipmentServiceName,
                                     taxServiceName,
                                     statusCallback) {
    await logUtils.debug(`>> ${MODULE}.registerStoreServices()`)
    if (storeName === "" ||
        checkoutFlowName === "") {
        throw new Error("Error: please select a store and a checkout flow")
    }
    let store = await storeUtils.get(storeName)
    let flow = await checkoutFlowUtils.get(checkoutFlowName)
    let paymentGateway
    if (paymentGatewayName !== "") {
        paymentGateway = await paymentGatewayUtils.get(paymentGatewayName)
    }
    statusCallback("Getting selected registered external services...")
    let inventoryService, priceService, shipmentService, taxService
    if (inventoryServiceName !== "") {
        inventoryService = await registeredExternalServiceUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Inventory, inventoryServiceName)
    }
    if (priceServiceName !== "") {
        priceService = await registeredExternalServiceUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Price, priceServiceName)
    }
    if (shipmentServiceName !== "") {
        shipmentService = await registeredExternalServiceUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Shipment, shipmentServiceName)
    }
    if (taxServiceName !== "") {
        taxService = await registeredExternalServiceUtils.get(registeredExternalServiceUtils.REGISTERED_EXTERNAL_SERVICE_TYPES.Tax, taxServiceName)
    }
    statusCallback(`Deleting store integrated services for ${store.Name}...`)
    await storeIntegratedServiceUtils.deleteAll(store.Id)
    statusCallback(`Inserting store integration services for ${store.Name}...`)
    let flowApiName = `${storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Flow}__${flow.ApiName}`
    await storeIntegratedServiceUtils.insert(store.Id, flowApiName, storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Flow)
    if (paymentGateway) {
        let paymentAPIName = paymentGateway.Id // for the payment gateway that's the ONLY valid value
        await storeIntegratedServiceUtils.insert(store.Id, paymentAPIName, storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Payment)
    }
    if (inventoryService) {
        let inventoryAPIName = inventoryService.Id // also valid
        //let inventoryAPIName = `${storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Inventory}__${inventoryService.DeveloperName}`
        await storeIntegratedServiceUtils.insert(store.Id, inventoryAPIName, storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Inventory)
    }
    if (priceService) {
        let priceAPIName = priceService.Id // also valid
        //let priceAPIName = `${storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Price}__B2b_STOREFRONT__StandardPricing` // TODO: test this value
        //let priceAPIName = `${storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Price}__${priceService.DeveloperName}`
        await storeIntegratedServiceUtils.insert(store.Id, priceAPIName, storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Price)
    }
    if (shipmentService) {
        let shipmentAPIName = shipmentService.Id // also valid
        //let shipmentAPIName = `${storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Shipment}__${shipmentService.DeveloperName}`
        await storeIntegratedServiceUtils.insert(store.Id, shipmentAPIName, storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Shipment)
    }
    if (taxService) {
        let taxAPIName = taxService.Id // also valid
        //let taxAPIName = `${storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Tax}__${taxService.DeveloperName}`
        await storeIntegratedServiceUtils.insert(store.Id, taxAPIName, storeIntegratedServiceUtils.STORE_INTEGRATED_SERVICE_TYPES.Tax)
    }
    await logUtils.debug(`<< ${MODULE}.registerStoreServices()`)
}

module.exports.registerStoreServices = registerStoreServices
