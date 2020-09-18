// 
// todo
// 
//     allow figurative strings as keys
//          allow nested accessLists
//     handle accessing thinginsignisngn
//     remove requirement for matching quote
//     fix the custom #create bug
//     fix messed up blank line
//     add the custom literal
//     auto detect indent
//     unparse
//         make sure format (like ") is viable for the content (like ")
//     warning about using the wrong quotes for a key 
//     warning for empty block talk abotu {} and [] so users know to use them
//     create a good error system (create fallback checks like parseBadReference or parseBadLiteralString)
//     record line numbers for errors

let { testParse, findAll, extractFirst, indent } = require("./tools")

// types are
    // #blankLines
    // #comment
    // #number
    // #namedAtom
    // #string
    // #stringPiece
    // #reference
    // #system
    // #mapping
    // #listing
const systemKeys = [ "#key:","#value", "#thisDocument", "#thisFile", "#input", "#create" ] // TODO: improve the #create, its only hear because of checks inside comment, but causes extra matching inside #reference
const indentUnit = "    "
// 
// tools
//
let extractBlock = (string) => {
    let partialIntent = `${indentUnit[0]}{0,${indentUnit.length}}`
    let indentedOrPartiallyIndentedLine = `(${indentUnit}.*|${partialIntent})`
    let {remaining, extraction} = extractFirst({pattern: RegExp(`^(\n?${indentedOrPartiallyIndentedLine}$)+`,"m"), from: string})
    if (extraction) {
        // remove the newline from the begining (should always be there)
        extraction = extraction.replace(/^\n/,"")
        
        // TODO: optimize this incomplete indent checking
        // check for possible incomplete indents
        if (extraction.match(RegExp(`^(${partialIntent})`,"m"))) {
            let matches = findAll(RegExp(`^(\n?${indentUnit}.*${indentedOrPartiallyIndentedLine}$)+`,"gm"), extraction)
            if (matches.length > 0) {
                let lastMatch = matches[matches.length-1]
                let lastIndex = lastMatch.index + lastMatch[0].length
                // limit it to the last line that was fully indented
                extraction = extraction.slice(0,lastIndex)
            }
        }
        // remove the indent of the block
        extraction = extraction.replace(RegExp(`^(${indentUnit}|${indentUnit[0]}{0,${indentUnit.length}})`, "mg"), "")
        
        
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
let parseLeadingWhitespace = (remainingData1String) => {
    let result = extractFirst({pattern: /^( |\t)*/, from: remainingData1String,})
    // ensure it is always a string
    result.extraction = result.extraction || ""
    return result
}
let parseWrappingWhitespaceFor = (parserFunc, remainingData1String) => {
    var {remaining, extraction: leadingWhitespace} = parseLeadingWhitespace(remainingData1String)
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
        remaining: remainingData1String,
        extraction: null
    }
}

// 
// 
// (blank lines)
// 
// 
let parseBlankLine = (remainingData1String, indent) => {
    let {remaining, extraction: blankLine} = extractFirst({pattern: /^(\s*)(\n|$)/, from: remainingData1String,})
    // return null if no match
    if (blankLine) {
        // remove trailing newline
        blankLine = blankLine.replace(/\n$/,"")
        return {
            remaining,
            extraction: {
                type: "#blankLines",
                content: blankLine
            }
        }
    }
    return {
        remaining: remainingData1String,
        extraction: null,
    }
}

// 
// 
//  # comments
// 
// 
let parseComment = (remainingData1String, indent) => {
    var {remaining, extraction: leadingWhitespace } = parseLeadingWhitespace(remainingData1String)
    var {remaining, extraction: comment} = extractFirst({pattern:/^#( .*|)(\n|$)/, from: remaining})
    if (comment) {
        // remove trailing newline
        comment = comment.replace(/\n$/, "")
        extraction = {
            type: "#comment",
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
                remaining: remainingData1String,
                extraction: null,
                was: messedUpComment,
                shouldBe: messedUpComment.replace(/^#/, "# "),
            }
        }
    }
    
    // there isn't a comment (and there probably isnt a failed comment)
    return {
        remaining: remainingData1String,
        extraction: null,
    }
}

// 
// 
// {}
// []
// 
// 
let parseEmptyContainer = (remainingData1String) => {
    let {remaining, extraction} = extractFirst({pattern: /^(\{\}|\[\])/, from: remainingData1String})
    if (extraction == "{}") {
        return {
            remaining,
            extraction: {
                type: "#mapping",
                contains: [],
            }
        }
    } else if (extraction == "[]") {
        return {
            remaining,
            extraction: {
                type: "#listing",
                contains: [],
            }
        }
    }

    // TODO: spaces inside brackets warning

    return {
        remaining: remainingData1String,
        extraction: null
    }
}

// 
// 
// null, true, false, infinite, nan
// 
// 
let parseKeywordAtom = (remainingData1String) => {
    let {remaining, extraction} = extractFirst({pattern: /^(null|true|false|-?infinite|nan)/i, from: remainingData1String})
    if (extraction) {
        return {
            remaining,
            extraction: {
                type: "#namedAtom",
                format: "keyword",
                value: extraction,
            }
        }
    } else {
        return {
            remaining: remainingData1String,
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
let parseNumber = (remainingData1String) => {
    var {remaining, extraction: rawNumberString} = extractFirst({ pattern: /^(-?([0-9]+\.[0-9]+|@?[0-9][0-9]*))(?!\d|\.)/, from: remainingData1String, })
    if (rawNumberString) {
        // check atomic format
        var {remaining: rawNumberString, extraction: isAtomicFormat} = extractFirst({pattern: /@/, from: rawNumberString})
        
        extraction = {
            type: "#number",
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
        remaining: remainingData1String,
        extraction: null
    }
}

// 
//
// @atom
// @infinite
// -@infinte
// @Nan
//
//
let parseNamedAtom = (remainingData1String) => {
    // negative sign in front is still always allowed
    let {remaining, extraction} = extractFirst({pattern: /^(-?@[a-zA-Z][a-zA-Z_0-9]*)\b/, from: remainingData1String})
    if (extraction) {
        return {
            remaining,
            extraction: {
                type: "#namedAtom",
                format: "@",
                value: extraction.replace(/@/, ""),
            }
        }
    }

    return {
        remaining: remainingData1String,
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
let parseWeakUnquotedString = (remainingData1String) => {
    var {remaining, extraction} = extractFirst({pattern: /^([a-zA-Z][a-zA-Z_0-9]*)(?=:)/, from: remainingData1String})
    if (extraction) {
        return {
            remaining,
            extraction: {
                type: "#string",
                format: "unquotedWeak",
                value: extraction,
            }
        }
    }
    
    // 
    // error: spaces before :
    // 
    var {remaining, extraction} = extractFirst({pattern: /^([a-zA-Z][a-zA-Z_0-9]*) +(?=:)/, from: remainingData1String})
    if (extraction) {
        return {
            remaining: remainingData1String,
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
        remaining: remainingData1String,
        extraction: null
    }
}

// 
// 
// strongUnquotedString
// 
// 
let parseStrongUnquotedString = (remainingData1String) => {
    // - start with a-zA-Z, then anything except colon or trailing whitespace until line/block end. Error on colons and trailing whitespace
    var {remaining, extraction: unquotedString} = extractFirst({pattern: /^[a-zA-Z]([^:\n]*[^\s:])?(\n|$)/, from: remainingData1String})
    
    if (unquotedString) {
        // remove trailing newline before saving
        unquotedString = unquotedString.replace(/\n$/,"")
        return {
            remaining,
            extraction: {
                type: "#string",
                format: "unquotedStrong",
                value: unquotedString,
            }
        }
    }

    // TODO: add good warning for almost unquoted block (forgot #textLiteral:)

    // 
    // almost unquoted (but leading/trailing whitespace)
    // 
    var {remaining, extraction: almostUnquotedString} = extractFirst({pattern: /^[ \t]*[a-zA-Z]([^:\n]*)?(\n|$)/, from: remainingData1String})
    if (almostUnquotedString) {
        let quote = literalQuoteNeededToContain(almostUnquotedString)
        return {
            remaining: remainingData1String,
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
    var {remaining, extraction: almostUnquotedString} = extractFirst({pattern: /^[a-zA-Z]([^\n]*[^\s])?(\n|$)/, from: remainingData1String})
    if (almostUnquotedString) {
        let quote = literalQuoteNeededToContain(almostUnquotedString)
        return {
            remaining: remainingData1String,
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
        remaining: remainingData1String,
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
let getStartingQuote = (remainingData1String) => {
    // starts with quote
    let quoteMatch = remainingData1String.match(/^('|")+/)
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
        
        let startingQuote = remainingData1String[0].repeat(quoteSize)
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
let parseLiteralInlineString = (remainingData1String) => {
    let startingQuote = getStartingQuote(remainingData1String)
    if (typeof startingQuote == 'string' && startingQuote[0] == '"') {
        var {remaining, extraction} = extractFirst({pattern: RegExp(`^${startingQuote}.*?"{0,${startingQuote.length-1}}${startingQuote}`), from: remainingData1String})
        if (extraction) {
            // remove quotes
            extraction = extraction.replace(RegExp(`(^${startingQuote}|${startingQuote}$)`,"g"), "")
            return {
                remaining,
                extraction: {
                    type: "#string",
                    format: startingQuote,
                    value: extraction,
                }
            }
        }
    }
    return {
        remaining: remainingData1String,
        extraction: null
    }
}

// 
// 
// 123
// "string literal"
// @atom
// 
// 
let parseStaticInlineValue = (remainingData1String) => {
    // then number/@atom/literalInlineString
    var {remaining, extraction} = parseNumber(remainingData1String)
    if (!extraction) {
        var {remaining, extraction} = parseNamedAtom(remainingData1String)
        if (!extraction) {
            var {remaining, extraction} = parseLiteralInlineString(remainingData1String)
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
        remaining: remainingData1String,
        extraction: null
    }
}

// 
// 
//  #thisDocument
//  #thisFile
//  #input
// 
// 
let parseReference = (remainingData1String) => {
    // TODO: selectively exclude some keys
    var {remaining, extraction} = extractFirst({pattern: RegExp(`^(${systemKeys.join("|")})`), from: remainingData1String})
    // FIXME: #thisFile@folderPath
    if (extraction) {
        let item = extraction
        let accessList = [
            {
                type: "#system",
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
                    let errorLine = remainingData1String.split("\n")[0]
                    // TODO: make this a good error message about leading whitespace
                    console.error(`There's leading whitespace before the [ in:\n    ${errorLine}\nI think you'll need to change it to:\n    ${errorLine.replace(/ *\[/g, "[")}`)
                    return {
                        remaining: remainingData1String,
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
                            remaining: remainingData1String,
                            extraction: null
                        }
                    }
                    
                // 
                // error: couldn't find access-value
                // 
                } else {
                    let errorLine = remainingData1String.split("\n")[0]
                    // TODO: better message
                    // TODO: better message specifically for the case of figurative string usage or special atom usage
                    console.error(`\nI found a ${accessList[0].value} and ['s,\nbut had trouble finding a number, @atom, or "literal" inside (all) of the []'s\nhere's the line:\n    ${errorLine}\n`)
                    return {
                        remaining: remainingData1String,
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
                type: "#reference",
                accessList,
            }
        }
        
        // TODO: warning about incomplete reference
        // TODO: give example with -@infinite to show the possibility
    }

    // TODO: warn on keys that don't exist

    return {
        remaining: remainingData1String,
        extraction: null
    }
}

// 
// {interpolation}
//
let extractInterpolations = (figurativeStringContents, format) => {
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
                type: "#stringPiece",
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
            type: "#string",
            format,
            value: extraction,
        }
    } else {
        if (pieces.length == 1) {
            return  {
                type: "#string",
                format,
                value: pieces[0].value,
            }
        } else {
            return  {
                type: "#string",
                format,
                contains: pieces,
            }
        }
    }
}

// 
// 
// 'strings'
// '''strings'''
// '''strings and {interpolations}'''
// 
// 
let parseFigurativeInlineString = (remainingData1String) => {
        let startingQuote = getStartingQuote(remainingData1String)
        if (typeof startingQuote == 'string' && startingQuote[0] == "'") {
            // match backslash escape, caret escape, or any non-newline non-quote
            let patternString = `^${startingQuote}(\\\\.|\\\^.|[^\\\n'])*?'{0,${startingQuote.length-1}}${startingQuote}`
            // if statement allows for quotes inside of multi-quoted strings
            // (yes the regex is only 1 char different)
            if (startingQuote.length > 1) {
                // match backslash escape, caret escape, or any non-newline
                patternString = `^${startingQuote}(\\\\.|\\\^.|[^\\\n])*?'{0,${startingQuote.length-1}}${startingQuote}`
            }
            var {remaining, extraction} = extractFirst({pattern: RegExp(patternString), from: remainingData1String})
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
            remaining: remainingData1String,
            extraction: null
        }
    }


// 
// 
// 'strings'
// '''strings'''
// "strings"
// """strings"""
// 
// 
let parseInlineString = (remainingData1String) => {
    var result = parseLiteralInlineString(remainingData1String)
    if (result.extraction) {
        return result
    }
    var result = parseFigurativeInlineString(remainingData1String)
    if (result.extraction) {
        return result
    }
    return {
        remaining: remainingData1String,
        extraction: null
    }
}

// 
// 
// #textLiteral:
// #textFigurative:
// '''
// block
// '''
// """
// block
// """
// 
// 
let parseBlockString = (remainingData1String) => {
        // check if multi-line exists
        let isMultiLine = remainingData1String.match(RegExp(`^.+\\n${indentUnit}`))
        // TODO: add is-almost multi-line warning
        if (!isMultiLine) {
            // 
            // literal rest-of-line
            // 
            var {remaining, extraction} = extractFirst({pattern: /^#textLiteral:.*/, from: remainingData1String})
            if (extraction) {
                return {
                    remaining,
                    extraction: {
                        type: "#string",
                        format: "literal:InlineBlock",
                        value: extraction.replace(/^#textLiteral:/, ''),
                    },
                }
            }
            // 
            // figurative rest-of-line
            // 
            var {remaining, extraction} = extractFirst({pattern: /^#textFigurative:.*/, from: remainingData1String})
            if (extraction) {
                extraction = extraction.replace(/^#textFigurative:/, '')
                return {
                    remaining,
                    extraction: extractInterpolations(extraction,"figurative:InlineBlock"),
                }
            }
        } else {
            let quote = getStartingQuote(remainingData1String)
            let pattern = quote || /^(#textLiteral:|#textFigurative:)/
            var {remaining, extraction} = extractFirst({pattern, from: remainingData1String})
            var {remaining, extraction: comment} = parseComment(remaining)
            if (!comment) {
                var {remaining, extraction: miscWhitespace} = parseLeadingWhitespace(remaining)
                if (!remaining.match(/^\n/)) {
                    // if there was the start of a text literal
                    if (extraction) {
                        // TODO: improve error message
                        console.error(`issue with the the remaining text on the line:${remainingData1String.split("\n")[0]}`)
                    }
                    return {
                        remaining: remainingData1String,
                        extraction: null,
                    }
                }
            }
            let isLiteralQuote = (quote && quote[0] == '"')
            let isFigurativeQuote = (quote && quote[0] == "'")
            let checkMissingEndingQuote = ()=> {
                if (typeof quote == 'string') {
                    let endingQuote = RegExp(`\\n${quote}\\s*$`)
                    if (!extraction.match(endingQuote)) {
                        return {
                            remaining: remainingData1String,
                            extraction: null,
                            was: extraction,
                            errorMessage:
                                `For the quoted block: ${quote}\n${extraction}\n\n`+
                                `I think you just need to add a ${quote} to the end of it.\n`+
                                `Make sure it:\n`+
                                `  - is on a newline (not at the end of text)\n`+
                                `  - its indented exactly right (not too much or too little)`
                        }
                    }
                }
            }
            // 
            // literal MultilineBlock
            // 
            if (extraction == "#textLiteral:" || isLiteralQuote) {
                let format = "literal:MultilineBlock"
                var {remaining, extraction} = extractBlock(remaining)
                if (isLiteralQuote) {
                    let endingQuoteIsMissing = checkMissingEndingQuote()
                    if (endingQuoteIsMissing) {
                        return endingQuoteIsMissing
                    }
                    // TODO: almost ending quote RegExp(`\\n[ \t]*${quote}\\s*$`)
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
            } else if (extraction == "#textFigurative:" || isFigurativeQuote) {
                let format = "figurative:MultilineBlock"
                var {remaining, extraction} = extractBlock(remaining)
                let endingQuoteIsMissing = checkMissingEndingQuote()
                if (endingQuoteIsMissing) {
                    return endingQuoteIsMissing
                }

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
            remaining: remainingData1String,
            extraction: null
        }
    }


// 
// VALUE
// 
let parseValue = (remainingData1String, indent) => {
        var remaining = remainingData1String
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
                    extraction.customTypes = customTypes.types
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
                var {remaining, extraction: endOfLine} = extractFirst({pattern: /^(\n|$)/, from: remaining})
                // if there is something after the whitespace, on the same line, thats an issue
                if (endOfLine === null) {
                    // TODO: fix this error message
                    return {
                        remaining: remainingData1String,
                        extraction: null,
                        was: extraction,
                        errorMessage: `When trying to parse the value on ${remainingData1String.split("\n")[0]}\nI found this value:\n${JSON.stringify(extraction)}\nbut the line after it should be empty and instead I got:\n${JSON.stringify(remaining.split("\n")[0])}\n`
                    }
                }
                
                return {
                    remaining,
                    extraction,
                }
            }
        }

        if (leadingWhitespace) {
            return {
                remaining: remainingData1String,
                extraction: null
            }
        }
        // try block values
        return parseStrongUnquotedString(remaining)
    }


// 
// LIST ELEMENT
// 
let parseListElement = (remainingData1String) => {
        var {remaining, extraction} = extractFirst({pattern: /-( +| *(?=\n))/, from: remainingData1String})
        if (extraction) {
            let result = parseValue(remaining)
            if (result.extraction) {
                return result
            }
        }
        return {
            remaining: remainingData1String,
            extraction: null
        }
    }


// 
// MAP ELEMENT
// 
let parseMapElement = (remainingData1String) => {
        
        var {remaining, extraction: key} = parseStaticInlineValue(remainingData1String)
        if (key) {
            var {remaining, extraction: trailingWhitespace} = parseLeadingWhitespace(remaining)
            if (trailingWhitespace) {
                key.leadingWhitespace = trailingWhitespace
            }
        } else {
            var {remaining, extraction: key} = parseWeakUnquotedString(remainingData1String)
            // TODO: warning about trailing whitespace
        }

        var {remaining, extraction: badKey} = parseFigurativeInlineString(remaining)
        if (badKey) {
            var {remaining, extraction: colon} = extractFirst({pattern: /:( | *(?=\n))/, from: remaining})
            if (colon) {
                // TODO: improve this message
                console.error(`I think you used single quotes for the key ${remainingData1String.split("\n")[0]}\ninstead of using double quotes`)
                return {
                    remaining: remainingData1String,
                    extraction: null,
                    was: badKey,
                    errorMessage:
                        `I think you used single quotes for the key ${remainingData1String.split("\n")[0]}\ninstead of using double quotes`
                }
            }
        }

        if (key) {
            var {remaining, extraction: colon} = extractFirst({pattern: /:( | *(?=\n))/, from: remaining})
            if (colon) {
                var {remaining, extraction: value} = parseValue(remaining)
                if (value) {
                    value.key = key
                    return {
                        remaining,
                        extraction: value,
                    }
                } else {
                    // TODO: improve error message;
                    throw Error(`found a key ${key.value}, but couldn't make sense of the value after the :`)
                }
            }
        }

        return {
            remaining: remainingData1String,
            extraction: null,
        }
    }


//
// container block
// 
let parseContainerBlock = (block, nodeParsers, {comment,remainingData1String, remaining}={}) => {
    // TODO: clean up this
    //     (it was extracted from parseContainer and contains too much related logic)
    //     (e.g. it shouldn't need so many arguments)
    let originalBlock = block // for errors
    let isMapping, isList
    let contains = []
    let itemCounter = 0
    let foundAtLeastOne = true
    while (foundAtLeastOne) {
        foundAtLeastOne = false
        for (let each of nodeParsers) {
            var {remaining: block, extraction} = each(block)
            
            // for future debugging:
            // ;(each == parseBlankLine) && console.debug(`parseBlankLine`)
            // ;(each == parseComment) && console.debug(`parseComment`)
            // ;(each == parseListElement) && console.debug(`parseListElement`)
            // ;(each == parseMapElement) && console.debug(`parseMapElement`)
            // console.debug(`    remaining is:`,JSON.stringify(block))
            // console.debug(`    extraction is:`,extraction)
            // console.debug(`    contains is:`,contains)

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
        output = {
            remaining: remainingData1String,
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
        console.error(`output.errorMessage is:`,output.errorMessage)
        return output
    // 
    // prep return value
    // 
    } else {
        extraction = {
            type: null,
            contains,
        }
        comment && (extraction.comment = comment)

        if (isMapping) {
            extraction.type = "#mapping"
        } else if (isList) {
            extraction.type = "#listing"
        // 
        // just comments & blank lines
        // 
        } else {
            // TODO: optimize this in the future so its not re-parsed
            return {
                remaining: remainingData1String,
                extraction: null
            }
        }

        return {
            remaining: "\n"+remaining,
            extraction
        }
    }
}
// 
// 
// CONTAINER
// 
// 
let parseContainer = (remainingData1String) => {
    // 
    // handling leading comment/whitespace
    // 
    var remaining = remainingData1String
    var {remaining, extraction: comment} = parseComment(remaining)
    if (!comment) {
        var {remaining, extraction: junkWhitespace} = parseLeadingWhitespace(remaining)
        if (!remaining.match("\n")) {
            // probably not a container
            // TODO: check for "thing: blah" warn about inline list/mappings
            return {
                remaining: remainingData1String,
                extraction: null,
            }
        }
    }
    // 
    // handle block
    // 
    var {remaining, extraction: block} = extractBlock(remaining)
    if (block) {
        return parseContainerBlock(
            block,
            [parseBlankLine, parseComment, parseListElement, parseMapElement],
            {comment,remainingData1String, remaining}
        )
    }

    // TODO: look for failed block (not all the way indented or something)
    // TODO: good message about empty key or list value
    let failLine = remainingData1String.split("\n")[0]
    return {
        remaining: remainingData1String,
        extraction: null,
    }
}

// 
// 
// ROOT
// 
// 
let parseRoot = (remainingData1String)=> {
    // stadardize to LF
    remainingData1String = remainingData1String.replace(/\r\n/,"\n")

    var remaining = remainingData1String
    let topNodes = []
    let foundAtLeastOneNode = true
    let foundAtLeastOneValue = false
    
    // check edgecase of a single trailing newline (that would normally be consumed by the last value/comment)
    let handleNewline = ()=>{
        if (topNodes.length > 0) {
            let lastNode = topNodes[topNodes.length-1]
            if (lastNode.type == '#mapping' || lastNode.type == '#listing') {
                if (lastNode.contains.length > 0) {
                    lastNode = lastNode.contains[0]
                }
            }
            if (lastNode.type != "#blankLines") {
                if (remainingData1String.match(/\n$/)) {
                    return { endsWithSingleNewline: true }
                }
            }
        }
        return {}
    }

    // 
    // first try a value
    // 
    while (foundAtLeastOneNode) {
        foundAtLeastOneNode = false
        for (let each of [parseBlankLine, parseComment, parseValue]) {
            var {remaining, extraction} = each(remaining)
            // save all the extractions
            if (extraction) {
                foundAtLeastOneNode = true
                topNodes.push(extraction)
                if (each == parseValue) {
                    foundAtLeastOneValue = true
                }
            }
        }
    }
    
    // check for document end
    if (remaining.length == 0) {
        return {
            isContainer: false,
            ...handleNewline(),
            documentNodes: topNodes,
        }
    } else if (foundAtLeastOneValue) {
        // TODO, handle error of value and map-element / list-element existing
        console.error(`remaining is:`,remaining)
        console.error(`error (probably) value and map-element / list-element existing same time`)
        return null
    }

    // 
    // try parsing it as a container
    // 
    // TODO: make this cleaner (don't indent it and add the newline)
    var {remaining, extraction} = parseContainerBlock(remaining, [parseBlankLine, parseComment, parseListElement, parseMapElement])
    if (extraction) {
        extraction.contains = [...topNodes, ...extraction.contains]
        return {
            isContainer: true,
            ...handleNewline(),
            documentNodes: [extraction],
        }
    } else {
        // error: container failed and value failed and comments/blankLine failed
        // TODO: make this a good error
        console.error(`something in the syntax isn't right, thats all I know:`,remaining)
        return null
    }
    
    // TODO: check for trailing newline
    // TODO: get the version
}

module.exports = {
    parseData1: parseRoot,
    components: {
        parseComment,
        parseNumber,
        parseLiteralInlineString,
        parseStaticInlineValue,
        parseReference,
        extractInterpolations,
        parseFigurativeInlineString,
        parseBlockString,
        parseValue,
        parseListElement,
        parseMapElement,
        parseContainer,
        parseRoot,
    }
}