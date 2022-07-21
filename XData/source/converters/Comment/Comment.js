import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

export const Comment = createConverter({
    decoderName: "Comment",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let childComponents = {
            preWhitespace: null, // token
            commentSymbol: null, // token
            content: null, // token
            newline: null, // token
        }

        // 
        // leading whitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        childComponents.preWhitespace = new Token({string:extraction})

        // 
        // comment symbol
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /# |#(?=\n)/, from: remaining }); if (extraction == null) { return null }
        childComponents.commentSymbol = new Token({string:extraction})

        // 
        // comment symbol
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /.*/, from: remaining }); if (extraction == null) { return null }
        childComponents.content = new Token({string:extraction})

        // 
        // newline
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\n?/, from: remaining }); if (extraction == null) { return null }
        childComponents.newline = new Token({string:extraction})
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "Comment",
            originalContext: context,
            childComponents,
            formattingInfo: {},  
        })
    },
    // nodeToXdataString(node) {
    //      // defaults to combining all childComponents
    // }
})