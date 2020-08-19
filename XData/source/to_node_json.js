// 
// todo
// 
//     have all values extract their comment and trailing newline
//     parse main/root
//         check version at top
//         handle final trailing newline
//     change #literally: to #literalText
//     make the ''' block fail without a proper end quote
//     make trailing newlines in blocks require correct indent
//     FIXME: unindented newlines after the #literally: block end
//     auto detect indent
//     handle CRLF/LF issues
//     convert types to just type and extract out custom types
//     unparse
//         make sure format (like ") is viable for the content (like ")
//     add a simple "shouldn't matched but didn't because __ an improved version would be ___"
//     create a good error system (create fallback checks like parseBadReference or parseBadLiteralString)
//     record line numbers for errors

// 
const systemKeys = [ "#key:","#value", "#thisDocument", "#thisFile", "#input", "#create" ] // TODO: improve the #create, its only hear because of checks inside comment, but causes extra matching inside #reference
const indentUnit = "    "
// 
// tools
//
let findAll = (regexPattern, sourceString) => {
    let output = []
    let match
    // make sure the pattern has the global flag
    let regexPatternWithGlobal = RegExp(regexPattern,"g")
    while (match = regexPatternWithGlobal.exec(sourceString)) {
        // get rid of the string copy
        delete match.input
        // store the match data
        output.push(match)
    } 
    return output
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
let extractBlock = (string) => {
    let {remaining, extraction} = extractFirst({pattern: RegExp(`^(\n?(${indentUnit}.*|${indentUnit[0]}{0,${indentUnit.length}})$)+`,"m"), from: string})
    if (extraction) {
        // remove the indent of the block
        extraction = extraction.replace(RegExp(`^(${indentUnit}|${indentUnit[0]}{0,${indentUnit.length}})`, "mg"), "")
        // remove the newline from the begining (should always be there)
        extraction = extraction.replace(/^\n/,"")
        return {
            remaining,
            extraction,
        }
    }
    
    return {
        remaining: string,
        extraction: null,
    }
}
let parseLeadingWhitespace = (remainingXdataString) => {
    let result = extractFirst({pattern: /^( |\t)*/, from: remainingXdataString,})
    // ensure it is always a string
    result.extraction = result.extraction || ""
    return result
}
let parseWrappingWhitespaceFor = (parserFunc, remainingXdataString) => {
    var {remaining, extraction: leadingWhitespace} = parseLeadingWhitespace(remainingXdataString)
    var {remaining, extraction} = parserFunc(remaining)
    if (extraction) {
        var {remaining, extraction: trailingWhitespace} = parseLeadingWhitespace(remaining)
        leadingWhitespace  && (extraction.leadingWhitespace  = leadingWhitespace )
        trailingWhitespace && (extraction.trailingWhitespace = trailingWhitespace)
        return {
            remaining,
            extraction,
        }
    }

    return {
        remaining: remainingXdataString,
        extraction: null
    }
}
let indent = (string) => {
    return string.toString().replace(/(^|\n)/g, `$1${indentUnit}`)
}

// 
// 
// (blank lines)
// 
// 
let parseBlankLine = (remainingXdataString, indent) => {
    let {remaining, extraction: blankLine} = extractFirst({pattern: /^(\s*)(\n|$)/, from: remainingXdataString,})
    // return null if no match
    if (blankLine) {
        // remove trailing newline
        blankLine = blankLine.replace(/\n$/,"")
        return {
            remaining,
            extraction: {
                types: ["#blankLines"],
                content: blankLine
            }
        }
    }
    return {
        remaining: remainingXdataString,
        extraction: null,
    }
}

// 
// 
//  # comments
// 
// 
let parseComment
testParse({
    expectedIo: [
        {
            input: "#hello",
            output: { remaining: '#hello', extraction: null                                          },
        },
        {
            input: "    # it means literally literally \n   there werw",
            output: {
                "remaining": "   there werw",
                "extraction": {
                    "types": [
                        "#comment"
                    ],
                    "content": "it means literally literally ",
                    "leadingWhitespace": "    "
                }
            },
        },
        {
            input: " # hello",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#comment"
                    ],
                    "content": "hello",
                    "leadingWhitespace": " "
                }
            },
        },
        {
            input: "#",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#comment"
                    ],
                    "content": ""
                }
            },
        },
    ],
    ifParsedWith: parseComment = (remainingXdataString, indent) => {
        var {remaining, extraction: leadingWhitespace } = parseLeadingWhitespace(remainingXdataString)
        var {remaining, extraction: comment} = extractFirst({pattern:/^#( .*|)(\n|$)/, from: remaining})
        if (comment) {
            // remove trailing newline
            comment = comment.replace(/\n$/, "")
            extraction = {
                types: ["#comment"],
                content: comment.replace(/# ?/, ""),
            }
            leadingWhitespace && (extraction.leadingWhitespace = leadingWhitespace)
            return {
                remaining,
                extraction,
            }
        }
        
        // 
        // almost-a-comment
        // 
        // TODO: ensure this doesn't cause false positives (root parse, custom type)
        if (!remaining.match(RegExp(`^(${systemKeys.join("|")})`))) {
            var {remaining, extraction: messedUpComment} = extractFirst({pattern:/^#[^:\s]+ [^\s]+.*/, from: remaining})
            if (messedUpComment) {
                return {
                    remaining: remainingXdataString,
                    extraction: null,
                    was: messedUpComment,
                    shouldBe: messedUpComment.replace(/^#/, "# "),
                }
            }
        }
        
        // there isn't a comment (and there probably isnt a failed comment)
        return {
            remaining: remainingXdataString,
            extraction: null,
        }
    }
})

// 
// 
// {}
// []
// 
// 
let parseEmptyContainer = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^(\{\}|\[\])/, from: remainingXdataString})
    if (extraction == "{}") {
        return {
            remaining,
            extraction: {
                types: ["#mapping"],
                contains: [],
            }
        }
    } else if (extraction == "[]") {
        return {
            remaining,
            extraction: {
                types: ["#list"],
                value: extraction,
            }
        }
    }

    // TODO: spaces inside brackets warning

    return {
        remaining: remainingXdataString,
        extraction: null
    }
}

// 
// 
// null, true, false, infinite, nan
// 
// 
let parseKeywordAtom = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^(null|true|false|-?infinite|nan)/i, from: remainingXdataString})
    if (extraction) {
        return {
            remaining,
            extraction: {
                types: ["#atom"],
                value: extraction,
            }
        }
    } else {
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
}

