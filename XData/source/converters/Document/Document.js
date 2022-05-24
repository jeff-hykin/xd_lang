import { Token, Node, createConverter, converters } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"
import { commentOrEndOfLineToParsed } from "../../xdataAggregates.js"

export const Document = createConverter({
    decoderName: "Document",
    // Document should be the only one with a default context
    xdataStringToNode({ string, context=new Context({ name: "topLevel", stringIndex: 0, lineIndex: 0, columnIndex: 0 }) }) {
        const originalContext = context
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
        
        // 
        // beforeValue
        // 
        var node = true
        while (node) {
            var { node, remaining, context } = commentOrEndOfLineToParsed({ string: remaining, context })
            if (node) {
                components.beforeValue.push(node)
            }
        }
        // 
        // value
        // 
        
        // 
        // afterValue
        // 

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