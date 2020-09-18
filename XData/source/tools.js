let findAll = (regexPattern, sourceString) => {
    let output = []
    let match
    // make sure the pattern has the global flag
    let regexPatternWithGlobal = RegExp(regexPattern,[...new Set("g"+regexPattern.flags)].join(""))
    while (match = regexPatternWithGlobal.exec(sourceString)) {
        // get rid of the string copy
        delete match.input
        // store the match data
        output.push(match)
    } 
    return output
}

let indent = (string) => {
    return string.toString().replace(/(^|\n)/g, `$1${indentUnit}`)
}

let extractFirst = ({ pattern, from }) => {
    let match = from.match(pattern)
    if (match) {
        return {
            remaining: from.slice(0, match.index)+ from.slice(match.index + match[0].length, from.length),
            extraction: match[0]
        }
    } else {
        return {
            remaining: from,
            extraction: null
        }
    }
}

let testParse = ({ expectedIo, ifParsedWith}) => {
    // do at the end of the file 
    setTimeout(() => {    
        for (let each of expectedIo) {
            let {input, output} = each
            let nextExpectedOutput = JSON.stringify(output)
            console.log(`    input is:`,JSON.stringify(input))
            let result
            let wasError
            try {
                result = ifParsedWith(input)
            } catch (error) {
                wasError = error
            }
            if (result == undefined) {
                result = null
            }
            if (wasError) {
                console.log(`\n\n\n ifParsedWith:\n${ifParsedWith}\n\nWhen calling testParse()\nThe assertion that ${JSON.stringify(input)} results in ${nextExpectedOutput} was false\ninstead resulted in an error:\n${wasError}`)
                throw wasError
            }
            let nextActualOutput = JSON.stringify(result, null, 4).replace(/(\n)/g, "$1            ")
            if (JSON.stringify(JSON.parse(nextExpectedOutput)) != JSON.stringify(JSON.parse(nextActualOutput))) {

                console.log(`\n\n\n ifParsedWith:\n${ifParsedWith}\n\nWhen calling testParse()\nThe assertion that ${JSON.stringify(input)} results in ${nextExpectedOutput} was false\ninstead it was:\n        {\n            input: ${JSON.stringify(input)},\n            output: ${nextActualOutput},\n        },\n`)
                process.exit()
            }
        }
        console.log(`passed`)
    }, 0)
}

let minimumViableQuoteSize = (stringContent, quote) => {
    let quotes = findAll(RegExp(`${quote}+`), stringContent)
    let maxQuoteSize = Math.max(...quotes.map(each=>each[0].length))
    let minViableQuoteSize = 1
    if (maxQuoteSize > 0) {
        let logBase = 3
        let logOfSizeBaseThree = Math.log(maxQuoteSize+1) / Math.log(logBase)
        let closestLargerPowerOfThree = Math.ceil(logOfSizeBaseThree)
        minViableQuoteSize = 3**closestLargerPowerOfThree
    }
    return minViableQuoteSize
}

module.exports = {
    findAll,
    extractFirst,
    indent,
    testParse,
    minimumViableQuoteSize,
}