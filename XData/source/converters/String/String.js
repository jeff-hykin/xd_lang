import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "keyPath" ]
    // creates: []

export const String = createConverter({
    decoderName: "String",
    xdataStringToNode({ string, context }) {
        var remaining = string
        var { node, remaining, context } = tools.oneOf({
            remaining,
            context,
            converters: [
                converters.StringLiteral,
            ],
        })

        return node
    },
    nodeToXdataString({node, contextName}) {
        const containsNewlines = !!node.childComponents.content.match(/\n/g)
        const defaultQuoteType = node.formattingInfo?.quoteType || (node.childComponents.openingQuote || `'`)[0]

        // FIXME: will need to know "keyPath" enforces on-a-single-line format
        
        // 
        // check if it can be a string literal
        // 
        if (!containsNewlines && defaultQuoteType == `"`) {
            return converters.StringLiteral.nodeToXdataString({node, contextName})
        } else {
            // FIXME: 
            throw Error(`Key contains newlines, but figurative strings are not yet implemented ref:293859yt3gbk`)
            return converters.StringFigurative.nodeToXdataString({node, contextName})
        }
    }
})