import * as structure from "../new_structure.js"
import * as tools from "../new_xdata_tools.js"
import * as utils from "../utils.js"

structure.Converter({
    decoders: {
        BlankLine: ({string, context})=>{
            var remaining = string
            const childComponents = {
                whitespace: null,
                newline: null,
            }

            // 
            // whitespace
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
            childComponents.whitespace = extraction

            // newline
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /(\n|$)/, from: remaining, context })
            childComponents.newline = extraction
            
            return new structure.Node({
                encoder: "BlankLine",
                childComponents,
                formattingPreferences: {},
            })
        },
        Comment: ({string, context})=>{
            var remaining = string
            const childComponents = {
                preWhitespace: null,
                commentSymbol: null,
                content: null,
                newline: null,
            }

            // 
            // leading whitespace
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
            childComponents.preWhitespace = extraction

            // 
            // comment symbol
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /# |#(?=\n)/, from: remaining, context })
            childComponents.commentSymbol = extraction

            // 
            // content
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /.*/, from: remaining, context })
            childComponents.content = extraction

            // 
            // newline
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /\n?/, from: remaining, context })
            childComponents.newline = extraction
            
            return new structure.Node({
                encoder: "Comment",
                childComponents,
                formattingPreferences: {},
            })
        },
        CommentOrBlankLine:({string, context})=>{
            var { remaining, extraction, context } = tools.extract({
                oneOf: [
                    structure.decoders.Comment,
                    structure.decoders.BlankLine,
                ],
                from: remaining,
                context,
            })
            return extraction
        },
    },
    encoders: {
        BlankLine: ({node, context})=>structure.childComponentsToString({node, context}),
        Comment: ({node, context})=>structure.childComponentsToString({node, context}),
    },
})