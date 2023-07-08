import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

export const emptyMapToNode = ({remaining, context})=>{
    // NOTE: no context restrictions beacuse this is a helper, and the main one should check context
    const childComponents = {
        preWhitespace: null, // token
        openingBracket: null, // token
        whitespace: null, // token
        closingBracket: null, // token
        postWhitespace: null, // token
        comment: null, // node
    }

    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context})
    childComponents.preWhitespace = extraction
    
    // 
    // openingBracket
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^\{/, from: remaining, context})
    childComponents.openingBracket = extraction
    
    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context})
    childComponents.whitespace = extraction
    
    // 
    // openingBracket
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^\}/, from: remaining, context})
    childComponents.closingBracket = extraction
    
    // 
    // postWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context})
    childComponents.postWhitespace = extraction
    
    // 
    // comment is optional
    // 
    try {
        childComponents.comment = structure.toNodeifiers.Comment({ remaining, context })
    } catch (error) {
        // only catch parse errors
        if (!(error instanceof structure.ParserError)) {
            throw error
        }
    }
    
    return new structure.Node({
        toStringifier: "Map",
        childComponents,
        formattingPreferences: {},
    })
}

export const mapToNode = ({remaining, context})=>{
    // <inlineValue>
    if (context.id == ContextIds.inlineValue) {
        return emptyMapToNode({ remaining, context })
    } else {
        // if its just an empty map
        try {
            return emptyMapToNode({ remaining, context })
        } catch (error) {
            // only catch parse errors
            if (!(error instanceof structure.ParserError)) {
                throw error
            }
        }
        // if non-empty map
        throw new Error(`Unimplemented`)
    }
}

structure.RegisterConverter({
    toNode: {
        Map: mapToNode,
    },
    toString: {
        Map: ({node, context})=>{
            // remove the comment if in a place where the comment isn't allowed
            if (context.id == ContextIds.mapKey || context.id == ContextIds.referencePath) {
                node = {...node}
                node.childComponents = {...node.childComponents}
                node.childComponents.comment = null
            }

            const isEmptyMap = node.childComponents.openingBracket != null
            if (isEmptyMap) {
                // trivial convertion, context doesn't matter
                return structure.childComponentsToString({node, context})
            } else {
                throw new Error(`Unimplemented`)
            }
            
        },
    },
})