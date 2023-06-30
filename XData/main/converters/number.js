import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

export const numberToNode = ({remaining, context, commentEnabled})=>{
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
        toStringifier: "Number",
        childComponents,
        formattingPreferences: {},
    })
}

structure.RegisterConverter({
    toNode: {
        Number: numberToNode,
    },
    toString: {
        Number: ({node, context})=>{
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