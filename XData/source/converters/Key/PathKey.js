import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: [ "keyPath" ]

// (PathKey):
//     regex: "/ */"
//     (Key):
//     regex: / */
export const PathKey = createConverter({
    decoderName: "PathKey",
    xdataStringToNode({ string, context }) {
        const originalContext = context
        var remaining = string
        let components = {
            preWhitespace: null,
            content: null, // node
            postWhitespace: null,
        }

        // 
        // preWhitespace
        // 
        var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining, context }); if (extraction == null) { return null }
        components.preWhitespace = new Token({string:extraction})
        
        // 
        // key
        // 
        var { node, remaining, context } = tools.oneOf({
            remaining,
            context: new Context({
                ...context,
                name: "keyPath",
            }),
            converters: [
                converters.ValueOfAKey,
                converters.KeyAndAdjective,
            ],
        })
        components.content = node
        
        // 
        // content
        // 
        var { node, remaining, context } = converters.ValueOfAKey.xdataStringToParsed({ remaining, context }); if (node == null) { return null }
        components.content = node

        // 
        // postWhitespace
        // 
        var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining, context }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "PathKey",
            originalContext,
            childComponents: components,
            formattingInfo: {},  
        })
    },
})