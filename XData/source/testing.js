const path = require('path')
const fs = require("fs")
const {get} = require("good-js")

let regenerateTestTemplate = (filepath) => {
    let testObject = require(filepath)
    let importPath = path.join(path.dirname(filepath), testObject.from)
    let requiredFile = require(importPath)
    let resultingTool = get({keyList: testObject.import, from: requiredFile})

    for (let each of testObject.expectedIo) {
        each.output = resultingTool(...each.inputs)
    }
    
    // overwrite the test file
    fs.writeFileSync(filepath, JSON.stringify(testObject, 0, 4))

    console.debug(`resultingTool is:`,resultingTool)
}

regenerateTestTemplate(path.join(__dirname, "./tests/minimumViableQuoteSize.json"))
