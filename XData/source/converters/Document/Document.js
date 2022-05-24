import { Token, Node, createConverter, converters } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"
import { commentOrEndOfLineToNode } from "../../xdataAggregates.js"

export const Document = createConverter({
    decoderName: "Document",
    xdataStringToNode({ string, context }) {
        var remaining = string
        // only works in top level
        if (context.name != "topLevel") {
            return null
        }
        
        let components = {
            beforeValue: [],
            value: null, // node
            afterValue: [],
        }

        let node = true
        while (node) {
            node = commentOrEndOfLineToNode({ string: remaining, context })
        }

        // 
        // leading whitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.preWhitespace = new Token({string:extraction})

        // 
        // comment symbol
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /# |#(?=\n)/, from: remaining }); if (extraction == null) { return null }
        components.commentSymbol = new Token({string:extraction})

        // 
        // comment symbol
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /.*/, from: remaining }); if (extraction == null) { return null }
        components.content = new Token({string:extraction})

        // 
        // newline
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\n?/, from: remaining }); if (extraction == null) { return null }
        components.newline = new Token({string:extraction})
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "Document",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    // nodeToXdataString(node) {
    //      // defaults to combining all childComponents
    // }
})