import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

import { adjectivesPrefixToNode } from "./0_1_adjectives.js"

export const specialValueToNode = ({remaining, context})=>{
    const childComponents = {
        adjectivesPrefix: null, // token
        preWhitespace: null, // string
        content: null, // string
        postWhitespace: null, // string
        comment: null, // node
    }

    // 
    // adjectivesPrefix
    // 
    try {
        var { remaining, extraction, context } = tools.extract({ pattern: adjectivesPrefixToNode, from: remaining, context })
        childComponents.adjectivesPrefix = extraction
    } catch (error) {
        if (!(error instanceof ParserError)) {
            throw error
        }
    }
    

    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.preWhitespace = extraction
    
    // 
    // content
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^(true|false|infinite|infinity|-infinite|-infinity|NaN|nullptr|null|nil|none|undefined)\b/i, from: remaining, context })
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
        toStringifier: "SpecialValue",
        childComponents,
        formattingPreferences: {},
    })
}

structure.RegisterConverter({
    toNode: {
        SpecialValue: specialValueToNode,
    },
    toString: {
        SpecialValue: ({node, context})=>{
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