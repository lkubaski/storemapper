const MODULE = "configUtils"
const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const logUtils = require('./logUtils')
const path = require('path')

let _isTest = false
let _configFilePath = null
let _config = {
    server: "",
    username: "",
    password: "",
    integrationClassesPrefix: ""
}
let _token

exports.getConfig = () => _config
exports.setConfig = (config) => { _config = config } // only for testing, otherwise saveConfig() should be used
exports.getToken = () => _token
exports.setToken = (token) => { _token = token }

async function init()  {
    await logUtils.debug(`>> ${MODULE}.init`)
    let configFilename = "config.json"
    _configFilePath = `${getAppRootPath()}/${configFilename}`
    try {
        _config = await _loadConfig() // just to check that the config file is in this folder
        await saveConfig(_config)
    } catch (error) {
        _configFilePath = null
        throw new Error(`Warning: cannot load or write config file from folder ${_configFilePath? _configFilePath : ""}`)
    }
    await logUtils.debug(`<< ${MODULE}.init`)
}

module.exports.init = init

async function _loadConfig() {
    await logUtils.debug(`>> ${MODULE}._loadConfig`)
    let config = null
    try {
        // Note: readFile() reads from process.cwd()
        if (_configFilePath) {
            let configFile = await readFile(_configFilePath, {encoding: 'utf8'})
            config = JSON.parse(configFile)
        }
    } catch (error) {
        throw new Error(`Warning: cannot load config file ${_configFilePath? _configFilePath : ""}`)
    }
    await logUtils.debug(`<< ${MODULE}._loadConfig: config=${JSON.stringify(config)}`)
    return config
}

async function saveConfig(config) {
    await logUtils.debug(`>> ${MODULE}.saveConfig: config=${JSON.stringify(config)}`)
    try {
        if (_configFilePath) {
            // https://stackoverflow.com/questions/2614862/how-can-i-beautify-json-programmatically
            await writeFile(_configFilePath, JSON.stringify(config, null, 2), {encoding: 'utf8'})
        }
        _config = config
    } catch (error) {
        await logUtils.debug(`Warning: cannot save config file ${_configFilePath? _configFilePath : ""}`)
    }
    await logUtils.debug(`<< ${MODULE}.saveConfig`)
}

module.exports.saveConfig = saveConfig

/*
 * IMPORTANT: if this function is called by a "non signed app", the rootPath will NOT be the one of the folder
 * containing the .app file but rather the path of a "translocated" folder. As a result, if you try to load a file
 * in this folder, you'll get this type of error:
 * Error: EROFS: read-only file system, open '/private/var/folders/7x/16p529v16x5cgrp_2r66fyfm0000gq/T/AppTranslocation/2FB2DD2D-8BA2-4DEF-8A66-2ED568946A3F/d/StoreMapper.app/Contents/Resources/../../..//logs.txt'
 */
function getAppRootPath() {
    console.log(`>> ${MODULE}.getAppRootPath`)
    // When double clicking on the ".app" to launch it, process.cwd() is "[FULLPATH]/StoreMapper.app/Contents/Resources/"
    let cwd = process.cwd()
    // not sure why but using "Contents/Resources/" (ie: with a slash at the end) doesn't work
    if (cwd.includes("Contents/Resources")) {
        let pathElts = cwd.split(path.sep)
        let tmp = pathElts.slice(0, pathElts.length - 3)
        cwd = tmp.join(path.sep)
        //path = path + "/../../../";
    }
    console.log(`<< ${MODULE}.getAppRootPath: cwd=${cwd}`)
    return cwd
}

module.exports.getAppRootPath = getAppRootPath
