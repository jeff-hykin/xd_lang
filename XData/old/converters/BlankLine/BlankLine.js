import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

export const BlankLine = createConverter({
    decoderName: "BlankLine",
    xdataStringToNode({ string, context }) {
        var remaining = string
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