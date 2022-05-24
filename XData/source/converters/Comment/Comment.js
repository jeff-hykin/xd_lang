import { Token, Node, createConverter } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

export const Comment = createConverter({
    decoderName: "Comment",
    xdataStringToNode({ string, context }) {
        var remaining = string
        // doesnt care about the context.name: "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue"
        let components = {
            preWhitespace: null, // token
            commentSymbol: null, // token
            content: null, // token
            newline: null, // token
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
            decodeAs: "Comment",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    // nodeToXdataString(node) {
    //      // defaults to combining all childComponents
    // }
})