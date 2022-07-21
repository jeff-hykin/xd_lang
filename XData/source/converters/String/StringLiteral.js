import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "keyDefinition", ]
    // creates: []

export const String = createConverter({
    decoderName: "String",
    contextNames: [ "keyDefinition", ],
    xdataStringToNode({ string, context }) {
        var remaining = string
        let childComponents 
        childComponents = {
            openingQuote: null, // token
            content: null, // token
            closingQuote: null, // token
            postWhitespace: null, // token
        }

        // 
        // first quote
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /"+/, from: remaining })               ; if (extraction == null) { return null }
        var { remaining: remainingQuotes, extraction: openingQuote } = tools.extractStartingQuote(extraction);if (openingQuote.length == 0) { return null }
        childComponents.openingQuote = new Token({string:openingQuote})
        remaining = remainingQuotes+remaining
        
        //
        // content
        //
        var { remaining, extraction } = utils.extractFirst({ pattern: RegExp(`^[^\\n]*?${openingQuote}`), from: remaining }); if (extraction == null) { return null }
        childComponents.content      = new Token({string:extraction.slice(0,-childComponents.openingQuote.length)                 })
        childComponents.closingQuote = new Token({string:extraction.slice(-childComponents.openingQuote.length, extraction.length)})

        // 
        // trailing whitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        childComponents.postWhitespace = new Token({string:extraction})

        return new Node({
            decodeAs: "String",
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
        
        // 
        // quote information
        // 
        let normalSize = 0
        try { normalSize = node.options.quoteSize } catch (error) {}
        if (!normalSize) { try { normalSize = node.childComponents.openingQuote.length } catch (error) {} }
        if (!normalSize) { normalSize = 0 }
        let defaultQuoteType = undefined
        try { defaultQuoteType = node.childComponents.openingQuote[0] } catch (error) {}
        const minimumDoubleQuoteSize = tools.minimumViableQuoteSize(content, `"`)
        const minimumSingleQuoteSize = tools.minimumViableQuoteSize(content, `'`)
        const doubleQuoteSize = Math.max(minimumDoubleQuoteSize, normalSize)
        const singleQuoteSize = Math.max(minimumSingleQuoteSize, normalSize)
        const doubleQuotes = (`"`).repeat(doubleQuoteSize)
        const singleQuotes = (`'`).repeat(singleQuoteSize)

        // 
        // main formatting decisions
        // 
        if (contextName == "keyDefinition") {
            // contains newlines (=> figurative string required)
            if (containsNewlines) {
                // FIXME: need to create a figurative string instead 
                throw Error(`Key contains newlines, but figurative strings are not yet implemented ref:293859yt3gbk`)
            // literal string
            } else {
                // 
                // combine everything
                // 
                return doubleQuotes + content + doubleQuotes + (node.postWhitespace || "")
            }
        }
    }
})