import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "keyDefinition", ]
    // creates: []

export const StringLiteral = createConverter({
    decoderName: "StringLiteral",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let childComponents = {
            preWhitespace: null, // token
            openingQuote: null, // token
            content: null, // token
            closingQuote: null, // token
            postWhitespace: null, // token
        }
        
        // 
        // leading whitespace
        // 
        if (context.name != "keyDefinition") {
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining, context }); if (extraction == null) { return null }
            childComponents.preWhitespace = new Token({string:extraction})
        }

        // 
        // first quote
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /"+/, from: remaining })               ; if (extraction == null) { return null }
        var { remaining: remainingQuotes, extraction: openingQuote } = tools.extractStartingQuote(extraction); if (openingQuote.length == 0) { return null }
        childComponents.openingQuote = new Token({string:openingQuote})
        context = context.advancedBy(childComponents.openingQuote)
        // put some back because we possibly grabbed more than just the start
        remaining = remainingQuotes+remaining

        //
        // content (no newlines allowed)
        //
        var { remaining, extraction, context } = tools.extractFirst({ pattern: RegExp(`^[^\\n]*?${openingQuote}`), from: remaining, context }); if (extraction == null) { return null }
        childComponents.content      = new Token({string:extraction.slice(0,-childComponents.openingQuote.length)                 })
        childComponents.closingQuote = new Token({string:extraction.slice(-childComponents.openingQuote.length, extraction.length)})

        // 
        // trailing whitespace
        // 
        if (context.name != "keyDefinition") {
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining, context }); if (extraction == null) { return null }
            childComponents.postWhitespace = new Token({string:extraction})
        }

        return new Node({
            decodeAs: "String", // NOTE: this is intentional, "String" not "StringLiteral"
            originalContext: context,
            childComponents,
            formattingInfo: {
                quoteSize: childComponents.openingQuote.string.length,
            },  
        })
    },
    nodeToXdataString({node, contextName}) {
        const content = node.childComponents.content
        const containsNewlines = !!content.match(/\n/g)
        if (containsNewlines) {
            throw Exception(`\n\n
                This is probably an internal issue
                    called converters.StringLiteral.nodeToXdataString()
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