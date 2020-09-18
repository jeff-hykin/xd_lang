const path = require('path')
const fs = require("fs")
const {get} = require("good-js")

let regenerateTestTemplate = (filepath) => {
    let testObject = require(filepath)
    let importPath = path.join(path.dirname(filepath), testObject.from)
    let requiredFile = require(importPath)
    let resultingTool = get({keyList: testObject.import, from: requiredFile})
    
    console.debug(`resultingTool is:`,resultingTool)
    
    for (let each of testObject.expectedIo) {
        try {
            each.output = resultingTool(...each.inputs)
        } catch (error) {
            each.output = error
        }
    }
    
    // overwrite the test file
    fs.writeFileSync(filepath, JSON.stringify(testObject, 0, 4))
}


for (let each of fs.readdirSync(path.join(__dirname,"./tests"))) {
    regenerateTestTemplate(path.join(__dirname, `./tests/${each}`))
}