// 
//
// 12
// 123.4324
// @356
// -2453
// -@539035
//
//
let parseNumber
testParse({
    expectedIo: [
        {
            input: "1",
            output: {"remaining":"","extraction":{"types":["#atom","#number"],"value":"1"}},
        },
        {
            input: "-1",
            output: {"remaining":"","extraction":{"types":["#atom","#number"],"value":"-1"}},
        },
        {
            input: "123.43232",
            output: {"remaining":"","extraction":{"types":["#atom","#number"],"value":"123.43232"}},
        },
        {
            input: "1.1",
            output: {"remaining":"","extraction":{"types":["#atom","#number"],"value":"1.1"}},
        },
        {
            input: ".1",
            output: {"remaining":".1","extraction":null},
        },
        {
            input: ".",
            output: {"remaining":".","extraction":null},
        },
        {
            input: "1.",
            output: {"remaining":"1.","extraction":null},
        },
        {
            input: "-123.43232",
            output: {"remaining":"","extraction":{"types":["#atom","#number"],"value":"-123.43232"}},
        },
        {
            input: "-@123.43232",
            output: {"remaining":"-@123.43232","extraction":null},
        },
        {
            input: "-@539035",
            output: {"remaining":"","extraction":{"types":["#atom","#number"],"value":"-539035","format":"@"}},
        },
        {
            input: "@539035",
            output: {"remaining":"","extraction":{"types":["#atom","#number"],"value":"539035","format":"@"}},
        },
    ],
    ifParsedWith: parseNumber = (remainingXdataString) => {
        var {remaining, extraction} = extractFirst({ pattern: /^(-?([0-9]+\.[0-9]+|@?[0-9][0-9]*))(?!\d|\.)/, from: remainingXdataString, })
        if (extraction) {
            var rawNumberString = extraction
            // remove the trailingWhitespace from the number
            var {remaining: rawNumberString, extraction: trailingWhitespace} = extractFirst({pattern: /\s*$/, from: rawNumberString})
            // check atomic format
            var {remaining: rawNumberString, extraction: isAtomicFormat} = extractFirst({pattern: /@/, from: rawNumberString})
            
            extraction = {
                types: [ "#atom", "#number", ],
                value: rawNumberString,
            }
            if (isAtomicFormat) {
                extraction.format = "@"
            }
            return {
                remaining,
                extraction,
            }
        }
        
        // TODO: add good warning when the negative sign is leading in front of the number
        // TODO: add good warning for @ and decimal number
        // TODO: add good warning for negative infinite

        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
})

// 
//
// @atom
// @infinite
// -@infinte
// @Nan
//
//
let parseNamedAtom = (remainingXdataString) => {
    // negative sign in front is still always allowed
    let {remaining, extraction} = extractFirst({pattern: /^(-?@[a-zA-Z][a-zA-Z_0-9]*)\b/, from: remainingXdataString})
    if (extraction) {
        return {
            remaining,
            extraction: {
                types: ["#atom"],
                format: "@",
                value: extraction.replace(/@/, ""),
            }
        }
    }

    return {
        remaining: remainingXdataString,
        extraction: null
    }
    // TODO: add good warning when the negative sign is leading in front of the number
    // TODO: add good warning for @ and decimal number
    // TODO: add good warning for negative infinite
}

// 
// 
// weakUnquotedString
// 
// 
let parseWeakUnquotedString = (remainingXdataString) => {
    var {remaining, extraction} = extractFirst({pattern: /^([a-zA-Z][a-zA-Z_0-9]*)(?=:)/, from: remainingXdataString})
    if (extraction) {
        return {
            remaining,
            extraction: {
                types: ["#string"],
                format: "unquoted",
                value: extraction,
            }
        }
    }
    
    // 
    // error: spaces before :
    // 
    var {remaining, extraction} = extractFirst({pattern: /^([a-zA-Z][a-zA-Z_0-9]*) +(?=:)/, from: remainingXdataString})
    if (extraction) {
        return {
            remaining: remainingXdataString,
            extraction: null,
            was: extraction,
            errorMessage: 
                `spaces aren't supported before the colon\n`+
                `just change:\n`+
                `${indent(extraction)}\n`+
                `to be:\n`+
                `${indent(extraction.replace(/ *:/,":"))}`
        }
    }

    return {
        remaining: remainingXdataString,
        extraction: null
    }
}

// 
// 
// strongUnquotedString
// 
// 
let parseStrongUnquotedString = (remainingXdataString) => {
    // - start with a-zA-Z, then anything except colon or trailing whitespace until line/block end. Error on colons and trailing whitespace
    var {remaining, extraction: unquotedString} = extractFirst({pattern: /^[a-zA-Z]([^:\n]*[^\s:])?(\n|$)/, from: remainingXdataString})
    
    if (unquotedString) {
        unquotedString = unquotedString.replace(/\n$/,"")
        return {
            remaining,
            extraction: {
                types: ["#string"],
                format: "unquoted",
                value: unquotedString,
            }
        }
    }

    // TODO: add good warning for almost unquoted block (forgot #literally:)

    // 
    // almost unquoted (but leading/trailing whitespace)
    // 
    var {remaining, extraction: almostUnquotedString} = extractFirst({pattern: /^[ \t]*[a-zA-Z]([^:\n]*)?(\n|$)/, from: remainingXdataString})
    if (almostUnquotedString) {
        let quote = literalQuoteNeededToContain(almostUnquotedString)
        return {
            remaining: remainingXdataString,
            extraction: null,
            was: almostUnquotedString,
            errorMessage: 
                `just replace:\n`+
                `${indent(almostUnquotedString)}\n`+
                `with:\n`+
                `    ${quote}${almostUnquotedString}${almostUnquotedString}\n`+
                `or just remove the whitespace that is at the end/begining (then quotes are not needed)`
        }
    }
    // 
    // almost unquoted (but contains :)
    // 
    var {remaining, extraction: almostUnquotedString} = extractFirst({pattern: /^[a-zA-Z]([^\n]*[^\s])?(\n|$)/, from: remainingXdataString})
    if (almostUnquotedString) {
        let quote = literalQuoteNeededToContain(almostUnquotedString)
        return {
            remaining: remainingXdataString,
            extraction: null,
            was: almostUnquotedString,
            errorMessage: 
                `for this part:\n`+
                `${indent(almostUnquotedString)}\n`+
                `I'm not sure if you meant for it to be a string or a (key: value) pair\n`+
                `\n`+
                `If you wanted a string, use this instead:\n`+
                `    ${quote}${almostUnquotedString}${almostUnquotedString}\n`+
                `If you wanted a (key: value) pair, put it on the line below and indent it`
        }
    }

    return {
        remaining: remainingXdataString,
        extraction: null
    }
}

// 
// quoteNeededFor
// 
let literalQuoteNeededToContain = (string) => {
    let singleQuotes = findAll(/"+/, string)
    var maxQuoteSize = Math.max(...singleQuotes.map(each=>each[0].length))
    // at least one quote needed
    if (maxQuoteSize <= 0) {
        maxQuoteSize = 1
    }
    return getStartingQuote(('"').repeat(maxQuoteSize))
}

// 
// 
// '''
// """
// 
// 
let getStartingQuote = (remainingXdataString) => {
    // starts with quote
    let quoteMatch = remainingXdataString.match(/^('|")+/)
    if (quoteMatch) {
        // 
        // quote size
        // 
        // this is valid: '''''''' which is a triple quote with two single quotes inside '''('')'''
        // multiquotes are allowed to be any power of three
        //  e.g: '''''''''''''''''''''''''' is a nine-quote with eight single quotes inside (''''''''')''''''''(''''''''')
        // find the size of the starting quote, which can be any power of three
        let logBase = 3
        let logOfSizeBaseThree = Math.log(quoteMatch[0].length) / Math.log(logBase)
        let closestPowerOfThree = Math.floor(logOfSizeBaseThree)
        let quoteSize = 3**closestPowerOfThree
        
        let startingQuote = remainingXdataString[0].repeat(quoteSize)
        return startingQuote
    }
    return null
}

// 
// 
// "strings"
// """strings"""
// 
// 
let parseLiteralInlineString
testParse({
    expectedIo: [
        {
            input: "\"string\"",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "\"",
                    "value": "string"
                }
            },
        },
        {
            input: "\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "\"",
                    "value": ""
                }
            },
        },
        {
            input: "\"\"\"string\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "\"\"\"",
                    "value": "string"
                }
            },
        },
        {
            input: "\"\"\"\"string\"\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "\"\"\"",
                    "value": "\"string\""
                }
            },
        },
        {
            input: "\"\"\"\"\"string\"\"\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "\"\"\"",
                    "value": "\"\"string\"\""
                }
            },
        },
        {
            input: "\"\"\"\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "\"\"\"",
                    "value": ""
                }
            },
        },
    ],
    ifParsedWith: parseLiteralInlineString = (remainingXdataString) => {
        let startingQuote = getStartingQuote(remainingXdataString)
        if (typeof startingQuote == 'string' && startingQuote[0] == '"') {
            var {remaining, extraction} = extractFirst({pattern: RegExp(`^${startingQuote}.*?"{0,${startingQuote.length-1}}${startingQuote}`), from: remainingXdataString})
            if (extraction) {
                // remove quotes
                extraction = extraction.replace(RegExp(`(^${startingQuote}|${startingQuote}$)`,"g"), "")
                return {
                    remaining,
                    extraction: {
                        types: ["#string"],
                        format: startingQuote,
                        value: extraction,
                    }
                }
            }
        }
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
})

