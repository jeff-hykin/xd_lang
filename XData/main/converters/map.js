import * as structure from "../structure.js"
import { ParserError, CantDecodeContext, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

const encodeEmptyMap = ({remaining, context})=>{
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
    var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context})
    components.preWhitespace = extraction
    
    // 
    // openingBracket
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /\{/, from: remaining, context})
    components.openingBracket = extraction
    
    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context})
    components.whitespace = extraction
    
    // 
    // openingBracket
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /\}/, from: remaining, context})
    components.closingBracket = extraction
    
    // 
    // postWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context})
    components.postWhitespace = extraction
    
    // 
    // comment is optional
    // 
    try {
        components.comment = structure.decoders.Comment({ remaining, context })
    } catch (error) {
        // only catch parse errors
        if (!(error instanceof structure.ParserError)) {
            throw error
        }
    }
    
    return new structure.Node({
        decoder: "Map",
        childComponents,
        formattingPreferences: {},
    })
}

structure.Converter({
    encoders: {
        Map: ({remaining, context})=>{
            // <inlineValue>
            if (context.id == ContextIds.inlineValue) {
                return encodeEmptyMap({ remaining, context })
            } else {
                try {
                    return encodeEmptyMap({ remaining, context })
                } catch (error) {
                    // only catch parse errors
                    if (!(error instanceof structure.ParserError)) {
                        throw error
                    }
                }
                throw new Error(`Unimplemented`)
            }
        },
    },
    decoders: {
        Map: ({node, context})=>{
            // FIXME: chopping comments
            const isEmptyMap = node.childComponents.openingBracket || !!node.childComponents?.contents?.length
            if (isEmptyMap) {
                // trivial convertion, context doesn't matter
                return structure.childComponentsToString({node, context})
            } else {
                if (context.adjectives.inline) {
                    // TODO: throw a ContextRequirement error because a non-empty map needs multiple lines
                    // then other parts of the code should catch and retry with a different context
                }
                // FIXME: only works for empty maps
            }
            
        },
    },
})