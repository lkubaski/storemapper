const MODULE = "ui"
const uiLogic = require('./uiLogic')
const logUtils = require('./utils/logUtils')
const configUtils = require('./utils/configUtils')
const qtUtils = require('./utils/qtUtils')

const {
    QMainWindow, QWidget, QGridLayout, QIcon, QTabWidget, CursorShape, QStatusBar, QMenuBar, QMenu, QAction, QMessageBox
} = require('@nodegui/nodegui')

let statusBar // nodegui bug: global.win.statusBar() doesn't work so we need to keep a reference
let qTabWidget
// first tab
/////////////
let loginTabQWidget, serverQLineEdit, usernameQLineEdit, passwordQLineEdit, integrationClassesPrefixQLineEdit,
    loginQPushButton
exports.serverQLineEdit = () => serverQLineEdit
exports.usernameQLineEdit = () => usernameQLineEdit
exports.passwordQLineEdit = () => passwordQLineEdit
exports.integrationClassesPrefixQLineEdit = () => integrationClassesPrefixQLineEdit
// second tab
/////////////
let externalServicesTabQWidget, inventoryClassQComboBox, shipmentClassQComboBox, priceClassQComboBox, taxClassQComboBox,
    registerExternalServicesQPushButton
exports.inventoryClassQComboBox = () => inventoryClassQComboBox
exports.shipmentClassQComboBox = () => shipmentClassQComboBox
exports.priceClassQComboBox = () => priceClassQComboBox
exports.taxClassQComboBox = () => taxClassQComboBox
// third tab
/////////////
let storeServicestabQWidget, storeQComboBox, checkoutFlowQComboBox, inventoryServiceQComboBox, priceServiceQComboBox,
    shipmentServiceQComboBox, taxServiceQComboBox, paymentGatewayQComboBox, registerStoreServicesQPushButton
exports.storeQComboBox = () => storeQComboBox
exports.checkoutFlowQComboBox = () => checkoutFlowQComboBox
exports.inventoryServiceQComboBox = () => inventoryServiceQComboBox
exports.priceServiceQComboBox = () => priceServiceQComboBox
exports.shipmentServiceQComboBox = () => shipmentServiceQComboBox
exports.taxServiceQComboBox = () => taxServiceQComboBox
exports.paymentGatewayQComboBox = () => paymentGatewayQComboBox

function setTabEnabled(loginTabEnabled, externalServicesTabEnabled, storeServicesTabEnabled) {
    loginTabQWidget.setEnabled(loginTabEnabled)
    externalServicesTabQWidget.setEnabled(externalServicesTabEnabled)
    storeServicestabQWidget.setEnabled(storeServicesTabEnabled)
}

