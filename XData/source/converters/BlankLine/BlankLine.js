import { Token, Node, createConverter } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

export const BlankLine = createConverter({
    decoderName: "BlankLine",
    xdataStringToNode({ string, context }) {
        var remaining = string
        // doesnt care about the context.name: "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue"
        let components = {
            whitespace: null, // token
            newline: null,
        }

        // 
        // leading whitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /[ \t]*/, from: remaining }); if (extraction == null) { return null }
        components.whitespace = new Token({string:extraction})
        
        // 
        // newline
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /(\n?|$)/, from: remaining }); if (extraction == null) { return null }
        components.newline = new Token({string:extraction})
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "BlankLine",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    // nodeToXdataString(node) {
    //      // defaults to combining all childComponents
    // }
})