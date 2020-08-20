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
    let isValueString = typeof parsedObject.value == 'string'
    let valueIsh 
    if (isValueString) {
        valueIsh = stringNode.value
    } else if (parsedObject.contains.length == 0) {
        parsedObject.value = ""
        valueIsh = ""
        isValueString = true
    } else {
        // combine all the string #stringPiece's as a stand-in value
        valueIsh = parsedObject.contains.filter(each=>(each.type == "#stringPiece")).join(" ")
    }
    if (parsedObject.isKey) {
        // if it has a newline it needs a figurative quote
        if (valueIsh.match(/\n/g)) {
            parsedObject.format = "'"
        } else {
            // if undefined, then minor-upgrade to unquotedWeak
            if (parsedObject.format == undefined) {
                parsedObject.format = "unquotedWeak"
            }
            
            // empty string needs quotes, use "" unless figurative was specified
            if (valueIsh.length = 0) {
                if (parsedObject.format[0] == "'" || parsedObject.format.startsWith("figurative")) {
                    return "''"
                } else {
                    return '""'
                }
            }
            
            // if unquotedWeak, then minor-upgrade to a literal
            if (parsedObject.format == "unquotedWeak" && !valueIsh.match(/^([a-zA-Z][a-zA-Z_0-9]*)$/)) {
                parsedObject.format = '"'
            }
        }
        
        // convert names to quote preferences
        if (parsedObject.format.startsWith("figurative")) {
            parsedObject.format = "'"
        } else if (parsedObject.format.startsWith("literal")) {
            parsedObject.format = '"'
        }

        // 
        // formats are now locked-in to being either unquoted, single, or double quoted
        //

    // 
    // if not a key
    // 
    } else {
        // prefer to be as close to the given format as possible
        // only "upgrade" the format, never auto-downgrade
        
        
        // 
        // can be literal
        // 
        if (isValueString) {
            // need to be upgraded
            if (parsedObject.format == undefined || parsedObject.format == "unquotedWeak") {
                parsedObject.format = "unquotedStrong"
            }
            
            // need to be upgraded
            if (parsedObject.format == "unquotedStrong" && !parsedObject.value.match(/^[a-zA-Z]([^:\n]*[^\s:])?$/)) {
                parsedObject.format = "literal:InlineBlock"
            }
        // 
        // needs figurative
        // 
        } else {
            // upgrade to smallest figurative
            if (parsedObject.format == undefined || parsedObject.format == "unquotedWeak" || parsedObject.format == "literal:InlineBlock") {
                parsedObject.format = "figurative:InlineBlock"
            }
            
            // switch from literal quotes to figurative
            if (parsedObject.format[0] == '"') {
                parsedObject.format = parsedObject.format.replace(/"/g, "'")
            }
            
            // switch from literal MultilineBlock to figurative MultilineBlock
            if (parsedObject.format == 'literal:MultilineBlock') {
                parsedObject.format = "figurative:MultilineBlock"
            }
        }
        
        let containsNewline = !valueIsh.match(/^[^\n]*$/)
        if (containsNewline) {
            // FIXME: need to upgrade inline literal quotes

            // need upgrade inline blocks to MultilineBlock
            if (parsedObject.format.match(/:InlineBlock/g) && !valueIsh.match(/^[^\n]*$/)) {
                parsedObject.format = parsedObject.format.replace(/InlineBlock/g, "MultilineBlock")
            }
        }
    }

    // at this point the format will either be viable
    // OR it will be a quote of some kind that simply needs to be upgraded

    // calculate number of quotes needed
    if (parsedObject.format[0] == '"') {
        // only upgrade if needed
        let minQuoteSize = minimumViableQuoteSize(parsedObject.value, '"')
        if (minQuoteSize > parsedObject.format.length) {
            parsedObject.format = ('"').repeat(minQuoteSize)
        }
    } else {
        let stringContentsToCheck = parsedObject.value
        if (!isValueString) {
            stringContentsToCheck = parsedObject.contains.filter(each=>(each.type == "#stringPiece")).join(" ")
        }
        let minQuoteSize = minimumViableQuoteSize(kindaConcatStringPieces, "'")
        if (minQuoteSize > parsedObject.format.length) {
            parsedObject.format = ("'").repeat(minQuoteSize)
        }
    }
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

let toString = (parsedObject)=> {
    // for easy empty strings
    if (!parsedObject) {
        return ""
    } else if (parsedObject.documentNodes instanceof Array) {
        let output = ""
        for (let each in parsedObject.documentNodes) {
            output += toString(each)+"\n"
        }
        if (parsedObject.endsWithSingleNewline) {
            output += "\n"
        }
        return output
    } else {
        // which type
        switch (parsedObject.type) {
            case "#blankLines":
                // TODO: custom types
                return `${parsedObject.content}`
                break
            
            case "#comment":
                // TODO: custom types
                return `${parsedObject.leadingWhitespace||""}# ${parsedObject.content}`
                break

            case "#number":
                // TODO: custom types
                let value = parsedObject.value
                let isNegative = (value[0] == "-") ? "-" : ""
                let isAtomicFormat = (parsedObject.format == "@") ? "@" : ""
                value = value.replace(/^-/,"")
                // FIXME check decimal/non-decimal (decimal overrides atomic format)
                if (value.match(/\./g)) {
                    return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}${isNegative}${value}${parsedObject.trailingWhitespace||""}`
                }
                return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}${isNegative}${isAtomicFormat}${value}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
                break

            case "#namedAtom":
                // TODO: custom types
                let value = parsedObject.value
                let isNegative = (value[0] == "-") ? "-" : ""
                let isAtomicFormat = (parsedObject.format == "@") ? "@" : ""
                value = value.replace(/^-/,"")
                return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}${isNegative}${isAtomicFormat}${value}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
                break
        
            case "#system":
                return `${parsedObject.value}`
                break

            case "#reference":
                if (parsedObject.accessList.length == 1) {
                    return `${stringifyKey(parsedObject)}${toString(parsedObject.accessList.pop())}`
                } else {
                    return `${stringifyKey(parsedObject)}${parsedObject.accessList.pop()}${parsedObject.accessList.map(each=>`[${toString(each)}]`)}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
                }
                break

            case "#listing":
                // TODO: custom types
                if (parsedObject.contains.length == 0) {
                    return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}[]${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
                }
                let indent = parsedObject.indent || defaultIndent
                let output = ""
                for (let each of parsedObject.contains) {
                    output += toString(each) + "\n"
                }
                // put attached comments before the indented block
                return stringifyKey(parsedObject)+toString(parsedObject.comment)+"\n"+indent(output, indent)
                break

            case "#mapping":
                // TODO: custom types
                if (parsedObject.contains.length == 0) {
                    return `${stringifyKey(parsedObject)}${parsedObject.leadingWhitespace||""}{}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
                }
                let indent = parsedObject.indent || defaultIndent
                let output = ""
                for (let each of parsedObject.contains) {
                    output += toString(each) + "\n"
                }
                // put attached comments before the indented block
                return stringifyKey(parsedObject)+toString(parsedObject.comment)+"\n"+indent(output, indent)
                break

            case "#stringPiece":
                return parsedObject.value

            case "#string":
                if (parsedObject.isKey) {
                    // if it can be an inline literal
                    if (parsedObject.value != undefined) {
                        // if undefined, then minor-upgrade to unquotedWeak
                        if (parsedObject.format == undefined) {
                            parsedObject.format = "unquotedWeak"
                        }
                        // if unquotedWeak, then minor-upgrade to a literal
                        if (parsedObject.format == "unquotedWeak" && !contents.match(/^([a-zA-Z][a-zA-Z_0-9]*)$/)) {
                            parsedObject.format = '"'
                        }
                        // make sure theres enough quotes
                        if (parsedObject.format[0] == '"') {
                            findAll(/"+/, parsedObject.value)
                            
                            if (parsedObject.value)
                        }
                    }
                    // check for figurative string

                                    case "unquotedWeak":
                    return contents.match(/^([a-zA-Z][a-zA-Z_0-9]*)$/)
                    break

                case "unquotedStrong":
                    return contents.match(/^[a-zA-Z]([^:\n]*[^\s:])?$/)
                    break

                case "literal:InlineBlock":
                    return contents.match(/^[^\n]*$/)
                    break
                }
                let value = parsedObject.value
                let isNegative = (value[0] == "-") ? "-" : ""
                let isAtomicFormat = (parsedObject.format == "@") ? "@" : ""
                value = value.replace(/^-/,"")
                return `${parsedObject.leadingWhitespace||""}${isNegative}${isAtomicFormat}${value}${parsedObject.trailingWhitespace||""}${toString(parsedObject.comment)}`
                break
        
            default:
                throw Error(`Node type not recognized:\n${JSON.stringify(parsedObject)}`)
        }
    }
}

// // #blankLines
//     content


// // #comment
//     content


// // #number
//     value
//     formats: [ undefined, "@" ]
//     // considerations: negative/positive


// // #namedAtom
//     value: extraction,
//     formats: ["@", "keyword", undefined ]
//     // considerations: negative/positive

// // #string
//     value: extraction,
//     formats: `
//         undefined,
//         unquotedWeak,
//         unquotedStrong,
//         #literal:InlineBlock,
//         #literal:MultilineBlock,
//         #figurative:InlineBlock,
//         #figurative:MultilineBlock,
//         ''':MultilineBlock,
//         ''',
//         """:MultilineBlock,
//         """,
//     `
//     contains:

// // #reference
//     accessList,


// // #system
//     value: extraction,


// // #mapping
//     contains: [],

// // #listing
//     contains: []


// // #keyedValue
//     key,
//     value,


// document container
// isContainer: false,
// endsWithSingleNewline,
// documentNodes: topNodes,