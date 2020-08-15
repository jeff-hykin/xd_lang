// 
// tools
// 
let extractFirst = ({ pattern, from}) => {
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
    for (let each of expectedIo) {
        let {input, output} = each
        let nextExpectedOutput = JSON.stringify(output)
        let nextActualOutput = JSON.stringify(ifParsedWith(input))
        if (nextExpectedOutput != nextActualOutput) {
            throw Error(`\n\n\n ifParsedWith:\n${ifParsedWith}\n\nWhen calling testParse()\nThe assertion that ${JSON.stringify(input)} results in ${nextExpectedOutput} was false\ninstead it was:\n{\n    input: ${JSON.stringify(input)},\n    output: ${nextActualOutput},\n},\n`)
        }
    }
    return true
}


// 
// parser
// 
let parseMain


let parseBlankLine = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^\s*$/, from: remainingXdataString,})
    // return null if no match
    if (!extraction) {
        return {
            remaining: remainingXdataString,
            extraction: null,
        }
    } else {
        return {
            remaining,
            extraction: {
                types: ["#blankLines"],
                content: extraction
            }
        }
    }
}

let parseComment
testParse({
    expectedIo: [
        {
            input: "#hello",
            output: { remaining: '#hello', extraction: null                                          },
        },
        {
            input: " # hello",
            output: { remaining: ''      , extraction: { types: ['#comment'] , content: ' # hello' } },
        },
        {
            input: "#",
            output: { remaining: ''      , extraction: { types: ['#comment'] , content: '#'        } },
        },
    ],
    ifParsedWith: parseComment = (remainingXdataString) => {
        let {remaining, extraction} = extractFirst({pattern:/^\s*#( .*|)\n?$/, from: remainingXdataString})
        // return null if no match
        if (!extraction) {
            return {
                remaining: remainingXdataString,
                extraction: null,
            }
        } else {
            return {
                remaining,
                extraction: {
                    types: ["#comment"],
                    // TODO: break up into indent and 
                    content: extraction
                }
            }
        }
    }
})

let parseKey
testParse({
    expectedIo: [
        {
            input: "myKey:",
            output: { remaining: '' , extraction: { types: ['#key']    , value: { types: ["#string"],            format: "unquoted", value: 'myKey'    }      } },
        },
        {
            input: "infinite:",
            output: { remaining: '' , extraction: { types: ['#key']    , value: { types: ["#string"],            format: "unquoted", value: 'infinite' }      } },
        },
        {
            input: "1:",
            output: {"remaining":"","trailingWhitespace":"","extraction":{"types":["#key"],"value":{"types":["#number","#atom"],"format":null,"value":"1"}}},
        },
        {
            input: "Hello World:",
            output: {"remaining":"Hello World:","extraction":null},
        },
        {
            input: "@Hello  :",
            output: {"remaining":"","trailingWhitespace":"  ","extraction":{"types":["#key"],"value":{"types":["#atom"],"format":"@","value":"Hello"}}},
        },
    ],
    ifParsedWith: parseKey = (remainingXdataString) => {
        let remaining, extraction, trailingWhitespace
        let returnSuccess = ({remaining, value}) => {
            return {
                remaining: remaining,
                trailingWhitespace,
                extraction: {
                    types: ["#key"],
                    value: value,
                }
            }
        }
        
        // 
        // unquoted string
        // 
        ({remaining, extraction} = extractFirst({pattern: /^([a-zA-Z][a-zA-Z_0-9]*):/, from: remainingXdataString}))
        if (extraction) {
            let value = extraction.replace(/:$/, "")
            return returnSuccess({
                remaining,
                value: {
                    types: ["#string"],
                    format: "unquoted",
                    value,
                }
            })
        }
        // FIXME: literal string, figurative string
        // TODO: add nice error when this fails because of whitespace
        // TODO: maybe add an "#ignoreTrailingWhitespace" feature people can add

        //
        // number
        //
        ({remaining, extraction} = extractFirst({ pattern: /^(-?(@?[0-9][0-9]*|[0-9]+\.[0-9]))\s*:/i, from: remainingXdataString, }))
        if (extraction) {
            // remove the colon
            let rawNumberString = extraction.replace(/:$/, "")
            // remove the trailingWhitespace from the number
            ;({remaining: rawNumberString, extraction: trailingWhitespace} = extractFirst({pattern: /\s*$/, from: rawNumberString}))
            // check atomic format
            ;({remaining: rawNumberString, extraction: isAtomicFormat} = extractFirst({pattern: /@/, from: rawNumberString}))

            return returnSuccess({
                remaining,
                value: {
                    types: [ "#number", "#atom", ],
                    format: isAtomicFormat? "@" : null,
                    value: rawNumberString,
                }
            })
        }
        // TODO: add good warning when the negative sign is leading in front of the number
        // TODO: add good warning for @ and decimal number
        // TODO: add good warning for negative infinite

        // 
        // non-numeric atom
        // 
        // negative sign in front is still always allowed
        ({remaining, extraction} = extractFirst({pattern: /^(-?@[a-zA-Z][a-zA-Z_0-9]*)\s*:/, from: remainingXdataString}))
        if (extraction) {
            // remove the colon and at-symbol
            let value = extraction.replace(/:$/, "").replace(/@/, "")
            // remove the trailingWhitespace from the number
            ;({remaining: value, extraction: trailingWhitespace} = extractFirst({pattern: /\s*$/, from: value}))
            
            return returnSuccess({
                remaining,
                value: {
                    types: ["#atom"],
                    format: "@",
                    value,
                }
            })
        }
        
        // failure
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
})
// TODO: #as[ Type ]


// 
// keyterms
// 
// let {remaining, extraction} = extractFirst(remainingXdataString, /^(#thisDocument|#thisFile@absolutePathToFolder|#thisFile@absolutePathToFolder)\s*:/)
// if (extraction) {
//     return {
//         remaining,
//         extraction: {
//             types: ["#keyterm"],
//             value: extraction
//         },
//     }
// }

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