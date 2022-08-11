import * as structure from "../new_structure.js"
import * as tools from "../new_xdata_tools.js"
import * as utils from "../utils.js"

structure.Converter({
    decoders: {
        Map: ({remaining, context})=>{
            if (context.adjectives.inline) {
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
                    encoder: "Map",
                    childComponents,
                    formattingPreferences: {},
                })
            } else {
                // TODO: non-empty ma
            }
        },
    },
    encoders: {
        Map: ({node, context})=>{
            // TODO: only works for empty maps
            return structure.childComponentsToString({node, context})
            
            if (context.adjectives.inline) {
                // Only empty maps are allowed in an inline context, try to force a context change if not an empty map
            }
        },
    },
})