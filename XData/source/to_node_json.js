// 
// todo
// 
//     add the custom literal
//     auto detect indent
//     unparse
//         make sure format (like ") is viable for the content (like ")
//     warning about using the wrong quotes for a key 
//     warning for empty block talk abotu {} and [] so users know to use them
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
    let regexPatternWithGlobal = RegExp(regexPattern,[...new Set("g"+regexPattern.flags)].join(""))
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
                type: "#blankLines",
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
let parseComment = (remainingXdataString, indent) => {
    var {remaining, extraction: leadingWhitespace } = parseLeadingWhitespace(remainingXdataString)
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
                type: "#mapping",
                contains: [],
            }
        }
    } else if (extraction == "[]") {
        return {
            remaining,
            extraction: {
                type: "#listing",
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
                type: "#namedAtom",
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
let parseNumber = (remainingXdataString) => {
    var {remaining, extraction: rawNumberString} = extractFirst({ pattern: /^(-?([0-9]+\.[0-9]+|@?[0-9][0-9]*))(?!\d|\.)/, from: remainingXdataString, })
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
        remaining: remainingXdataString,
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
let parseNamedAtom = (remainingXdataString) => {
    // negative sign in front is still always allowed
    let {remaining, extraction} = extractFirst({pattern: /^(-?@[a-zA-Z][a-zA-Z_0-9]*)\b/, from: remainingXdataString})
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
                type: "#string",
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
        // remove trailing newline before saving
        unquotedString = unquotedString.replace(/\n$/,"")
        return {
            remaining,
            extraction: {
                type: "#string",
                format: "unquoted",
                value: unquotedString,
            }
        }
    }

    // TODO: add good warning for almost unquoted block (forgot #textLiteral:)

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
let parseLiteralInlineString = (remainingXdataString) => {
    let startingQuote = getStartingQuote(remainingXdataString)
    if (typeof startingQuote == 'string' && startingQuote[0] == '"') {
        var {remaining, extraction} = extractFirst({pattern: RegExp(`^${startingQuote}.*?"{0,${startingQuote.length-1}}${startingQuote}`), from: remainingXdataString})
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
        remaining: remainingXdataString,
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
let parseStaticInlineValue = (remainingXdataString) => {
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
}

// 
// 
//  #thisDocument
//  #thisFile
//  #input
// 
// 
let parseReference = (remainingXdataString) => {
    // TODO: selectively exclude some keys
    var {remaining, extraction} = extractFirst({pattern: RegExp(`^(${systemKeys.join("|")})`), from: remainingXdataString})
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
                type: "#reference",
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
let parseFigurativeInlineString = (remainingXdataString) => {
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
let parseBlockString = (remainingXdataString) => {
        // check if multi-line exists
        let isMultiLine = remainingXdataString.match(RegExp(`^.+\\n${indentUnit}`))
        // TODO: add is-almost multi-line warning
        if (!isMultiLine) {
            // 
            // literal rest-of-line
            // 
            var {remaining, extraction} = extractFirst({pattern: /^#textLiteral:.*/, from: remainingXdataString})
            if (extraction) {
                return {
                    remaining,
                    extraction: {
                        type: "#string",
                        format: "#literal:InlineBlock",
                        value: extraction.replace(/^#textLiteral:/, ''),
                    },
                }
            }
            // 
            // figurative rest-of-line
            // 
            var {remaining, extraction} = extractFirst({pattern: /^#textFigurative:.*/, from: remainingXdataString})
            if (extraction) {
                extraction = extraction.replace(/^#textFigurative:/, '')
                return {
                    remaining,
                    extraction: extractInterpolations(extraction,"#figurative:InlineBlock"),
                }
            }
        } else {
            let quote = getStartingQuote(remainingXdataString)
            let pattern = quote || /^(#textLiteral:|#textFigurative:)/
            var {remaining, extraction} = extractFirst({pattern, from: remainingXdataString})
            var {remaining, extraction: comment} = parseComment(remaining)
            if (!comment) {
                var {remaining, extraction: miscWhitespace} = parseLeadingWhitespace(remaining)
                if (!remaining.match(/^\n/)) {
                    // if there was the start of a text literal
                    if (extraction) {
                        // TODO: improve error message
                        console.error(`issue with the the remaining text on the line:${remainingXdataString.split("\n")[0]}`)
                    }
                    return {
                        remaining: remainingXdataString,
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
                            remaining: remainingXdataString,
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
                let format = "#literal:MultilineBlock"
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
                let format = "#figurative:MultilineBlock"
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
            remaining: remainingXdataString,
            extraction: null
        }
    }


// 
// VALUE
// 
let parseValue = (remainingXdataString, indent) => {
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
                        remaining: remainingXdataString,
                        extraction: null,
                        was: extraction,
                        errorMessage: `When trying to parse the value on ${remainingXdataString.split("\n")[0]}\nI found this value:\n${JSON.stringify(extraction)}\nbut the line after it should be empty and instead I got:\n${JSON.stringify(remaining.split("\n")[0])}\n`
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
                remaining: remainingXdataString,
                extraction: null
            }
        }
        // try block values
        return parseStrongUnquotedString(remaining)
    }


// 
// LIST ELEMENT
// 
let parseListElement = (remainingXdataString) => {
        var {remaining, extraction} = extractFirst({pattern: /-( +| *(?=\n))/, from: remainingXdataString})
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


// 
// MAP ELEMENT
// 
let parseMapElement = (remainingXdataString) => {
        
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
            var {remaining, extraction: colon} = extractFirst({pattern: /:( | *(?=\n))/, from: remaining})
            if (colon) {
                var {remaining, extraction: value} = parseValue(remaining)
                if (value) {
                    var extraction = {
                        type: "#keyedValue",
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


//
// container block
// 
let parseContainerBlock = (block, nodeParsers, {comment,remainingXdataString, remaining}={}) => {
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
// 
// 
// CONTAINER
// 
// 
let parseContainer = (remainingXdataString) => {
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
    var {remaining, extraction: block} = extractBlock(remaining)
    if (block) {
        return parseContainerBlock(
            block,
            [parseBlankLine, parseComment, parseListElement, parseMapElement],
            {comment,remainingXdataString, remaining}
        )
    }

    // TODO: look for failed block (not all the way indented or something)
    // TODO: good message about empty key or list value
    let failLine = remainingXdataString.split("\n")[0]
    return {
        remaining: remainingXdataString,
        extraction: null,
    }
}

// 
// 
// ROOT
// 
// 
let parseRoot = (remainingXdataString)=> {
    // stadardize to LF
    remainingXdataString = remainingXdataString.replace(/\r\n/,"\n")

    var remaining = remainingXdataString
    let topNodes = []
    let foundAtLeastOneNode = true
    let foundAtLeastOneValue = false
    
    // check edgecase of a single trailing newline (that would normally be consumed by the last value/comment)
    let handleNewline = ()=>{
        if (topNodes.length > 0) {
            let lastNode = topNodes[topNodes.length-1]
            if (lastNode.type != "#blankLines") {
                if (remainingXdataString.match(/\n$/)) {
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
        // append
        topNodes = topNodes.concat(extraction)
        return {
            isContainer: true,
            ...handleNewline(),
            documentNodes: topNodes,
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

// 
// 
// tests
// 
// 
testParse({ifParsedWith: parseComment,
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
                    "type": "#comment",
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
                    "type": "#comment",
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
                    "type": "#comment",
                    "content": ""
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseNumber,
    expectedIo: [
        {
            input: "1",
            output: {"remaining":"","extraction":{"type":"#number","value":"1"}},
        },
        {
            input: "-1",
            output: {"remaining":"","extraction":{"type":"#number","value":"-1"}},
        },
        {
            input: "123.43232",
            output: {"remaining":"","extraction":{"type":"#number","value":"123.43232"}},
        },
        {
            input: "1.1",
            output: {"remaining":"","extraction":{"type":"#number","value":"1.1"}},
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
            output: {"remaining":"","extraction":{"type":"#number","value":"-123.43232"}},
        },
        {
            input: "-@123.43232",
            output: {"remaining":"-@123.43232","extraction":null},
        },
        {
            input: "-@539035",
            output: {"remaining":"","extraction":{"type":"#number","value":"-539035","format":"@"}},
        },
        {
            input: "@539035",
            output: {"remaining":"","extraction":{"type":"#number","value":"539035","format":"@"}},
        },
    ],
})
testParse({ifParsedWith: parseLiteralInlineString,
    expectedIo: [
        {
            input: "\"string\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
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
                    "type": "#string",
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
                    "type": "#string",
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
                    "type": "#string",
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
                    "type": "#string",
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
                    "type": "#string",
                    "format": "\"\"\"",
                    "value": ""
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseStaticInlineValue,
    expectedIo: [
        {
            input: "1",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#number",
                    "value": "1"
                }
            },
        },
        {
            input: "\"hello world\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
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
                    "type": "#namedAtom",
                    "format": "@",
                    "value": "atom"
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseReference,
    expectedIo: [
        {
            input: "#thisDocument",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
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
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#number",
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
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#string",
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
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#number",
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
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#number",
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
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#number",
                            "value": "1",
                            "trailingWhitespace": " "
                        }
                    ]
                }
            },
        },
    ],
})
testParse({ifParsedWith: extractInterpolations,
    expectedIo: [
        {
            input: "hello world",
            output: {
                "type": "#string",
                "value": "hello world"
            },
        },
        {
            input: "hello world {#thisDocument}",
            output: {
                "type": "#string",
                "contains": [
                    {
                        "type": "#stringPiece",
                        "value": "hello world "
                    },
                    {
                        "type": "#reference",
                        "accessList": [
                            {
                                "type": "#system",
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
                "type": "#string",
                "contains": [
                    {
                        "type": "#stringPiece",
                        "value": "hello world\nThis is "
                    },
                    {
                        "type": "#reference",
                        "accessList": [
                            {
                                "type": "#system",
                                "value": "#thisDocument"
                            }
                        ]
                    },
                    {
                        "type": "#stringPiece",
                        "value": " so "
                    }
                ]
            },
        },
        {
            input: "\n    testing\n    {#thisDocument}     testing",
            output: {
                "type": "#string",
                "contains": [
                    {
                        "type": "#stringPiece",
                        "value": "\n    testing\n    "
                    },
                    {
                        "type": "#reference",
                        "accessList": [
                            {
                                "type": "#system",
                                "value": "#thisDocument"
                            }
                        ]
                    },
                    {
                        "type": "#stringPiece",
                        "value": "     testing"
                    }
                ]
            },
        },
    ],
})
testParse({ifParsedWith: parseFigurativeInlineString,
    expectedIo: [
        {
            input: "'strings'",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
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
                    "type": "#string",
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
                    "type": "#string",
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
                    "type": "#string",
                    "format": "'''",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "strings and "
                        },
                        {
                            "type": "#namedAtom",
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
                    "type": "#string",
                    "format": "'''",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "strings and "
                        },
                        {
                            "type": "#namedAtom",
                            "format": "@",
                            "value": "interpolations"
                        },
                        {
                            "type": "#stringPiece",
                            "value": " with more "
                        },
                        {
                            "type": "#reference",
                            "accessList": [
                                {
                                    "type": "#system",
                                    "value": "#thisDocument"
                                }
                            ]
                        },
                        {
                            "type": "#stringPiece",
                            "value": " interpolations"
                        }
                    ]
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseBlockString,
    expectedIo: [
        {
            input: `#textLiteral: like a billion`,
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "#literal:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input: `#textFigurative: like a billion`,
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "#figurative:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input: "#textFigurative:\n    like a billion",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "#figurative:MultilineBlock",
                    "value": "like a billion"
                }
            },
        },
        {
            input: "#textLiteral:\n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "#literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half"
                }
            },
        },
        {
            input: "#textLiteral:  \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "#literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                },
            },
        },
        {
            input: "#textLiteral:   # it means literally literally \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "#literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                    "comment": {
                        "type": "#comment",
                        "content": "it means literally literally ",
                        "leadingWhitespace": "   "
                    }
                }
            },
        },
        {
            input: "#textFigurative:   # it means kinda \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "#figurative:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                    "comment": {
                        "type": "#comment",
                        "content": "it means kinda ",
                        "leadingWhitespace": "   "
                    }
                }
            },
        },
        {
            input: "#textFigurative:  asodfsdf  # it means kinda \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "#textFigurative:  asodfsdf  # it means kinda \n    like a billion\n    like a billion and a half",
                "extraction": null
            },
        },
        {
            input: "'''\n    testing\n        testing\n    '''\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
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
                    "type": "#string",
                    "format": "''':MultilineBlock",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "testing\n   "
                        },
                        {
                            "type": "#number",
                            "value": "10"
                        },
                        {
                            "type": "#stringPiece",
                            "value": " testing"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "dataaaa",
                            "leadingWhitespace": "   "
                        }
                    ]
                },
            },
        },
        {
            input: "#textFigurative:\n    bleh forgot quotes:\n    {#thisDocument}     testing\nunindented: 10",
            output: {
                "remaining": "\n\nunindented: 10",
                "extraction": {
                    "type": "#string",
                    "format": "#figurative:MultilineBlock",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "bleh forgot quotes:\n"
                        },
                        {
                            "type": "#reference",
                            "accessList": [
                                {
                                    "type": "#system",
                                    "value": "#thisDocument"
                                }
                            ]
                        },
                        {
                            "type": "#stringPiece",
                            "value": "     testing"
                        }
                    ]
                }
            },
        },
        {
            input: "#textLiteral: like a billion\n",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "#literal:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input:
                `'''\n`+
                `    testing, i forgot the quote\n`+
                "",
            output: {
                "remaining": "'''\n    testing, i forgot the quote\n",
                "extraction": null,
                "was": "testing, i forgot the quote",
                "errorMessage": "For the quoted block: '''\ntesting, i forgot the quote\n\nI think you just need to add a ''' to the end of it.\nMake sure it:\n  - is on a newline (not at the end of text)\n  - its indented exactly right (not too much or too little)"
            },
        },
        {
            input:
                `'''\n`+
                `    testing, i forgot the quote\n`+
                `     '''\n`+
                "",
            output: {
                "remaining": "'''\n    testing, i forgot the quote\n     '''\n",
                "extraction": null,
                "was": "testing, i forgot the quote\n '''",
                "errorMessage": "For the quoted block: '''\ntesting, i forgot the quote\n '''\n\nI think you just need to add a ''' to the end of it.\nMake sure it:\n  - is on a newline (not at the end of text)\n  - its indented exactly right (not too much or too little)"
            },
        },
        {
            input: "'''\n    testing, i forgot the quote\n    '''\n",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "''':MultilineBlock",
                    "value": "testing, i forgot the quote"
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseValue,
    expectedIo: [
        {
            input: "null",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#namedAtom",
                    "value": "null"
                }
            },
        },
        {
            input: "   1000",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#number",
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
                    "type": "#string",
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
                    "type": "#string",
                    "format": "unquoted",
                    "value": "this is a test"
                }
            },
        },
        // FIXME
        // {
        //     input: "#create[date]: this is a test\n",
        //     output: {
        //         "remaining": "",
        //         "extraction": {
        //             "type": "#string",
        //             "customTypes": ["date"],
        //             "format": "unquoted",
        //             "value": "this is a test"
        //         }
        //     },
        // },
        {
            input: "#create[date]: #textLiteral: 1/1/1010\n",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "#literal:InlineBlock",
                    "value": " 1/1/1010",
                    "customTypes": ["date"],
                }
            },
        },
        {
            input: "#create[number,rational]: @pi\n",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#namedAtom",
                    "format": "@",
                    "value": "pi",
                    "customTypes": ["number","rational"],
                }
            },
        },
        {
            input: "\n    test: @this",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#namedAtom",
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
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#namedAtom",
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#number",
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
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#namedAtom",
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#number",
                                "value": "2",
                                "format": "@"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#mapping",
                                "contains": [
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquoted",
                                            "value": "nested"
                                        },
                                        "value": {
                                            "type": "#number",
                                            "value": "1"
                                        }
                                    },
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquoted",
                                            "value": "nested2"
                                        },
                                        "value": {
                                            "type": "#number",
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
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#namedAtom",
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#number",
                                "value": "2",
                                "format": "@"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "test"
                            },
                            "value": {
                                "type": "#mapping",
                                "contains": [
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquoted",
                                            "value": "nested"
                                        },
                                        "value": {
                                            "type": "#number",
                                            "value": "1"
                                        }
                                    },
                                    {
                                        "type": "#blankLines",
                                        "content": "\n\n"
                                    },
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquoted",
                                            "value": "nested2"
                                        },
                                        "value": {
                                            "type": "#number",
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
})
testParse({ifParsedWith: parseListElement,
    expectedIo: [
        {
            input: "- 10",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#number",
                    "value": "10"
                }
            },
        },
        {
            input: "- #textLiteral:100",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "#literal:InlineBlock",
                    "value": "100"
                }
            },
        },
        {
            input: "- #textFigurative:\n    200",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "#figurative:MultilineBlock",
                    "value": "200"
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseMapElement,
    expectedIo: [
        {
            input: "myKey: 10",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "unquoted",
                        "value": "myKey"
                    },
                    "value": {
                        "type": "#number",
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
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "unquoted",
                        "value": "infinite"
                    },
                    "value": {
                        "type": "#namedAtom",
                        "format": "@",
                        "value": "infinite"
                    }
                }
            },
        },
        {
            input: "1: #textLiteral:\n     hi",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#number",
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
            input: "\"Hello World\": whats up",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "\"",
                        "value": "Hello World"
                    },
                    "value": {
                        "type": "#string",
                        "format": "unquoted",
                        "value": "whats up"
                    }
                }
            },
        },
        {
            input: "\"list of \":\n    - 1",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "\"",
                        "value": "list of "
                    },
                    "value": {
                        "type": "#listing",
                        "contains": [
                            {
                                "type": "#number",
                                "value": "1",
                                "key": 1
                            }
                        ]
                    }
                }
            },
        },
        {
            input: "@Hello  : @world",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#namedAtom",
                        "format": "@",
                        "value": "Hello",
                        "leadingWhitespace": "  "
                    },
                    "value": {
                        "type": "#namedAtom",
                        "format": "@",
                        "value": "world"
                    }
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseContainer,
    expectedIo: [
        {
            input:
                `\n`+
                `    testing: does this work?`+
                "",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "testing"
                            },
                            "value": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "does this work?"
                            }
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    testing: does this work?\n`+
                `    - how about this?\n`+
                `    - or this @atom\n`+
                `    `+
                "",
            output: {
                "remaining": "\n    testing: does this work?\n    - how about this?\n    - or this @atom\n    ",
                "extraction": null,
                "was": "testing: does this work?\n- how about this?\n- or this @atom\n",
                "errorMessage": "Having both keys (key: value) and list elements (- value) in the same container currently isn't supported\nJust change:\n\n    testing: does this work?\n    - how about this?\n    - or this @atom\n    \nTo be:\n\n    testing: does this work?\n    1:how about this?\n    2:or this @atom\n    "
            },
        },
        {
            input:
                `\n`+
                `    # Im doing tests wbu\n`+
                `    - how about this?\n`+
                `    - or this @atom\n`+
                `    `+
                "",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#listing",
                    "contains": [
                        {
                            "type": "#comment",
                            "content": "Im doing tests wbu"
                        },
                        {
                            "type": "#string",
                            "format": "unquoted",
                            "value": "how about this?",
                            "key": 1
                        },
                        {
                            "type": "#string",
                            "format": "unquoted",
                            "value": "or this @atom",
                            "key": 2
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    testing: does this work?\n`+
                `    # so I was thinking\n`+
                `    `+
                "",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "testing"
                            },
                            "value": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "does this work?"
                            }
                        },
                        {
                            "type": "#comment",
                            "content": "so I was thinking"
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    # so I was thinking\n`+
                `        # thses are actually\n`+
                `\n`+
                `        # just blank lines\n`+
                `        # not a container\n`+
                `    `+
                "",
            output: {
                "remaining": "\n    # so I was thinking\n        # thses are actually\n\n        # just blank lines\n        # not a container\n    ",
                "extraction": null
            },
        },
        {
            input: "\n    hello: world",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "hello"
                            },
                            "value": {
                                "type": "#string",
                                "format": "unquoted",
                                "value": "world"
                            }
                        }
                    ]
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseRoot,
    expectedIo: [
        {
            input: "5",
            output: {
                "isContainer": false,
                "documentNodes": [
                    {
                        "type": "#number",
                        "value": "5"
                    }
                ],
            },
        },
        {
            input: "-5000",
            output: {
                "isContainer": false,
                "documentNodes": [
                    {
                        "type": "#number",
                        "value": "-5000"
                    }
                ],
            },
        },
        {
            input: "hello: world",
            output: {
                "isContainer": true,
                "documentNodes": [
                    {
                        "type": "#mapping",
                        "contains": [
                            {
                                "type": "#keyedValue",
                                "key": {
                                    "type": "#string",
                                    "format": "unquoted",
                                    "value": "hello"
                                },
                                "value": {
                                    "type": "#string",
                                    "format": "unquoted",
                                    "value": "world"
                                }
                            }
                        ]
                    }
                ],
            },
        },
        {
            input:
                `"list of lists":\n`+
                `    - \n`+
                `        - 1.1\n`+
                `        - 1.2\n`+
                `        - 1.3\n`+
                `    -\n`+
                `        - 2.1\n`+
                `        - 2.2\n`+
                `        - 2.3\n`+
                `        - 2.4\n`+
                "",
            output: {
                "isContainer": true,
                "endsWithSingleNewline": true,
                "documentNodes": [
                    {
                        "type": "#mapping",
                        "contains": [
                            {
                                "type": "#keyedValue",
                                "key": {
                                    "type": "#string",
                                    "format": "\"",
                                    "value": "list of lists"
                                },
                                "value": {
                                    "type": "#listing",
                                    "contains": [
                                        {
                                            "type": "#listing",
                                            "contains": [
                                                {
                                                    "type": "#number",
                                                    "value": "1.1",
                                                    "key": 1
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "1.2",
                                                    "key": 2
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "1.3",
                                                    "key": 3
                                                }
                                            ],
                                            "key": 1
                                        },
                                        {
                                            "type": "#blankLines",
                                            "content": ""
                                        },
                                        {
                                            "type": "#listing",
                                            "contains": [
                                                {
                                                    "type": "#number",
                                                    "value": "2.1",
                                                    "key": 1
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "2.2",
                                                    "key": 2
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "2.3",
                                                    "key": 3
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "2.4",
                                                    "key": 4
                                                }
                                            ],
                                            "key": 2
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ],
            },
        },
        {
            input: "5\n",
            output: {
                "isContainer": false,
                "endsWithSingleNewline": true,
                "documentNodes": [
                    {
                        "type": "#number",
                        "value": "5"
                    }
                ]
            },
        },
    ],
})