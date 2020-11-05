const MODULE = "curlUtils"
const util = require('util')
const child_process = require('child_process')
// couldn't find a way to mock a promisified method without doing this:
//const exec = child_process.exec._isMockFunction ? child_process.exec : util.promisify(child_process.exec)
const exec = util.promisify(child_process.exec)
const logUtils = require('../logUtils')
const configUtils = require('../configUtils')

async function curlExec(curlRequest) {
    await logUtils.debug(`>> ${MODULE}.curlExec: curlRequest=${curlRequest}`)
    let execResult /*: any*/ = await exec(curlRequest, {encoding: 'utf8'})
    execResult = execResult.stdout
    // if it's a HTTP DELETE, "" is returned
    if (execResult !== "") {
        execResult = JSON.parse(execResult)
        //await logUtils.debug(`${MODULE}.curlExec: execResult=${JSON.stringify(execResult)}`);
        // yeah that's weird: an array with one element is returned in case of error and an object is returned otherwise
        if (Array.isArray(execResult) && execResult[0].hasOwnProperty("errorCode")) {
            throw new Error(execResult[0].message)
        }
    }
    await logUtils.debug(`<< ${MODULE}.curlExec`)
    return execResult
}

module.exports.curlExec = curlExec

/*
 * Executes a SOQL query, handling the scenario where there are more than 2000 records to retrieve
 */
async function query(query) {
    await logUtils.debug(`>> ${MODULE}.query: query=${query}`)
    let result = {
        totalSize: 0,
        done: false,
        nextRecordsUrl: `/services/data/v49.0/query/?q=${query}`,
        records: []
    }
    do {
        let endpoint = `https://${configUtils.getConfig().server}${result.nextRecordsUrl}`
        let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
        let curlResult = await curlExec(curlRequest)
        result.totalSize = curlResult.totalSize
        result.done = curlResult.done
        result.nextRecordsUrl = curlResult.nextRecordsUrl
        result.records = result.records.concat(curlResult.records)
    } while (result.done === false)
    await logUtils.debug(`<< ${MODULE}.query: totalResults=${result.totalSize}, nbResults=${result.records.length}`)
    return result
}

module.exports.query = query

async function deleteRecord(objectName, id) {
    await logUtils.debug(`>> ${MODULE}.deleteRecord: objectName=${objectName}, id=${id}`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/sobjects/${objectName}/${id}`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -X DELETE -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    await curlExec(curlRequest)
    await logUtils.debug(`<< ${MODULE}.deleteRecord`)
}

module.exports.deleteRecord = deleteRecord

async function count(objectName) {
    await logUtils.debug(`>> ${MODULE}.count: objectName=${objectName}`)
    // https://www.w3schools.com/tags/ref_urlencode.ASP
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=Select+Count%28%29+FROM+${objectName}`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlExec(curlRequest)
    await logUtils.debug(`<< ${MODULE}.count: result=${curlResult.totalSize}`)
    return curlResult.totalSize
}

module.exports.count = count
