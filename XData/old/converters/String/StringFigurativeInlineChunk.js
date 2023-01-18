import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "mapKey", ]
    // creates: []

export const StringFigurativeInlineChunk = createConverter({
    decoderName: "StringFigurativeInlineChunk",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let childComponents = {
            content: null, // token
        }
        
        // 
        // content
        // 
        while (1) {
            // cannot contain newline literals
            // can contain escapes

            var { node, remaining, context } = tools.oneOf({
                remaining,
                context,
                converters: [
                    converters.Comment,
                    converters.BlankLine,
                ],
            })
            //
            // content (no newlines allowed)
            //
            var { remaining, extraction, context } = tools.extractFirst({ pattern: RegExp(`^[^\\n]*?${openingQuote}`), from: remaining, context }); if (extraction == null) { return null }
            childComponents.content      = new Token({string:extraction.slice(0,-childComponents.openingQuote.length)                 })
            childComponents.closingQuote = new Token({string:extraction.slice(-childComponents.openingQuote.length, extraction.length)})
        }

        return new Node({
            decodeAs: "StringFigurativeInlineChunk",
            originalContext: context,
            childComponents,
            formattingInfo: {},  
        })
    },
    nodeToXdataString({node, contextName}) {
        const content = node.childComponents.content
        const containsNewlines = !!content.match(/\n/g)
        if (containsNewlines) {
            throw Exception(`\n\n
                This is probably an internal issue
                    called converters.StringFigurativeInlineChunk.nodeToXdataString()
                    probably should've called the slightly different
                    converters.String.nodeToXdataString()
                    because the string content contained a newline, which cannot 
            `)
        }
        
        // 
        // quote information
        // 
        let suggestedSize = node?.formattingInfo?.quoteSize || node.childComponents?.openingQuote?.length || 0
        const minimumDoubleQuoteSize = tools.minimumViableQuoteSize(content, `"`)
        const doubleQuoteSize = Math.max(minimumDoubleQuoteSize, suggestedSize)
        const doubleQuotes = (`"`).repeat(doubleQuoteSize)

        return (node.preWhitespace || "") + doubleQuotes + content + doubleQuotes + (node.postWhitespace || "")
    }
})