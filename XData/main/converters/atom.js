import * as structure from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

structure.Converter({
    decoders: {
        Atom: ({remaining, context})=>{
            const childComponents = {
                preWhitespace: null, // token
                symbol: null, // token
                content: null, // token
                postWhitespace: null, // token
                comment: null, // node
            }
            
            // 
            // preWhitespace
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
            childComponents.preWhitespace = extraction
            
            // 
            // @-symbol itself
            // 
            if (context.adjectives.mapKey && remaining.length && remaining[0] != "@") {
                var { remaining, extraction, context } = tools.extract({ pattern: /@/i, from: remaining, context }); if (extraction == null) { return null }
                childComponents.symbol = extraction
            }

            // 
            // content
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /-?[a-zA-Z_][a-zA-Z_0-9]*/, from: remaining, context }); if (extraction == null) { return null }
            childComponents.content = extraction
            
            // 
            // postWhitespace
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
            childComponents.postWhitespace = extraction
            
            // 
            // comment
            // 
            if (context.adjectives.mapKey) {
                var { remaining, extraction, context } = tools.extract({
                    pattern: structure.decoders.Comment,
                    from: remaining,
                    context,
                })
                childComponents.comment = extraction
            }
            
            // 
            // return
            // 
            return new structure.Node({
                encoder: "Atom",
                childComponents,
                formattingPreferences: {},
            })
        },
    },
    encoders: {
        Atom: ({node, context})=>{
            if (context.adjectives.mapKey) {
                return childComponents.content
            } else {
                return structure.childComponentsToString({node, context})
            }
        },
    },
})