// 
// 
// 123
// "string literal"
// @atom
// 
// 
let parseStaticInlineValue
testParse({
    expectedIo: [
        {
            input: "1",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#atom",
                        "#number"
                    ],
                    "value": "1"
                }
            },
        },
        {
            input: "\"hello world\"",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "\"",
                    "value": "hello world"
                }
            },
        },
        {
            input: "@atom",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#atom"
                    ],
                    "format": "@",
                    "value": "atom"
                }
            },
        },
    ],
    ifParsedWith: parseStaticInlineValue = (remainingXdataString) => {
        // then number/@atom/literalInlineString
        var {remaining, extraction} = parseNumber(remainingXdataString)
        if (!extraction) {
            var {remaining, extraction} = parseNamedAtom(remainingXdataString)
            if (!extraction) {
                var {remaining, extraction} = parseLiteralInlineString(remainingXdataString)
            }
            // TODO: consider possible case of a reference as a key
        }

        if (extraction) {
            return {
                remaining,
                extraction,
            }
        }

        return {
            remaining: remainingXdataString,
            extraction: null
        }
    },
})

// 
// 
//  #thisDocument
//  #thisFile
//  #input
// 
// 
let parseReference
testParse({
    expectedIo: [
        {
            input: "#thisDocument",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#reference"
                    ],
                    "accessList": [
                        {
                            "types": [
                                "#system"
                            ],
                            "value": "#thisDocument"
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[1]",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#reference"
                    ],
                    "accessList": [
                        {
                            "types": [
                                "#system"
                            ],
                            "value": "#thisDocument"
                        },
                        {
                            "types": [
                                "#atom",
                                "#number"
                            ],
                            "value": "1"
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][  \"thing\"]",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#reference"
                    ],
                    "accessList": [
                        {
                            "types": [
                                "#system"
                            ],
                            "value": "#thisDocument"
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "\"",
                            "value": "thing",
                            "leadingWhitespace": "  "
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][  1]",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#reference"
                    ],
                    "accessList": [
                        {
                            "types": [
                                "#system"
                            ],
                            "value": "#thisDocument"
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "types": [
                                "#atom",
                                "#number"
                            ],
                            "value": "1",
                            "leadingWhitespace": "  "
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][1  ]",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#reference"
                    ],
                    "accessList": [
                        {
                            "types": [
                                "#system"
                            ],
                            "value": "#thisDocument"
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "types": [
                                "#atom",
                                "#number"
                            ],
                            "value": "1",
                            "trailingWhitespace": "  "
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][1 ]",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#reference"
                    ],
                    "accessList": [
                        {
                            "types": [
                                "#system"
                            ],
                            "value": "#thisDocument"
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "types": [
                                "#atom",
                                "#number"
                            ],
                            "value": "1",
                            "trailingWhitespace": " "
                        }
                    ]
                }
            },
        },
    ],
    ifParsedWith: parseReference = (remainingXdataString) => {
        // TODO: selectively exclude some keys
        var {remaining, extraction} = extractFirst({pattern: RegExp(`^(${systemKeys.join("|")})`), from: remainingXdataString})
        // FIXME: #thisFile@folderPath
        if (extraction) {
            let item = extraction
            let accessList = [
                {
                    types: ["#system"],
                    value: extraction,
                }
            ]
            while (1) {
                // 
                //    find "[", then static value then "]", repeat
                // 
                // check for whitespace (even though not allowed)
                var {remaining, extraction: whitespace} = parseLeadingWhitespace(remaining)
                // find the [
                var {remaining, extraction} = extractFirst({pattern: /\[/, from: remaining})
                if (extraction) {
                    // 
                    // error: whitespace infront of [
                    // 
                    if (whitespace) {
                        let errorLine = remainingXdataString.split("\n")[0]
                        // TODO: make this a good error message about leading whitespace
                        console.error(`There's leading whitespace before the [ in:\n    ${errorLine}\nI think you'll need to change it to:\n    ${errorLine.replace(/ *\[/g, "[")}`)
                        return {
                            remaining: remainingXdataString,
                            extraction: null
                        }
                    }
                    // 
                    // found access-value
                    // 
                    var {remaining, extraction} = parseWrappingWhitespaceFor(parseStaticInlineValue, remaining)
                    if (extraction) {
                        
                        // find the ]
                        var {remaining, extraction: discard} = extractFirst({pattern: /\]/, from: remaining})
                        
                        // 
                        // successfully completed an access-value section
                        // 
                        if (extraction) {
                            // add the value and try getting another
                            accessList.push(extraction)
                            continue
                        // 
                        // error: missing ]
                        // 
                        } else {
                            // TODO: better message
                            console.error(`\nI found a ${accessList[0].value} and ['s,\nbut had trouble finding one of the closing ]'s\nhere's the line:\n    ${errorLine}\n`)
                            return {
                                remaining: remainingXdataString,
                                extraction: null
                            }
                        }
                        
                    // 
                    // error: couldn't find access-value
                    // 
                    } else {
                        let errorLine = remainingXdataString.split("\n")[0]
                        // TODO: better message
                        // TODO: better message specifically for the case of figurative string usage or special atom usage
                        console.error(`\nI found a ${accessList[0].value} and ['s,\nbut had trouble finding a number, @atom, or "literal" inside (all) of the []'s\nhere's the line:\n    ${errorLine}\n`)
                        return {
                            remaining: remainingXdataString,
                            extraction: null
                        }
                    }
                }
                // if nothing other than whitespace was captured, then thats the end
                break
            }
            // NOTE: trailing whitespace was extracted
            return {
                remaining,
                extraction: {
                    types: ["#reference"],
                    accessList,
                }
            }
            
            // TODO: warning about incomplete reference
            // TODO: give example with -@infinite to show the possibility
        }

        // TODO: warn on keys that don't exist

        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
})

