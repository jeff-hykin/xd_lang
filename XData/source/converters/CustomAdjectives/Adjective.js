import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

export const Adjective = createConverter({
    decoderName: "Adjective",
    xdataStringToNode({ string, context }) {
        var remaining = string
        // doesnt care about the context.name: "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue"
        let components = {
            preWhitespace: null, // token
            content: null,
            postWhitespace: null, // token
            comma: null,
        }

        // 
        // preWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.preWhitespace = new Token({string:extraction})

        // 
        // content
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /[a-zA-Z_][a-zA-Z_0-9]*/, from: remaining }); if (extraction == null) { return null }
        components.content = new Token({string:extraction})
        
        // 
        // postWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})
        
        // 
        // comma (optional)
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /,/, from: remaining })
        components.comma = new Token({string:extraction})
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "Adjective",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
})