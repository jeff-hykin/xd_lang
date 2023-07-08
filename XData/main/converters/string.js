import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"
import { capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString, regex, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier, findAll } from "https://deno.land/x/good@1.3.0.4/string.js"

export const extractStartingQuote = ({from, context, quote}) => {
    let totalCount = 0
    let startSize = 1
    while (from[totalCount] == quote) {
        totalCount += 1
        if (totalCount >= startSize*3) {
            startSize = startSize*3
        }
    }
    if (totalCount == 0) {
        throw new structure.ParserError({ message: `cant extract starting quote from: ${from}`, context })
    }

    return tools.extract({
        pattern: regex`^${from.slice(0, startSize)}`,
        from,
        context,
    })
}

export const minimumViableQuoteSize = (stringContent, quote) => {
    if (stringContent == null || quote == null) {
        return null
    }
    let quotes = findAll(new RegExp(`${quote}+`), stringContent)
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

export const inlineStringLiteralToNode = ({remaining, context})=>{
    const childComponents = {
        preWhitespace: null, // string
        startQuote: null, // string
        content: null, // string
        endQuote: null, // string
        postWhitespace: null, // string
        comment: null, // node
    }

    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.preWhitespace = extraction
    
    // 
    // startQuote
    // 
    var { remaining, extraction, context } = extractStartingQuote({ quote: `"`, from: remaining, context })
    childComponents.startQuote = extraction
    
    // 
    // content
    // 
    var { remaining, extraction, context } = tools.extract({
        pattern: regex`${  /^[^\n]*/  }${  childComponents.startQuote  }`,
        from: remaining,
        context 
    })
    childComponents.content = extraction.slice(0,-childComponents.startQuote.length)

    // 
    // endQuote
    // 
    childComponents.endQuote = childComponents.startQuote
    

    // 
    // postWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.postWhitespace = extraction
    
    // 
    // comment is optional in certain contexts
    // 
    if (context.id != ContextIds.mapKey && context.id != ContextIds.referencePath) {
        try {
            childComponents.comment = structure.toNodeifiers.Comment({ remaining, context })
        } catch (error) {
            // only catch parse errors
            if (!(error instanceof structure.ParserError)) {
                throw error
            }
        }
    }

    // 
    // return
    // 
    return new structure.Node({
        toStringifier: "String",
        childComponents,
        formattingPreferences: {},
    })
}

export const blockStringLiteralToNode = ({remaining, context})=>{
    const childComponents = {
        leadingComments: null, // array of nodes
        preWhitespace: null, // string
        startQuote: null, // string
        content: null, // string
        endQuote: null, // string
        postWhitespace: null, // string
        trailingComments: null, // array of nodes
    }

    // 
    // comments are optional before first quote
    // 
        // TODO^ 
        // if (context.id != ContextIds.mapKey && context.id != ContextIds.referencePath) {
        //     try {
        //         childComponents.comment = structure.toNodeifiers.Comment({ remaining, context })
        //     } catch (error) {
        //         // only catch parse errors
        //         if (!(error instanceof structure.ParserError)) {
        //             throw error
        //         }
        //     }
        // }

    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^[ \n]*/, from: remaining, context })
    childComponents.preWhitespace = extraction
    // figure out indent
    const indent = childComponents.preWhitespace.split("\n").slice(-1)[0]
    childComponents.startQuote = indent
    
    // 
    // startQuote
    // 
    var { remaining, extraction, context } = extractStartingQuote({ quote: `"`, from: remaining, context })
    const startQuote = extraction
    childComponents.startQuote += extraction
    var { remaining, extraction, context } = tools.extract({ pattern: /^\n/, from: remaining, context })
    childComponents.startQuote += extraction
    
    // 
    // content
    // 
    var { remaining, extraction, context } = tools.extract({
        pattern: regex`${/(.|\s)*?\n/}${indent}${startQuote}`,
        from: remaining,
        context 
    })
    childComponents.content = extraction.slice(0,-(childComponents.startQuote.length)).replace(regex`^${indent}`.mg, "")

    // 
    // endQuote
    // 
    childComponents.endQuote = "\n"+childComponents.startQuote
    
    // 
    // postWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.postWhitespace = extraction
    
    // 
    // comments are optional after newline of last quote
    // 
        // TODO^ 
        // if (context.id != ContextIds.mapKey && context.id != ContextIds.referencePath) {
        //     try {
        //         childComponents.comment = structure.toNodeifiers.Comment({ remaining, context })
        //     } catch (error) {
        //         // only catch parse errors
        //         if (!(error instanceof structure.ParserError)) {
        //             throw error
        //         }
        //     }
        // }

    // 
    // return
    // 
    return new structure.Node({
        toStringifier: "String",
        childComponents,
        formattingPreferences: {},
    })
}

export const stringToNode = ({remaining, context})=>{
    if (context.id == ContextIds.mapKey) {
        // literal with no newlines
        return inlineStringLiteralToNode({remaining, context})
    } else {
        // if inlineStringLiteralToNode matches, then all good in any context
        try {
            return inlineStringLiteralToNode({remaining, context})
        } catch (error) {
            console.debug(`error is:`,error)
        }
        throw Error(`not implemented`)
    }
}

// Assumes: context specific things have been handled (e.g. comment stripping)
export const inlineStringNodeToString = ({node, context}) => {
    const numberOfQuotes = minimumViableQuoteSize(node.childComponents.content, `"`)
    node.childComponents.endQuote = node.childComponents.startQuote = `"`.repeat(numberOfQuotes)
    return structure.childComponentsToString({node, context})
}

export const stringNodeToString = ({node, context})=>{
    // TODO: automatically determine the best format, starting by defaulting to the given format, but falling back if needed depending on context and chosen formatting options
    
    // remove the comment if in a place where the comment isn't allowed
    if (context.id == ContextIds.mapKey || context.id == ContextIds.referencePath) {
        node = {...node}
        node.childComponents = {...node.childComponents}
        node.childComponents.comment = null
    }
    
    // valid in all contexts
    return inlineStringNodeToString({node, context})
}

structure.RegisterConverter({
    toNode: {
        String: stringToNode,
    },
    toString: {
        String: stringToNode,
    },
})