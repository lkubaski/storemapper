const MODULE = "logUtils"
const util = require('util')
const fs = require('fs')
const appendFile = util.promisify(fs.appendFile)
const writeFile = util.promisify(fs.writeFile)
const configUtils = require('./configUtils')

const LOG_FILE = "logs.txt"
let _logFilePath = null

async function init() {
    debug(`>> ${MODULE}.init`)
    _logFilePath = `${configUtils.getAppRootPath()}/${LOG_FILE}`
    try {
        // Note: all methods from the fs module use process.cwd() as the current path
        await writeFile(_logFilePath, `${String(new Date())}\n`, 'utf8')
    } catch (error) {
        // this can be tested by locking the folder (right click folder in Finder -> Get Info -> click 'Locked' checkbox
        debug(`Warning: cannot write into log file ${LOG_FILE}`)
        _logFilePath = null
    }
    debug(`<< ${MODULE}.init`)
}

module.exports.init = init


async function debug(text) {
    // just to avoid the "missing await for a async function call" warning every time we use this function
    await _debug(text)
}

module.exports.debug = debug

async function _debug(text) {
    console.log(text)
    if (_logFilePath) {
        await appendFile(_logFilePath, `${text}\n`, 'utf8')
    }
}
