const path = require('path')
const jsonc = require('jsonc')
const fs = require("fs")
const {get} = require("good-js")

let regenerateTestTemplate = (filepath) => {
    let testObject = require(filepath)
    jsonc.readSync(filepath)
    let importPath = path.join(path.dirname(filepath), testObject.from)
    let requiredFile = require(importPath)
    let resultingTool = get({keyList: testObject.import, from: requiredFile})
    
    console.log(`testing:`,resultingTool)
    
    for (let each of testObject.expectedIo) {
        try {
            each.output = resultingTool(...each.inputs)
        } catch (error) {
            each.output = error
        }
    }
    
    // overwrite the test file
    jsonc.writeSync(filepath, testObject, {space: 4})
}


for (let each of fs.readdirSync(path.join(__dirname,"./tests"))) {
    regenerateTestTemplate(path.join(__dirname, `./tests/${each}`))
}