async function initUi() {
    await logUtils.debug(`>> ${MODULE}.initUi()`)
    const win = new QMainWindow()
    // required, otherwise the window is going to be garbage collected after 10s and the app will automatically close:
    global.win = win
    win.setWindowTitle("[INSERT_TITLE]")
    const centralWidget = new QWidget()
    centralWidget.setMinimumSize(500, 250)
    win.setCentralWidget(centralWidget)
    const centralLayout = new QGridLayout()
    centralWidget.setLayout(centralLayout)
    statusBar = new QStatusBar()
    win.setStatusBar(statusBar)

    const menuBar = new QMenuBar()
    const menu = new QMenu()
    const action = new QAction()
    action.setText("Help")
    action.addEventListener("triggered", function () {
        // the second argument seems to be ignored on Mac
        QMessageBox.about(win, "[INSERT_TITLE]", "[INSERT_TITLE]\nContact: lkubaski@salesforce.com")
    });
    menu.addAction(action)
    menu.setTitle("About")
    menuBar.addMenu(menu)
    win.setMenuBar(menuBar)

    /******************/
    /*** Login tab ***/
    /******************/
    loginTabQWidget = new QWidget()
    loginTabQWidget.setLayout(new QGridLayout())

    loginTabQWidget.layout.addWidget(qtUtils.newQLabel("Server: &#42;"), 0, 0)
    serverQLineEdit = qtUtils.newQLineEdit()
    loginTabQWidget.layout.addWidget(serverQLineEdit, 0, 1)

    loginTabQWidget.layout.addWidget(qtUtils.newQLabel("Username: &#42;"), 1, 0)
    usernameQLineEdit = qtUtils.newQLineEdit()
    loginTabQWidget.layout.addWidget(usernameQLineEdit, 1, 1)

    loginTabQWidget.layout.addWidget(qtUtils.newQLabel("Password: &#42;"), 2, 0)
    passwordQLineEdit = qtUtils.newQLineEdit()
    loginTabQWidget.layout.addWidget(passwordQLineEdit, 2, 1)

    loginTabQWidget.layout.addWidget(qtUtils.newQLabel("Integration classes prefix:"), 3, 0)
    integrationClassesPrefixQLineEdit = qtUtils.newQLineEdit()
    loginTabQWidget.layout.addWidget(integrationClassesPrefixQLineEdit, 3, 1)

    loginQPushButton = qtUtils.newQPushButton("Login")
    loginTabQWidget.layout.addWidget(loginQPushButton, 4, 0, 1, 2)

    /****************************************/
    /*** Registered External Services Tab ***/
    /****************************************/
    externalServicesTabQWidget = new QWidget()
    externalServicesTabQWidget.setLayout(new QGridLayout())
    externalServicesTabQWidget.layout.addWidget(qtUtils.newQLabel("Inventory Class: &#42;"), 0, 0)
    inventoryClassQComboBox = qtUtils.newQComboBox()
    externalServicesTabQWidget.layout.addWidget(inventoryClassQComboBox, 0, 1)
    priceClassQComboBox = qtUtils.newQComboBox()
    externalServicesTabQWidget.layout.addWidget(qtUtils.newQLabel("Price Class: &#42;"), 1, 0)
    externalServicesTabQWidget.layout.addWidget(priceClassQComboBox, 1, 1)

    externalServicesTabQWidget.layout.addWidget(qtUtils.newQLabel("Shipment Class: &#42;"), 2, 0)
    shipmentClassQComboBox = qtUtils.newQComboBox()
    externalServicesTabQWidget.layout.addWidget(shipmentClassQComboBox, 2, 1)

    externalServicesTabQWidget.layout.addWidget(qtUtils.newQLabel("Tax Class: &#42;"), 3, 0)
    taxClassQComboBox = qtUtils.newQComboBox()
    externalServicesTabQWidget.layout.addWidget(taxClassQComboBox, 3, 1)

    registerExternalServicesQPushButton = qtUtils.newQPushButton("Register")
    externalServicesTabQWidget.layout.addWidget(registerExternalServicesQPushButton, 4, 0, 1, 2)

    /**************************************/
    /*** Store Integrated Services Tab ***/
    /*************************************/
    storeServicestabQWidget = new QWidget()
    storeServicestabQWidget.setLayout(new QGridLayout())
    storeServicestabQWidget.layout.addWidget(qtUtils.newQLabel("Store: &#42;"), 0, 0)
    storeQComboBox = qtUtils.newQComboBox()
    storeServicestabQWidget.layout.addWidget(storeQComboBox, 0, 1)

    storeServicestabQWidget.layout.addWidget(qtUtils.newQLabel("Checkout flow: &#42;"), 1, 0)
    checkoutFlowQComboBox = qtUtils.newQComboBox()
    storeServicestabQWidget.layout.addWidget(checkoutFlowQComboBox, 1, 1)

    storeServicestabQWidget.layout.addWidget(qtUtils.newQLabel("Payment Gateway:"), 2, 0)
    paymentGatewayQComboBox = qtUtils.newQComboBox()
    storeServicestabQWidget.layout.addWidget(paymentGatewayQComboBox, 2, 1)

    storeServicestabQWidget.layout.addWidget(qtUtils.newQLabel("Registered Inventory Service:"), 3, 0)
    inventoryServiceQComboBox = qtUtils.newQComboBox()
    storeServicestabQWidget.layout.addWidget(inventoryServiceQComboBox, 3, 1)

    storeServicestabQWidget.layout.addWidget(qtUtils.newQLabel("Registered Price Service:"), 4, 0)
    priceServiceQComboBox = qtUtils.newQComboBox()
    storeServicestabQWidget.layout.addWidget(priceServiceQComboBox, 4, 1)

    storeServicestabQWidget.layout.addWidget(qtUtils.newQLabel("Registered Shipment Service:"), 5, 0)
    shipmentServiceQComboBox = qtUtils.newQComboBox()
    storeServicestabQWidget.layout.addWidget(shipmentServiceQComboBox, 5, 1)

    storeServicestabQWidget.layout.addWidget(qtUtils.newQLabel("Registered Tax Service:"), 6, 0)
    taxServiceQComboBox = qtUtils.newQComboBox()
    storeServicestabQWidget.layout.addWidget(taxServiceQComboBox, 6, 1)

    registerStoreServicesQPushButton = qtUtils.newQPushButton("Register")
    storeServicestabQWidget.layout.addWidget(registerStoreServicesQPushButton, 7, 0, 1, 2)

    /******************/
    /** Create tabs **/
    /******************/
    qTabWidget = new QTabWidget()
    qTabWidget.addTab(loginTabQWidget, new QIcon(), '1. Login')
    qTabWidget.addTab(externalServicesTabQWidget, new QIcon(), '2. Registered External Services')
    qTabWidget.addTab(storeServicestabQWidget, new QIcon(), '3. Store Integrated Services')
    centralLayout.addWidget(qTabWidget)

    setTabEnabled(true, false, false)
    await uiLogic.initLoginTab(serverQLineEdit, usernameQLineEdit, passwordQLineEdit, integrationClassesPrefixQLineEdit)
    statusBar.showMessage("Contact: lkubaski@salesforce.com")
    await logUtils.debug(`<< ${MODULE}.initUi()`)
}

module.exports.initUi = initUi

async function onError(error) {
    statusBar.clearMessage()
    await logUtils.debug(`ERROR: error=${error}, stack=${error.stack}`)
    qtUtils.showQMessageBox(error.message, error.stack)
}

