import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

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

    return tools.extract({ pattern: from.slice(0, startSize), from: from, context })
}

export const minimumViableQuoteSize = (stringContent, quote) => {
    if (stringContent == null || quote == null) {
        return null
    }
    let quotes = utils.findAll(RegExp(`${quote}+`), stringContent)
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
        preWhitespace: null, // token
        content: null, // token
        postWhitespace: null, // token
        comment: null, // node
    }

    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.preWhitespace = extraction
    
    // 
    // content
    // 
    var { remaining, extraction, context } = extractStartingQuote({ quote: `"`, from: remaining, context })
    childComponents.startQuote = extraction
    
    // 
    // content
    // 
        // FIXME: need to get content and end quote
    var { remaining, extraction, context } = tools.extract({ pattern: /^(-|\+)?\d+(\.\d+)?/i, from: remaining, context })
    childComponents.content = extraction

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

structure.RegisterConverter({
    toNode: {
        String: stringToNode,
    },
    toString: {
        String: ({node, context})=>{
            // remove the comment if in a place where the comment isn't allowed
            if (context.id == ContextIds.mapKey || context.id == ContextIds.referencePath) {
                node = {...node}
                node.childComponents = {...node.childComponents}
                node.childComponents.comment = null
            }
            
            // valid in all contexts
            return structure.childComponentsToString({node, context})
        },
    },
})