// 
// {interpolation}
//
let extractInterpolations
testParse({
    expectedIo: [
        {
            input: "hello world",
            output: {
                "types": [
                    "#string"
                ],
                "value": "hello world"
            },
        },
        {
            input: "hello world {#thisDocument}",
            output: {
                "types": [
                    "#string"
                ],
                "contains": [
                    {
                        "types": [
                            "#stringPiece"
                        ],
                        "value": "hello world "
                    },
                    {
                        "types": [
                            "#reference"
                        ],
                        "accessList": [
                            {
                                "types": [
                                    "#system"
                                ],
                                "value": "#thisDocument"
                            }
                        ]
                    }
                ]
            },
        },
        {
            input: "hello world\nThis is {#thisDocument} so ",
            output: {
                "types": [
                    "#string"
                ],
                "contains": [
                    {
                        "types": [
                            "#stringPiece"
                        ],
                        "value": "hello world\nThis is "
                    },
                    {
                        "types": [
                            "#reference"
                        ],
                        "accessList": [
                            {
                                "types": [
                                    "#system"
                                ],
                                "value": "#thisDocument"
                            }
                        ]
                    },
                    {
                        "types": [
                            "#stringPiece"
                        ],
                        "value": " so "
                    }
                ]
            },
        },
        {
            input: "\n    testing\n    {#thisDocument}     testing",
            output: {
                "types": [
                    "#string"
                ],
                "contains": [
                    {
                        "types": [
                            "#stringPiece"
                        ],
                        "value": "\n    testing\n    "
                    },
                    {
                        "types": [
                            "#reference"
                        ],
                        "accessList": [
                            {
                                "types": [
                                    "#system"
                                ],
                                "value": "#thisDocument"
                            }
                        ]
                    },
                    {
                        "types": [
                            "#stringPiece"
                        ],
                        "value": "     testing"
                    }
                ]
            },
        },
    ],
    ifParsedWith: extractInterpolations = (figurativeStringContents, format) => {
        var remaining = figurativeStringContents
        let pieces = []
        let isInline = format && format.match(/^"+$/)
        if (isInline) {
            characterPattern = /^(\\.|\^.|[^\n\{\}])*/
        } else {
            characterPattern = /^(\\.|\^.|[^\{\}])*/
        }
        while (remaining.length > 0) {
            // find everything thats not a { or }
            var {remaining, extraction} = extractFirst({pattern: characterPattern, from: remaining})
            if (extraction) {
                pieces.push({
                    types: ["#stringPiece"],
                    value: extraction,
                })
            } else {
                // find the starting {
                var {remaining, extraction} = extractFirst({pattern: /^\{/, from: remaining})
                // find a value
                var {remaining, extraction} = parseWrappingWhitespaceFor(parseReference, remaining)
                if (!extraction) {
                    var {remaining, extraction} = parseWrappingWhitespaceFor(parseStaticInlineValue, remaining)
                }
                // TODO: consider if figurative strings are also allowed inside interpolation (not sure why you'd want to)
                
                // 
                // found a value
                // 
                if (extraction) {
                    // find the ending }
                    var {remaining, extraction: junk} = extractFirst({pattern: /^\}/, from: remaining})
                    if (extraction) {
                        pieces.push(extraction)
                    } else {
                        console.error(`Inside of an interpolated string, I think the (or one of the) interpolation(s) is broken\nthe string is:\n${figurativeStringContents}`)
                        return null
                    }
                // 
                // error: no value
                // 
                } else {
                    // TODO: write good error about broken string
                    console.error(`Inside of an interpolated string, I think the (or one of the) interpolation(s) is broken\nthe string is:\n${figurativeStringContents}`)
                    return null
                }
            }
        }
        if (figurativeStringContents.length == 0) {
            return {
                types: [ "#string" ],
                format,
                value: extraction,
            }
        } else {
            if (pieces.length == 1) {
                return  {
                    types: ["#string"],
                    format,
                    value: pieces[0].value,
                }
            } else {
                return  {
                    types: ["#string"],
                    format,
                    contains: pieces,
                }
            }
        }
    }
    
})

// 
// 
// 'strings'
// '''strings'''
// '''strings and {interpolations}'''
// 
// 
let parseFigurativeInlineString
testParse({
    expectedIo: [
        {
            input: "'strings'",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "'",
                    "value": "strings"
                }
            },
        },
        {
            input: "'''strings'''",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "'''",
                    "value": "strings"
                }
            },
        },
        {
            input: "''''strings''''",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "'''",
                    "value": "'strings'"
                }
            },
        },
        {
            input: "'''strings and {@interpolations}'''",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "'''",
                    "contains": [
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": "strings and "
                        },
                        {
                            "types": [
                                "#atom"
                            ],
                            "format": "@",
                            "value": "interpolations"
                        }
                    ]
                }
            },
        },
        {
            input: "'''strings and {@interpolations} with more {#thisDocument} interpolations'''",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "'''",
                    "contains": [
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": "strings and "
                        },
                        {
                            "types": [
                                "#atom"
                            ],
                            "format": "@",
                            "value": "interpolations"
                        },
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": " with more "
                        },
                        {
                            "types": [
                                "#reference"
                            ],
                            "accessList": [
                                {
                                    "types": [
                                        "#system"
                                    ],
                                    "value": "#thisDocument"
                                }
                            ]
                        },
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": " interpolations"
                        }
                    ]
                }
            },
        },
    ],
    ifParsedWith: parseFigurativeInlineString = (remainingXdataString) => {
        let startingQuote = getStartingQuote(remainingXdataString)
        if (typeof startingQuote == 'string' && startingQuote[0] == "'") {
            // match backslash escape, caret escape, or any non-newline non-quote
            let patternString = `^${startingQuote}(\\\\.|\\\^.|[^\\\n'])*?'{0,${startingQuote.length-1}}${startingQuote}`
            // if statement allows for quotes inside of multi-quoted strings
            // (yes the regex is only 1 char different)
            if (startingQuote.length > 1) {
                // match backslash escape, caret escape, or any non-newline
                patternString = `^${startingQuote}(\\\\.|\\\^.|[^\\\n])*?'{0,${startingQuote.length-1}}${startingQuote}`
            }
            var {remaining, extraction} = extractFirst({pattern: RegExp(patternString), from: remainingXdataString})
            // 
            // string found
            // 
            if (extraction) {
                // remove quotes
                extraction = extraction.replace(RegExp(`(^${startingQuote}|${startingQuote}$)`,"g"), "")
                return {
                    remaining,
                    extraction: extractInterpolations(extraction, startingQuote),
                }
            }
        }
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
})