async function initListeners() {
    await logUtils.debug(`>> ${MODULE}.initListeners`)
    loginQPushButton.addEventListener('clicked', onLoginButtonClicked)
    registerExternalServicesQPushButton.addEventListener('clicked', onRegisterExternalServicesButtonClicked)
    registerStoreServicesQPushButton.addEventListener('clicked', onRegisterStoreServicesButtonClicked)
    await logUtils.debug(`<< ${MODULE}.initListeners()`)
}

async function onLoginButtonClicked() {
    await logUtils.debug(`>> ${MODULE}.onLoginButtonClicked`)
    try {
        setTabEnabled(false, false, false)
        global.win.setCursor(CursorShape.BusyCursor)
        let orgName = await uiLogic.login(
            serverQLineEdit.text(),
            usernameQLineEdit.text(),
            passwordQLineEdit.text(),
            integrationClassesPrefixQLineEdit.text(),
            function (message) {
                statusBar.showMessage(message);
            })
        qtUtils.showQMessageBox(`Successfully connected to organisation ${orgName}`)
        // we switch tab just after login is successful
        qTabWidget.setCurrentIndex(qTabWidget.currentIndex() + 1)
        await uiLogic.initExternalServicesTab(
            inventoryClassQComboBox,
            shipmentClassQComboBox,
            priceClassQComboBox,
            taxClassQComboBox,
            function (message) {
                statusBar.showMessage(message)
            },
            function (message) {
                qtUtils.showQMessageBox(message)
            });
        setTabEnabled(false, true, false)
        statusBar.clearMessage()
    } catch (error) {
        setTabEnabled(true, false, false)
        await onError(error)
    }
    global.win.setCursor(CursorShape.ArrowCursor)
    await logUtils.debug(`<< ${MODULE}.onLoginButtonClicked()`)
}

module.exports.onLoginButtonClicked = onLoginButtonClicked

async function onRegisterExternalServicesButtonClicked() {
    await logUtils.debug(`>> ${MODULE}.onRegisterExternalServicesButtonClicked()`)
    try {
        setTabEnabled(true, false, false)
        global.win.setCursor(CursorShape.BusyCursor)
        await uiLogic.registerExternalServices(
            inventoryClassQComboBox.currentText(),
            shipmentClassQComboBox.currentText(),
            priceClassQComboBox.currentText(),
            taxClassQComboBox.currentText(),
            function (message) {
                statusBar.showMessage(message)
            })
        qtUtils.showQMessageBox("External Services successfully registered.")
        qTabWidget.setCurrentIndex(qTabWidget.currentIndex() + 1)
        await uiLogic.initStoreServicesTab(
            storeQComboBox,
            checkoutFlowQComboBox,
            paymentGatewayQComboBox,
            inventoryServiceQComboBox,
            priceServiceQComboBox,
            shipmentServiceQComboBox,
            taxServiceQComboBox,
            function (message) {
                statusBar.showMessage(message)
            })
        setTabEnabled(false, false, true)
        statusBar.clearMessage()
    } catch (error) {
        setTabEnabled(true, true, false)
        await onError(error)
    }
    global.win.setCursor(CursorShape.ArrowCursor)
    await logUtils.debug(`<< ${MODULE}.onRegisterExternalServicesButtonClicked()`)
}

module.exports.onRegisterExternalServicesButtonClicked = onRegisterExternalServicesButtonClicked

async function onRegisterStoreServicesButtonClicked() {
    await logUtils.debug(`>> ${MODULE}.onRegisterStoreServicesButtonClicked()`)
    try {
        setTabEnabled(false, false, false)
        global.win.setCursor(CursorShape.BusyCursor)
        await uiLogic.registerStoreServices(
            storeQComboBox.currentText(),
            checkoutFlowQComboBox.currentText(),
            paymentGatewayQComboBox.currentText(),
            inventoryServiceQComboBox.currentText(),
            priceServiceQComboBox.currentText(),
            shipmentServiceQComboBox.currentText(),
            taxServiceQComboBox.currentText(),
            function (message) {
                statusBar.showMessage(message)
            });
        statusBar.clearMessage()
        // re-enabling the tab in case user wants to create another store mapping
        setTabEnabled(false, false, true)
        qtUtils.showQMessageBox(`Store Services successfully registered for ${storeQComboBox.currentText()}.`)
    } catch (error) {
        setTabEnabled(false, false, true)
        await onError(error)
    }
    global.win.setCursor(CursorShape.ArrowCursor)
    await logUtils.debug(`<< ${MODULE}.onRegisterStoreServicesButtonClicked()`)
}

module.exports.onRegisterStoreServicesButtonClicked = onRegisterStoreServicesButtonClicked

async function main() {
    try {
        await logUtils.init(); // needs to be initialized FIRST
        try {
            await configUtils.init()
        } catch (error) {
            qtUtils.showQMessageBox(error.message, error.stack)
        }
        await initUi()
        await initListeners()
        global.win.show()
    } catch (error) {
        console.log(`ERROR: error=${error}, stack=${error.stack}`)
        qtUtils.showQMessageBox(error.message, error.stack)
    }
}

module.exports.main = main


