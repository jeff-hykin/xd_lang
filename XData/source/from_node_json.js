// // basically all can have leadingWhitespace / trailingWhitespace
// // any key can have a comment that goes after the key (same line as key)
// // any value in a list element can have a comment
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
const defaultIndent = "    "
let indent = (string, indentUnit) => {
    return string.toString().replace(/(^|\n)/g, `$1${indentUnit}`)
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
let stringifyKey = (selfNode) => {
    if (selfNode.key == undefined) {
        return ""
    } else {
        if (typeof selfNode.key == 'number') {
            return "- "
        } else {
            // which type
            switch (selfNode.key.type) {
                case "#number":
                    return toString(selfNode.key)+": "

                case "#namedAtom":
                    // atom keys must be in the @ format
                    selfNode.key.format = "@"
                    return toString(selfNode.key)+": "

                case "#reference":
                    return toString(selfNode.key)+": "

                case "#string":
                    // just tell the string its a key
                    // then handle the logic inside toString()
                    selfNode.key.isKey = true
                    return toString(selfNode)+": "
            
                default:
                    throw Error(`Trying to make a key out of a value that can't be a key:\n${JSON.stringify(selfNode.key)}`)
            }
        }
    }
}

let convertStringValue = (stringNode) => {
    // main string format logic:
    // Step 1: remove undefined
    // Step 2: empty strings need quotes (and thats it, skip other logic)
    // Step 3: is upquotedStrong/unquotedWeak invalid?
    // Step 4: needs to be figurative or not?
    // Step 5: Does it need to be mutliline/quoted?
    // Step 6: If quoted (and quotes are valid), how many quotes are needed?

    const isKey = stringNode.isKey
    let format = stringNode.format
    
    // 
    // interpolated or not?
    // 
    let hasInterpolation = typeof stringNode.value != 'string'
    let valueIsh 
    if (!hasInterpolation) {
        valueIsh = stringNode.value
    } else if (stringNode.contains.length == 0) {
        stringNode.value = ""
        valueIsh = ""
        hasInterpolation = false
    } else {
        // combine all the string #stringPiece's as a stand-in value
        valueIsh = stringNode.contains.filter(each=>(each.type == "#stringPiece")).join(" ")
    }
    
    // 
    // Step 1: remove undefined format
    //
    if (!(typeof format != 'string' && format.length == 0)) {
        if (isKey) {
            format = "unquotedWeak"
        } else {
            format = "unquotedStrong"
        }
    }

    // 
    // Step 2: empty strings need quotes
    //
    if (valueIsh.length == 0) {
        // if figurative, then use figurative quotes
        if (format[0] == "'" || format.startsWith("figurative")) {
            // FIXME: allow for empty multi-quotes
            // (right now this just converts them)
            return "''"
        // otherwise literal quotes are needed
        } else {
            return '""'
        }
    }

    // 
    // Step 3: upgrade away from unquotedWeak/unquotedStrong if needed
    // 
    if (format == "unquotedWeak" || format == "unquotedStrong") {
        // key side
        if (!isKey) {
            const validWeakUnquotedPattern = /^([a-zA-Z][a-zA-Z_0-9]*)$/
            if (valueIsh.match(validWeakUnquotedPattern)) {
                format = "unquotedWeak"
            // then minor-upgrade to a literal quote if it can't be unquotedWeak
            } else {
                format = '"'
            }
        // value side
        } else {
            const validStrongUnquotedPattern = /^[a-zA-Z]([^:\n]*[^\s:])?$/
            if (stringNode.value.match(validStrongUnquotedPattern)) {
                format = "unquotedStrong"
            // the minor upgrade to literal block
            } else {
                format = "literal:InlineBlock"
            }
        }
    }

    // 
    // Step 4: figurative or not
    // 
    let containsNewline = valueIsh.match(/\n/g)
    let needsToBeFigurative = hasInterpolation || (isKey && containsNewline)
    if (needsToBeFigurative) {
        // keys only have one flavor of figurative (quoted)
        // note the number of quotes is calculated later
        if (isKey) {
            format = "'"
        } else {
            // then format needs to be upgraded to smallest figurative
            if (format == "unquotedStrong" || format == "literal:InlineBlock") {
                format = "figurative:InlineBlock"
            }
            
            // switch from literal quotes to figurative
            if (format[0] == '"') {
                format = format.replace(/"/g, "'")
            }
            
            // switch from literal MultilineBlock to figurative MultilineBlock
            if (format == 'literal:MultilineBlock') {
                format = "figurative:MultilineBlock"
            }
        }
    }

    // 
    // Step 5: mutliline/quoted or not
    // 
    if (isKey) {
        // all blocks must be converted to quotes if its a key
        if (format.startsWith("figurative")) {
            format = "'"
        } else if (format.startsWith("literal")) {
            format = '"'
        }
    // if value-side
    } else if (containsNewline) {
        // upgrade literal types to Multiline
        if (
            format == "unquotedStrong" ||
            format == "literal:InlineBlock" ||
            format[0] == '"'
        ) {
            stringNode = "literal:MultilineBlock"
        // upgrade figurative blocks
        // NOTE: why not upgrade the figurative quotes too?
        //       TLDR: The auto upgrade would be good for 90% of the time
        //             but would make it impossible to reach the other 10% when needed
        //       newlines can be escaped, so upgrading that to a block would be nice
        //       but it wouldn't allow for any way to specify that a quoted string
        //       should be prefered as not-multiline output
        } else if (format == "figurative:InlineBlock") {
            format = "figurative:MultilineBlock"
        }
    }

    // 
    // Step 6: number of quotes
    // 

    // at this point the format will either be viable
    // OR it will be a quote of some kind that simply needs to be upgraded

    // literal
    let quote = format[0]
    if (quote == '"' || quote == "'") {
        // only upgrade if needed
        let minQuoteSize = minimumViableQuoteSize(valueIsh, quote)
        if (minQuoteSize > format.length) {
            quote = (quote).repeat(minQuoteSize)
        }
        // remove all quotes
        format = format.replace(RegExp(quote, "g"), "")
        // add correct amount to front (covers both block quotes and inline quotes)
        format = quote + format
    }

    // 
    // String generation
    // 
        // At this point the format should be 100% viable
        // now it is just a matter of creating the output
        // FIXME: how to decide if escaped characters should be escaped or not

    stringNode.format = format
}

let stringFormatAllowsForContents = ({format, contents}) => {
    switch (format) {
        case "unquotedWeak":
            return contents.match(/^([a-zA-Z][a-zA-Z_0-9]*)$/)
            break

        case "unquotedStrong":
            return contents.match(/^[a-zA-Z]([^:\n]*[^\s:])?$/)
            break

        case "literal:InlineBlock":
            return contents.match(/^[^\n]*$/)
            break

        case "literal:MultilineBlock":
            return true
            break

        case "figurative:InlineBlock":
            return true
            break

        case "figurative:MultilineBlock":
            return true
            break

        default:
            break
    }
    //         undefined,
    //         unquotedWeak,
    //         unquotedStrong,
    //         literal:InlineBlock,
    //         literal:MultilineBlock,
    //         figurative:InlineBlock,
    //         figurative:MultilineBlock,
    //         ''':MultilineBlock,
    //         ''',
    //         """:MultilineBlock,
    //         """,
}

module.exports = {
    minimumViableQuoteSize,
    convertStringValue,
}

// let toString = (parsedObject)=> {
//     // for easy empty strings
//     if (!parsedObject) {
//         return ""
//     } else if (parsedObject.documentNodes instanceof Array) {
//         let output = ""
//         for (let each in parsedObject.documentNodes) {
//             output += toString(each)+"\n"
//         }
//         if (parsedObject.endsWithSingleNewline) {
//             output += "\n"
//         }
//         return output
//     } else {
//         // which type
//         switch (parsedObject.type) {
//             case "#blankLines":
//                 // TODO: custom types
//                 return `${parsedObject.content}`
//                 break
            
//             case "#comment":
//                 // TODO: custom types
//                 return `${parsedObject.leadingWhitespace||""}# ${parsedObject.content}`
//                 break

//             case "#number":
//                 // TODO: custom types
//                 let value = parsedObject.value
//                 let isNegative = (value[0] == "-") ? "-" : ""
//                 let isAtomicFormat = (parsedObject.format == "@") ? "@" : ""
//                 value = value.replace(/^-/,"")
//                 // FIXME check decimal/non-decimal (decimal overrides atomic format)
//                 if (value.match(/\./g)) {
//                     return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}${isNegative}${value}${parsedObject.trailingWhitespace||""}`
//                 }
//                 return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}${isNegative}${isAtomicFormat}${value}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
//                 break

//             case "#namedAtom":
//                 // TODO: custom types
//                 let value = parsedObject.value
//                 let isNegative = (value[0] == "-") ? "-" : ""
//                 let isAtomicFormat = (parsedObject.format == "@") ? "@" : ""
//                 value = value.replace(/^-/,"")
//                 return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}${isNegative}${isAtomicFormat}${value}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
//                 break
        
//             case "#system":
//                 return `${parsedObject.value}`
//                 break

//             case "#reference":
//                 if (parsedObject.accessList.length == 1) {
//                     return `${stringifyKey(parsedObject)}${toString(parsedObject.accessList.pop())}`
//                 } else {
//                     return `${stringifyKey(parsedObject)}${parsedObject.accessList.pop()}${parsedObject.accessList.map(each=>`[${toString(each)}]`)}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
//                 }
//                 break

//             case "#listing":
//                 // TODO: custom types
//                 if (parsedObject.contains.length == 0) {
//                     return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}[]${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
//                 }
//                 let indent = parsedObject.indent || defaultIndent
//                 let output = ""
//                 for (let each of parsedObject.contains) {
//                     output += toString(each) + "\n"
//                 }
//                 // put attached comments before the indented block
//                 return stringifyKey(parsedObject)+toString(parsedObject.comment)+"\n"+indent(output, indent)
//                 break

//             case "#mapping":
//                 // TODO: custom types
//                 if (parsedObject.contains.length == 0) {
//                     return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}{}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
//                 }
//                 let indent = parsedObject.indent || defaultIndent
//                 let output = ""
//                 for (let each of parsedObject.contains) {
//                     output += toString(each) + "\n"
//                 }
//                 // put attached comments before the indented block
//                 return stringifyKey(parsedObject)+toString(parsedObject.comment)+"\n"+indent(output, indent)
//                 break

//             case "#stringPiece":
//                 return parsedObject.value

//             case "#string":
//                 if (parsedObject.isKey) {
//                     // if it can be an inline literal
//                     if (parsedObject.value != undefined) {
//                         // if undefined, then minor-upgrade to unquotedWeak
//                         if (parsedObject.format == undefined) {
//                             parsedObject.format = "unquotedWeak"
//                         }
//                         // if unquotedWeak, then minor-upgrade to a literal
//                         if (parsedObject.format == "unquotedWeak" && !contents.match(/^([a-zA-Z][a-zA-Z_0-9]*)$/)) {
//                             parsedObject.format = '"'
//                         }
//                         // make sure theres enough quotes
//                         if (parsedObject.format[0] == '"') {
//                             findAll(/"+/, parsedObject.value)
                            
//                             if (parsedObject.value)
//                         }
//                     }
//                     // check for figurative string

//                                     case "unquotedWeak":
//                     return contents.match(/^([a-zA-Z][a-zA-Z_0-9]*)$/)
//                     break

//                 case "unquotedStrong":
//                     return contents.match(/^[a-zA-Z]([^:\n]*[^\s:])?$/)
//                     break

//                 case "literal:InlineBlock":
//                     return contents.match(/^[^\n]*$/)
//                     break
//                 }
//                 let value = parsedObject.value
//                 let isNegative = (value[0] == "-") ? "-" : ""
//                 let isAtomicFormat = (parsedObject.format == "@") ? "@" : ""
//                 value = value.replace(/^-/,"")
//                 return `${parsedObject.leadingWhitespace||""}${isNegative}${isAtomicFormat}${value}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
//                 break
        
//             default:
//                 throw Error(`Node type not recognized:\n${JSON.stringify(parsedObject)}`)
//         }
//     }
// }

// // // #blankLines
// //     content


// // // #comment
// //     content


// // // #number
// //     value
// //     formats: [ undefined, "@" ]
// //     // considerations: negative/positive


// // // #namedAtom
// //     value: extraction,
// //     formats: ["@", "keyword", undefined ]
// //     // considerations: negative/positive

// // // #string
// //     value: extraction,
// //     formats: `
// //         undefined,
// //         unquotedWeak,
// //         unquotedStrong,
// //         #literal:InlineBlock,
// //         #literal:MultilineBlock,
// //         #figurative:InlineBlock,
// //         #figurative:MultilineBlock,
// //         ''':MultilineBlock,
// //         ''',
// //         """:MultilineBlock,
// //         """,
// //     `
// //     contains:

// // // #reference
// //     accessList,


// // // #system
// //     value: extraction,


// // // #mapping
// //     contains: [],

// // // #listing
// //     contains: []


// // // #keyedValue
// //     key,
// //     value,


// // document container
// // isContainer: false,
// // endsWithSingleNewline,
// // documentNodes: topNodes,