// 
// 
// 'strings'
// '''strings'''
// "strings"
// """strings"""
// 
// 
let parseInlineString = (remainingXdataString) => {
    var result = parseLiteralInlineString(remainingXdataString)
    if (result.extraction) {
        return result
    }
    var result = parseFigurativeInlineString(remainingXdataString)
    if (result.extraction) {
        return result
    }
    return {
        remaining: remainingXdataString,
        extraction: null
    }
}

// 
// 
// #literally:
// #figuratively:
// '''
// block
// '''
// """
// block
// """
// 
// 
let parseBlockString
testParse({
    expectedIo: [
        {
            input: `#literally: like a billion`,
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#literal:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input: `#figuratively: like a billion`,
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#figurative:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input: "#figuratively:\n    like a billion",
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#figurative:MultilineBlock",
                    "value": "like a billion"
                }
            },
        },
        {
            input: "#literally:\n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "#literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half"
                }
            },
        },
        {
            input: "#literally:  \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "#literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                },
            },
        },
        {
            input: "#literally:   # it means literally literally \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "#literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                    "comment": {
                        "types": [
                            "#comment"
                        ],
                        "content": "it means literally literally ",
                        "leadingWhitespace": "   "
                    }
                }
            },
        },
        {
            input: "#figuratively:   # it means kinda \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#figurative:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                    "comment": {
                        "types": [
                            "#comment"
                        ],
                        "content": "it means kinda ",
                        "leadingWhitespace": "   "
                    }
                }
            },
        },
        {
            input: "#figuratively:  asodfsdf  # it means kinda \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "#figuratively:  asodfsdf  # it means kinda \n    like a billion\n    like a billion and a half",
                "extraction": null
            },
        },
        {
            input: "'''\n    testing\n        testing\n    '''\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "''':MultilineBlock",
                    "value": "testing\n    testing"
                },
            },
        },
        {
            input: "\"\"\"\n    testing\n        testing\n    \"\"\"\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "\"\"\":MultilineBlock",
                    "value": "testing\n    testing"
                },
            },
        },
        {
            input: "\"\n    testing\n        testing\n    \"\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "\":MultilineBlock",
                    "value": "testing\n    testing",
                },
            },
        },
        {
            input: "\n    bleh forgot quotes:\n    {#thisDocument}     testing",
            output: {
                "remaining": "\n    bleh forgot quotes:\n    {#thisDocument}     testing",
                "extraction": null
            },
        },
        {
            input: "'''\n    testing\n       {10} testing{   \"dataaaa\"}\n    '''\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "''':MultilineBlock",
                    "contains": [
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": "testing\n   "
                        },
                        {
                            "types": [
                                "#atom",
                                "#number"
                            ],
                            "value": "10"
                        },
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": " testing"
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "\"",
                            "value": "dataaaa",
                            "leadingWhitespace": "   "
                        }
                    ]
                },
            },
        },
        {
            input: "#figuratively:\n    bleh forgot quotes:\n    {#thisDocument}     testing\nunindented: 10",
            output: {
                "remaining": "\n\nunindented: 10",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#figurative:MultilineBlock",
                    "contains": [
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": "bleh forgot quotes:\n"
                        },
                        {
                            "types": [
                                "#reference"
                            ],
                            "accessList": [
                                {
                                    "types": [
                                        "#system"
                                    ],
                                    "value": "#thisDocument"
                                }
                            ]
                        },
                        {
                            "types": [
                                "#stringPiece"
                            ],
                            "value": "     testing"
                        }
                    ]
                }
            },
        },
        {
            input: "#literally: like a billion\n",
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#literal:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
    ],
    ifParsedWith: parseBlockString = (remainingXdataString) => {
        // check if multi-line exists
        let isMultiLine = remainingXdataString.match(RegExp(`^.+\\n${indentUnit}`))
        // TODO: add is-almost multi-line warning
        if (!isMultiLine) {
            // 
            // literal rest-of-line
            // 
            var {remaining, extraction} = extractFirst({pattern: /^#literally:.*/, from: remainingXdataString})
            if (extraction) {
                return {
                    remaining,
                    extraction: {
                        types: [ "#string" ],
                        format: "#literal:InlineBlock",
                        value: extraction.replace(/^#literally:/, ''),
                    },
                }
            }
            // 
            // figurative rest-of-line
            // 
            var {remaining, extraction} = extractFirst({pattern: /^#figuratively:.*/, from: remainingXdataString})
            if (extraction) {
                extraction = extraction.replace(/^#figuratively:/, '')
                return {
                    remaining,
                    extraction: extractInterpolations(extraction,"#figurative:InlineBlock"),
                }
            }
        } else {
            let quote = getStartingQuote(remainingXdataString)
            let pattern = quote || /^(#literally:|#figuratively:)/
            var {remaining, extraction} = extractFirst({pattern, from: remainingXdataString})
            var {remaining, extraction: comment} = parseComment(remaining)
            if (!comment) {
                var {remaining, extraction: miscWhitespace} = parseLeadingWhitespace(remaining)
                if (!remaining.match(/^\n/)) {
                    // TODO: improve error message
                    console.error(`issue with the the remaining text on the line:${remainingXdataString.split("\n")[0]}`)
                    return {
                        remaining: remainingXdataString,
                        extraction: null,
                    }
                }
            }
            let isLiteralQuote = (quote && quote[0] == '"')
            let isFigurativeQuote = (quote && quote[0] == "'")
            // 
            // literal MultilineBlock
            // 
            if (extraction == "#literally:" || isLiteralQuote) {
                let format = "#literal:MultilineBlock"
                var {remaining, extraction} = extractBlock(remaining)
                if (isLiteralQuote) {
                    extraction = extraction.replace(RegExp(`\\n${quote}\\s*$`),"")
                    // TODO warning about triple quotes on the same line as text
                    format = quote+":MultilineBlock"
                }
                extraction = {
                    format,
                    value: extraction,
                }
                if (comment) {
                    extraction.comment = comment
                }
                return {
                    remaining: "\n"+remaining,
                    extraction,
                }
            // 
            // figurative MultilineBlock
            // 
            } else if (extraction == "#figuratively:" || isFigurativeQuote) {
                let format = "#figurative:MultilineBlock"
                var {remaining, extraction} = extractBlock(remaining)
                if (isFigurativeQuote) {
                    extraction = extraction.replace(RegExp(`\\n${quote}\\s*$`),"")
                    format = quote+":MultilineBlock"
                }
                extraction = extractInterpolations(extraction, format)
                comment && (extraction.comment = comment)
                return {
                    remaining: "\n"+remaining,
                    extraction,
                }
            }
        }
        
        // TODO: add good warning when spaces are infront of colons
        // TODO: figure out how to return trailing comments

        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
})

// 
// VALUE
// 
let parseValue
testParse({
    expectedIo: [
        {
            input: "null",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#atom"
                    ],
                    "value": "null"
                }
            },
        },
        {
            input: "   1000",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#atom",
                        "#number"
                    ],
                    "value": "1000",
                    "leadingWhitespace": "   "
                }
            },
        },
        {
            input: "this is a test",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "unquoted",
                    "value": "this is a test"
                }
            },
        },
        {
            input: "this is a test\n",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "unquoted",
                    "value": "this is a test"
                }
            },
        },
        {
            input: "#create[date]: this is a test\n",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "unquoted",
                    "value": "this is a test"
                }
            },
        },
        {
            input: "#create[date]: #literally: 1/1/1010\n",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string",
                        "date"
                    ],
                    "format": "#literal:InlineBlock",
                    "value": " 1/1/1010"
                }
            },
        },
        {
            input: "#create[number,rational]: @pi\n",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#atom",
                        "number",
                        "rational"
                    ],
                    "format": "@",
                    "value": "pi"
                }
            },
        },
        {
            input: "\n    test: @this",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#mapping"
                    ],
                    "contains": [
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#atom"
                                ],
                                "format": "@",
                                "value": "this"
                            }
                        }
                    ]
                }
            },
        },
        {
            input: "\n    test: @this\n    test: @2",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#mapping"
                    ],
                    "contains": [
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#atom"
                                ],
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#atom",
                                    "#number"
                                ],
                                "value": "2",
                                "format": "@"
                            }
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    test: @this\n`+
                `    test: @2\n`+
                `    test: \n`+
                `        nested: 1\n`+
                `        nested2: 2\n`+
                "",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#mapping"
                    ],
                    "contains": [
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#atom"
                                ],
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#atom",
                                    "#number"
                                ],
                                "value": "2",
                                "format": "@"
                            }
                        },
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#mapping"
                                ],
                                "contains": [
                                    {
                                        "types": [
                                            "#keyedValue"
                                        ],
                                        "key": {
                                            "types": [
                                                "#string"
                                            ],
                                            "format": "unquoted",
                                            "value": "nested"
                                        },
                                        "value": {
                                            "types": [
                                                "#atom",
                                                "#number"
                                            ],
                                            "value": "1"
                                        }
                                    },
                                    {
                                        "types": [
                                            "#keyedValue"
                                        ],
                                        "key": {
                                            "types": [
                                                "#string"
                                            ],
                                            "format": "unquoted",
                                            "value": "nested2"
                                        },
                                        "value": {
                                            "types": [
                                                "#atom",
                                                "#number"
                                            ],
                                            "value": "2"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    test: @this\n`+
                `    test: @2\n`+
                `    test: \n`+
                `        nested: 1\n`+
                `   \n`+
                `        \n`+
                `   \n`+
                `        nested2: 2\n`+
                "",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#mapping"
                    ],
                    "contains": [
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#atom"
                                ],
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#atom",
                                    "#number"
                                ],
                                "value": "2",
                                "format": "@"
                            }
                        },
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "types": [
                                    "#mapping"
                                ],
                                "contains": [
                                    {
                                        "types": [
                                            "#keyedValue"
                                        ],
                                        "key": {
                                            "types": [
                                                "#string"
                                            ],
                                            "format": "unquoted",
                                            "value": "nested"
                                        },
                                        "value": {
                                            "types": [
                                                "#atom",
                                                "#number"
                                            ],
                                            "value": "1"
                                        }
                                    },
                                    {
                                        "types": [
                                            "#blankLines"
                                        ],
                                        "content": "\n\n"
                                    },
                                    {
                                        "types": [
                                            "#keyedValue"
                                        ],
                                        "key": {
                                            "types": [
                                                "#string"
                                            ],
                                            "format": "unquoted",
                                            "value": "nested2"
                                        },
                                        "value": {
                                            "types": [
                                                "#atom",
                                                "#number"
                                            ],
                                            "value": "2"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
        },
    ],
    ifParsedWith: parseValue = (remainingXdataString, indent) => {
        var remaining = remainingXdataString
        // leading whitespace
        var {remaining, extraction: leadingWhitespace} = parseLeadingWhitespace(remaining)
        // 
        // attempt custom type
        // 
        var {remaining, extraction} = extractFirst({pattern: /^(#create\[( *[a-zA-Z_]+ *)(, *[a-zA-Z_]+ *)*\]): /, from: remaining})
        // FIXME: add #create[]literal:
        let customTypes = null
        if (extraction) {
            customTypes = {
                types: extraction.replace(/^.+\[|\]:| /g, "").split(","),
            }
            if (leadingWhitespace) {
                customTypes.leadingWhitespace = leadingWhitespace
                var {remaining, extraction: leadingWhitespace} = parseLeadingWhitespace(remaining)
            }
        }

        // try normal values
        for (let each of [parseEmptyContainer, parseKeywordAtom, parseNumber, parseNamedAtom, parseInlineString, parseReference, parseBlockString, parseContainer]) {
            var {remaining, extraction} = each(remaining)
            if (extraction) {
                // 
                // handle adding leadingWhitespace
                // 
                leadingWhitespace && (extraction.leadingWhitespace = leadingWhitespace)
                // 
                // handle custom types
                // 
                if (customTypes) {
                    // TODO whitespace between custom types
                    extraction.types = extraction.types.concat(customTypes.types)
                    customTypes.leadingWhitespace && (extraction.customTypeLeadingWhitespace = customTypes.leadingWhitespace)
                }
                // 
                // handle comments/trailingWhitespace
                // 
                var {remaining, extraction: comment} = parseComment(remaining)
                if (comment) {
                    extraction.comment = comment
                }

                var {remaining, extraction: trailingWhitespace} = parseLeadingWhitespace(remaining)
                if (trailingWhitespace) {
                    extraction.trailingWhitespace = trailingWhitespace
                }
                // TODO: fail on non-comment non-newline non-end-document after a value
                var {remaining, extraction: discard} = extractFirst({pattern: /^(\n|$)/, from: remaining})
                // if there is something after the whitespace, on the same line, thats an issue
                if (discard === null) {
                    // TODO: fix this error message
                    throw Error(`When trying to parse the value on ${remainingXdataString.split("\n")[0]}\nI found this value:\n${JSON.stringify(extraction)}\nbut the line after it should be empty and instead I got:\n${JSON.stringify(remaining.split("\n")[0])}\n`)
                }
                
                return {
                    remaining,
                    extraction,
                }
            }
        }

        if (leadingWhitespace) {
            return {
                remaining: remainingXdataString,
                extraction: null
            }
        }
        // try block values
        return parseStrongUnquotedString(remaining)
    }
})

// 
// LIST ELEMENT
// 
let parseListElement
testParse({
    expectedIo: [
        {
            input: "- 10",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#atom",
                        "#number"
                    ],
                    "value": "10"
                }
            },
        },
        {
            input: "- #literally:100",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#literal:InlineBlock",
                    "value": "100"
                }
            },
        },
        {
            input: "- #figuratively:\n    200",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#string"
                    ],
                    "format": "#figurative:MultilineBlock",
                    "value": "200"
                }
            },
        },
    ],
    ifParsedWith: parseListElement = (remainingXdataString) => {
        var {remaining, extraction} = extractFirst({pattern: /- /, from: remainingXdataString})
        if (extraction) {
            let result = parseValue(remaining)
            if (result.extraction) {
                return result
            }
        }
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
})

// 
// MAP ELEMENT
// 
let parseMapElement
testParse({
    expectedIo: [
        {
            input: "myKey: 10",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#keyedValue"
                    ],
                    "key": {
                        "types": [
                            "#string"
                        ],
                        "format": "unquoted",
                        "value": "myKey"
                    },
                    "value": {
                        "types": [
                            "#atom",
                            "#number"
                        ],
                        "value": "10"
                    }
                }
            },
        },
        {
            input: "infinite: @infinite",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#keyedValue"
                    ],
                    "key": {
                        "types": [
                            "#string"
                        ],
                        "format": "unquoted",
                        "value": "infinite"
                    },
                    "value": {
                        "types": [
                            "#atom"
                        ],
                        "format": "@",
                        "value": "infinite"
                    }
                }
            },
        },
        {
            input: "1: #literally:\n     hi",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#keyedValue"
                    ],
                    "key": {
                        "types": [
                            "#atom",
                            "#number"
                        ],
                        "value": "1"
                    },
                    "value": {
                        "format": "#literal:MultilineBlock",
                        "value": " hi"
                    }
                }
            },
        },
        {
            input: "Hello World: whats up",
            output: {
                "remaining": "Hello World: whats up",
                "extraction": null
            },
        },
        {
            input: "@Hello  : @world",
            output: {
                "remaining": "",
                "extraction": {
                    "types": [
                        "#keyedValue"
                    ],
                    "key": {
                        "types": [
                            "#atom"
                        ],
                        "format": "@",
                        "value": "Hello",
                        "leadingWhitespace": "  "
                    },
                    "value": {
                        "types": [
                            "#atom"
                        ],
                        "format": "@",
                        "value": "world"
                    }
                }
            },
        },
    ],
    ifParsedWith: parseMapElement = (remainingXdataString) => {
        
        var {remaining, extraction: key} = parseStaticInlineValue(remainingXdataString)
        if (key) {
            var {remaining, extraction: trailingWhitespace} = parseLeadingWhitespace(remaining)
            if (trailingWhitespace) {
                key.leadingWhitespace = trailingWhitespace
            }
        } else {
            var {remaining, extraction: key} = parseWeakUnquotedString(remainingXdataString)
            // TODO: warning about trailing whitespace
        }

        if (key) {
            var {remaining, extraction: colon} = extractFirst({pattern: /:( | *$)/, from: remaining})
            if (colon) {
                var {remaining, extraction: value} = parseValue(remaining)
                if (value) {
                    var extraction = {
                        types: ["#keyedValue"],
                        key,
                        value,
                    }
                    value.comment && (extraction.comment = value.comment)
                    return {
                        remaining,
                        extraction,
                    }
                } else {
                    // TODO: improve error message;
                    throw Error(`found a key ${key.value}, but couldn't make sense of the value after the :`)
                }
            }
        }

        return {
            remaining: remainingXdataString,
            extraction: null,
        }
    }
})

// 
// 
// CONTAINER
// 
// 
let parseContainer
testParse({
    expectedIo: [
        {
            input: `
    testing: does this work?`,
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#mapping"
                    ],
                    "contains": [
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "testing"
                            },
                            "value": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "does this work?"
                            }
                        }
                    ]
                }
            },
        },
        {
            input: `
    testing: does this work?
    - how about this?
    - or this @atom
    `,
            output: {
                "remaining": "\n    testing: does this work?\n    - how about this?\n    - or this @atom\n    ",
                "extraction": null,
                "was": "testing: does this work?\n- how about this?\n- or this @atom\n",
                "errorMessage": "Having both keys (key: value) and list elements (- value) in the same container currently isn't supported\nJust change:\n\n    testing: does this work?\n    - how about this?\n    - or this @atom\n    \nTo be:\n\n    testing: does this work?\n    1:how about this?\n    2:or this @atom\n    "
            },
        },
        {
            input: `
    # Im doing tests wbu
    - how about this?
    - or this @atom
    `,
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#listing"
                    ],
                    "contains": [
                        {
                            "types": [
                                "#comment"
                            ],
                            "content": "Im doing tests wbu"
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "unquoted",
                            "value": "how about this?",
                            "key": 1
                        },
                        {
                            "types": [
                                "#string"
                            ],
                            "format": "unquoted",
                            "value": "or this @atom",
                            "key": 2
                        }
                    ]
                }
            },
        },
        {
            input: `
    testing: does this work?
    # so I was thinking
    `,
            output: {
                "remaining": "\n",
                "extraction": {
                    "types": [
                        "#mapping"
                    ],
                    "contains": [
                        {
                            "types": [
                                "#keyedValue"
                            ],
                            "key": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "testing"
                            },
                            "value": {
                                "types": [
                                    "#string"
                                ],
                                "format": "unquoted",
                                "value": "does this work?"
                            }
                        },
                        {
                            "types": [
                                "#comment"
                            ],
                            "content": "so I was thinking"
                        }
                    ]
                }
            },
        },
        {
            input: `
    # so I was thinking
        # thses are actually

        # just blank lines
        # not a container
    `,
            output: {
                "remaining": "\n    # so I was thinking\n        # thses are actually\n\n        # just blank lines\n        # not a container\n    ",
                "extraction": null
            },
        }
    ],
    ifParsedWith: parseContainer = (remainingXdataString) => {
        // 
        // handling leading comment/whitespace
        // 
        var remaining = remainingXdataString
        var {remaining, extraction: comment} = parseComment(remaining)
        if (!comment) {
            var {remaining, extraction: junkWhitespace} = parseLeadingWhitespace(remaining)
            if (!remaining.match("\n")) {
                // probably not a container
                // TODO: check for "thing: blah" warn about inline list/mappings
                return {
                    remaining: remainingXdataString,
                    extraction: null,
                }
            }
        }
        // 
        // handle block
        // 
        console.debug(`block before is:`,remaining)
        var {remaining, extraction: block} = extractBlock(remaining)
        console.debug(`block after is:`,block)
        // empty key or list value
        if (!block) {
            // TODO: look for failed block (not all the way indented or something)
            let failLine = remainingXdataString.split("\n")[0]
            return {
                remaining: remainingXdataString,
                extraction: null,
            }
        }
        let originalBlock = block // for errors
        let isMapping, isList
        let contains = []
        let itemCounter = 0
        let foundAtLeastOne = true
        while (foundAtLeastOne) {
            foundAtLeastOne = false
            for (let each of [parseBlankLine, parseComment, parseListElement, parseMapElement]) {
                var {remaining: block, extraction} = each(block)
                
                // for future debugging:
                ;(each == parseBlankLine) && console.debug(`parseBlankLine`)
                ;(each == parseComment) && console.debug(`parseComment`)
                ;(each == parseListElement) && console.debug(`parseListElement`)
                ;(each == parseMapElement) && console.debug(`parseMapElement`)
                console.debug(`    remaining is:`,JSON.stringify(block))
                console.debug(`    extraction is:`,extraction)

                if (extraction && each == parseListElement) {
                    isList = true
                    extraction.key = ++itemCounter
                } else if (extraction && each == parseMapElement) {
                    isMapping = true
                }
                // TODO: check for "almost" errors here and report them

                // save all the extractions
                if (extraction) {
                    foundAtLeastOne = true
                    contains.push(extraction)
                }
            }
        }
        
        // don't allow both (TODO: maybe allow in future)
        // maybe allow both if there are no directly numbered keys (e.g. 1: 'thing')
        if (isMapping && isList) {
            // replace list elements with numbered map elements
            let fixedBlock = originalBlock
            let fixedCounter = 0
            fixedBlock = fixedBlock.replace(/- /g, ()=>`${++fixedCounter}:`)
            return {
                remaining: remainingXdataString,
                extraction: null,
                was: originalBlock,
                errorMessage: 
                    `Having both keys (key: value) and list elements (- value) in the same container currently isn't supported\n`+
                    `Just change:\n`+
                    `\n`+
                    `${indent(originalBlock)}\n`+
                    `To be:\n`+
                    `\n`+
                    `${indent(fixedBlock)}`
                ,
            }
        // 
        // prep return value
        // 
        } else {
            extraction = {
                types: null,
                contains,
            }
            comment && (extraction.comment = comment)

            if (isMapping) {
                extraction.types = ["#mapping"]
            } else if (isList) {
                extraction.types = ["#listing"]
            // 
            // just comments & blank lines
            // 
            } else {
                // TODO: optimize this in the future so its not re-parsed
                return {
                    remaining: remainingXdataString,
                    extraction: null
                }
            }

            return {
                remaining: "\n"+remaining,
                extraction
            }
        }
    }
})


// 
// 
// ROOT
// 
// 
let parseRoot = (remainingXdataString)=> {
    var remaining = remainingXdataString
    let topNodes = []
    let foundAtLeastOne = true
    // first try a value
    while (foundAtLeastOne) {
        foundAtLeastOne = false
        for (let each of [parseBlankLine, parseComment, parseValue]) {
            var {remaining: block, extraction} = each(block)
            // save all the extractions
            if (extraction) {
                foundAtLeastOne = true
                topNodes.push(extraction)
            }
        }
    }
    // check for trailing 

    var {remaining, extraction} = parseValue(remainingXdataString)
    remainingXdataString
    // parse value or unindented container
}
// FIXME: parseRoot

// # Method (any language)
// - try parsing version
// - try parsing a blank line
// - try parsing a comment
// - try parsing a key
// - try parsing a list element
// - try parsing a value
// - fail, say what was attempted

// # Definitions

// Blank line goes all the way to line end

// Comments can have proceeding white space, then "# " then go until line end

// Keys must be one of
// - start with a-zA-Z, then varname 
// - start with @, then varname
// - start with 0-9, then integer/decimal
// - start with - then atom
// - start with ", then string literal
// - start with ', then string figurative
// Followed by
// - maybe #as[ Type ]
// - then ": "
// - maybe additional spaces 
// Followed by a value

// List elements can be the "-" followed by a value

// Values have 3 branching possibilities
// 1. Inline values
// Can (not must)
//     start with spaces followed by one of
//     - #create[ Type ]from:
//     - #literalString:
//     - #figurativeString:
//     - #number:
//     - #atom:
// Then must be one of
// - "null", "true", "false", "infinite", "nan"
// - start with #thisDocument for referencing a variable
// - start with #thisFile@absolutePathToFolder
// - start with #cwd
// - start with a-zA-Z, then anything except colon or trailing whitespace until line/block end. Error on colons and trailing whitespace
// - start with @, then varname 
// - start with 0-9, then integer/decimal
// - start with - or +, then number (including inf)
// - start with ", then string literal 
// - start with ', then string casual
// - "{}" for empty mapping
// - "[]" for empty list
// Then maybe followed by a space and a comment
// 2. Block values 
// Can have spaces
// Can have interpretation
// Can have spaces followed by a comment
// Must have newline followed by indent
// Then becomes recursive to the main scope
// 3. String block 
// Can have spaces
// Can have interpretation
// Must have some amount of single or double quotes
// Can have comment
// Must have newline
// Must have indented block ending with same number of quotes/newlines


module.exports = (xdataString)=>{

}