const {
    QLabel, QMessageBox,
    QPushButton, ButtonRole, QLineEdit, QErrorMessage,
    QComboBox
} = require('@nodegui/nodegui')

module.exports.newQLabel = function (text) {
    const label = new QLabel()
    label.setTextFormat(1)
    label.setText(text)
    return label
};

module.exports.newQLineEdit = function () {
    return new QLineEdit()
}

module.exports.newQPushButton = function (text) {
    const pushButton = new QPushButton()
    pushButton.setText(text)
    return pushButton
}

module.exports.newQComboBox = function (values) {
    const comboBox = new QComboBox()
    if (values) {
        values.forEach(elt => {
            comboBox.addItem(undefined, elt)
        })
    }
    return comboBox
}

module.exports.showQMessageBox = function (text, detailedText) {
    // looks like there is no way to display a custom icon or set the window title
    const messageBox = new QMessageBox()
    messageBox.setText(text)
    if (detailedText) messageBox.setDetailedText(detailedText)
    const accept = new QPushButton()
    accept.setText('OK')
    messageBox.addButton(accept, ButtonRole.YesRole)
    messageBox.exec()
}

module.exports.showQErrorMessage = function (text)  {
    const errorMessage = new QErrorMessage()
    errorMessage.showMessage(text) // shows an annoying "show this message again checkbox"
}

