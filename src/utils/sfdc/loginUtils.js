const MODULE = "loginUtils"
const util = require('util')
const child_process = require('child_process')
const exec = util.promisify(child_process.exec)

const curlUtils = require('./curlUtils')
const logUtils = require('../logUtils')
const configUtils = require('../configUtils')

async function loginSoap(server, username, password) {
    await logUtils.debug(`>> ${MODULE}.loginSoap: server=${server}, username=${username}, password=${password}`)
    let endpoint = `https://${server}/services/Soap/u/43.0`
    let body = '\
<?xml version=\\"1.0\\" encoding=\\"utf-8\\" ?>\
<env:Envelope xmlns:xsd=\\"http://www.w3.org/2001/XMLSchema\\" xmlns:xsi=\\"http://www.w3.org/2001/XMLSchema-instance\\" xmlns:env=\\"http://schemas.xmlsoap.org/soap/envelope/\\">\
<env:Body>\
<n1:login xmlns:n1=\\"urn:partner.soap.sforce.com\\">\
<n1:username>[USERNAME]</n1:username>\
<n1:password>[PASSWORD]</n1:password>\
</n1:login>\
</env:Body>\
</env:Envelope>'

    body = body.replace("[USERNAME]", username)
        .replace("[PASSWORD]", password)

    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "SOAPAction: login" -H "Content-Type: text/xml; charset=UTF-8" --data \"${body}\" ${endpoint}`
    let curlResultAsString = await exec(curlRequest, {encoding: 'utf8'})
    curlResultAsString = curlResultAsString.stdout
    let faultStringBegin = curlResultAsString.indexOf("<faultstring>")
    if (faultStringBegin !== -1) {
        let faultStringEnd = curlResultAsString.indexOf("</faultstring>")
        let faultString = curlResultAsString.substring(faultStringBegin + "<faultstring>".length, faultStringEnd)
        throw new Error(faultString)
    }
    await logUtils.debug(`${MODULE}.loginSoap: curlResultAsString=${curlResultAsString}`)
    let sessionIdBegin = curlResultAsString.indexOf("<sessionId>")
    let sessionIdEnd = curlResultAsString.indexOf("</sessionId>")
    let sessionId = curlResultAsString.substring(sessionIdBegin + "<sessionId>".length, sessionIdEnd)
    await logUtils.debug(`<< ${MODULE}.loginSoap: result=${sessionId}`)
    return sessionId
}

module.exports.loginSoap = loginSoap

/*
 * Just to test that login was successful
 */
async function getOrganizationName()  {
    await logUtils.debug(`>> ${MODULE}.getOrganizationName`)
    let endpoint = `https://${configUtils.getConfig().server}/services/data/v49.0/query/?q=SELECT+Name+from+Organization`
    let curlRequest = `curl --silent -H "X-PrettyPrint:1" -H "Authorization: Bearer ${configUtils.getToken()}" ${endpoint}`
    let curlResult = await curlUtils.curlExec(curlRequest)
    let result = curlResult.records[0].Name
    await logUtils.debug(`<< ${MODULE}.getOrganizationName: name=${result}`)
    return result
}

module.exports.getOrganizationName = getOrganizationName
