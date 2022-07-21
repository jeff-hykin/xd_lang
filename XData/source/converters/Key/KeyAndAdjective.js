import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

export const KeyAndAdjective = createConverter({
    decoderName: "KeyAndAdjective",
    xdataStringToNode({ string, context }) {
        const originalContext = context
        var remaining = string
        let components = {
            preWhitespace: null,
            adjectives: null, // node
            content: null, // node
            postWhitespace: null,
        }

        // 
        // preWhitespace
        // 
        if (context.name != "keyDefinition") {
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining, context }); if (extraction == null) { return null }
            components.preWhitespace = new Token({string:extraction})
        }
        
        // 
        // adjectives
        // 
        var { node, remaining, context } = converters.CustomAdjectives.xdataStringToParsed({ remaining, context }); if (node == null) { return null }
        components.adjectives = node
        
        // 
        // content
        // 
        var { node, remaining, context } = converters.ValueOfAKey.xdataStringToParsed({ remaining, context }); if (node == null) { return null }
        components.content = node

        // 
        // postWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        context = context.advancedBy(components.postWhitespace = new Token({string:extraction}))
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "KeyAndAdjective",
            originalContext,
            childComponents: components,
            formattingInfo: {},  
        })
    },
})