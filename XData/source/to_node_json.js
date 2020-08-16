// 
// tools
// 
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
            let nextActualOutput = JSON.stringify(ifParsedWith(input))
            if (nextExpectedOutput != nextActualOutput) {
                throw Error(`\n\n\n ifParsedWith:\n${ifParsedWith}\n\nWhen calling testParse()\nThe assertion that ${JSON.stringify(input)} results in ${nextExpectedOutput} was false\ninstead it was:\n{\n    input: ${JSON.stringify(input)},\n    output: ${nextActualOutput},\n},\n`)
            }
        }
        console.log(`passed`)
    }, 0)
}


// 
// parser
// 
let parseMain

// 
// 
// (blank lines)
// 
// 
let parseBlankLine = (remainingXdataString, indent) => {
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
            input: " # hello",
            output: { remaining: ''      , extraction: { types: ['#comment'] , content: ' # hello' } },
        },
        {
            input: "#",
            output: { remaining: ''      , extraction: { types: ['#comment'] , content: '#'        } },
        },
    ],
    ifParsedWith: parseComment = (remainingXdataString, indent) => {
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

// 
// 
// {}
// []
// 
// 
let parseEmptyContainer = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^(\{\}|\[\])/, from: remainingXdataString}))
    if (extraction == "{}") {
        return {
            remaining,
            extraction: {
                types: ["#mapping"],
                value: extraction,
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
    } else {
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
}
parseEmptyContainer.canHaveLeadingWhitespace = true
parseEmptyContainer.canHaveTrailingWhitespace = true


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
parseKeywordAtom.canHaveLeadingWhitespace = true
parseKeywordAtom.canHaveTrailingWhitespace = true


// 
//
// 12
// 123.4324
// @356
// -2453
// -@539035
//
//
let parseNumber = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({ pattern: /^(-?(@?[0-9][0-9]*|[0-9]+\.[0-9]+))\b/i, from: remainingXdataString, })
    if (extraction) {
        let rawNumberString = extraction
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
    } else {
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
    // TODO: add good warning when the negative sign is leading in front of the number
    // TODO: add good warning for @ and decimal number
    // TODO: add good warning for negative infinite
}
parseNumber.canHaveLeadingWhitespace = true
parseNumber.canHaveTrailingWhitespace = true

// 
//
// @atom
// @infinite
// -@infinte
// @Nan
//
//
let parseAtom = (remainingXdataString) => {
    // negative sign in front is still always allowed
    let {remaining, extraction} = extractFirst({pattern: /^(-?@[a-zA-Z][a-zA-Z_0-9]*)\b/, from: remainingXdataString})
    if (extraction) {
        return returnSuccess({
            remaining,
            value: {
                types: ["#atom"],
                format: "@",
                value: extraction.replace(/@/, ""),
            }
        })
    } else {
        return {
            remaining: remainingXdataString,
            extraction: null
        }
    }
    // TODO: add good warning when the negative sign is leading in front of the number
    // TODO: add good warning for @ and decimal number
    // TODO: add good warning for negative infinite
}
parseAtom.canHaveLeadingWhitespace = true
parseAtom.canHaveTrailingWhitespace = true



// 
// 
// weakUnquotedString
// 
// 
let parseWeakUnquotedString = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^('|")/, from: remainingXdataString}))
    
    // FIXME: 

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
    let {remaining, extraction} = extractFirst({pattern: /^('|")/, from: remainingXdataString}))
    
    // FIXME: 
    // - start with a-zA-Z, then anything except colon or trailing whitespace until line/block end. Error on colons and trailing whitespace
    // TODO: decide if this is literal or figureative

    return {
        remaining: remainingXdataString,
        extraction: null
    }
}

// 
// 
// 'strings'
// "strings"
// '''strings'''
// """strings"""
// 
// 
let parseInlineString = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^('|")/, from: remainingXdataString}))
    
    // FIXME: add both figureative and literal inline strings with multi-quoting

    return {
        remaining: remainingXdataString,
        extraction: null
    }
}


// 
// 
//  #thisDocument
//  #thisFile@absolutePathToFolder
//  #cwd
// 
// 
let parseBuiltInValue = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^('|")/, from: remainingXdataString}))
    
    // FIXME: 
    // any of the keyterms, plus the #thisDocument[@thing] or #thisDocument["thing"] repetition
    // warn on keys that don't exist
    // allow #input

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
let parseblockString = (remainingXdataString) => {
    let {remaining, extraction} = extractFirst({pattern: /^('|")/, from: remaining}))
    
    // FIXME: add both figureative and literal inline strings with multi-quoting
    // TODO: add good warning when spaces are infront of colons
    // TODO: figure out how to return trailing comments

    return {
        remaining: remainingXdataString,
        extraction: null
    }
}



let parseValue
testParse({
    expectedIo: [
        // {
        //     input: "null",
        //     output: { remaining: '' , extraction: { types: ['#key']    , value: { types: ["#string"],            format: "unquoted", value: 'myKey'    }      } },
        // },
        // {
        //     input: "   null",
        //     output: { remaining: '' , extraction: { types: ['#key']    , value: { types: ["#string"],            format: "unquoted", value: 'myKey'    }      } },
        // },
        // {
        //     input: "-10",
        //     output: { remaining: '' , extraction: { types: ['#key']    , value: { types: ["#string"],            format: "unquoted", value: 'myKey'    }      } },
        // },
        // {
        //     input: "-10.234234",
        //     output: { remaining: '' , extraction: { types: ['#key']    , value: { types: ["#string"],            format: "unquoted", value: 'myKey'    }      } },
        // },
    ],
    ifParsedWith: parseValue = (remainingXdataString, indent) => {
        let remaining, extraction, leadingWhitespace, trailingWhitespace, customTypes, output
        remaining = remainingXdataString
        customTypes = []
        leadingWhitespace = ""

        let attempt = (remainingString, parseFunction) => {
            let {remaining, extraction} = parseFunction(remainingString))
            // FIXME: check the .canHaveLeadingWhitespace, .canHaveTrailingWhitespace
            if (extraction) {
                return {
                    remaining: remaining,
                    extraction: {
                        ...extraction,
                        leadingWhitespace,
                        customTypes,
                    }
                }
            }
        }
        
        // pull out the leading white space
        ;({remaining, extraction: leadingWhitespace} = extractFirst({pattern: /^\s*/, from: remaining}))

        // 
        // custom types
        //
        ;({remaining, extraction} = extractFirst({pattern: /^(#create\[( *[a-zA-Z_]+ *)(, *[a-zA-Z_]+ *)*\]):/, from: remaining}))
        if (extraction) {
            customTypes.push(extraction.replace(/^.+\[|\]:| /, "").split(","))
        }
        
        
        // 
        // inline
        // 

        // - "{}" for empty mapping
        // - "[]" for empty list
        output || (output = attempt(remaining, parseEmptyContainer))
        // null, true, false, infinite, nan
        output || (output = attempt(remaining, parseKeywordAtom))
        // 123, 1.23, @123, -123, -@123, -1.23
        output || (output = attempt(remaining, parseNumber))
        // @atom, -@atom
        output || (output = attempt(remaining, parseAtom))
        // : hello world, just talking here
        output || (output = attempt(remaining, parseStrongUnquotedString)) 
        // 'quoted string', "quoted", """quoted"""
        output || (output = attempt(remaining, parseInlineString)) 
        // #thisDocument, #thisFile@absolutePathToFolder
        output || (output = attempt(remaining, parseBuiltInValue))

        // TODO: parse trailing whitespace and trailing comment if possible

        // 
        // blocks
        // 
        output || (output = attempt(remaining, parseblockString))
        
        // TODO: add recursive step here

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

        // FIXME: either ": " or ":\n" don't allow non-space
        
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