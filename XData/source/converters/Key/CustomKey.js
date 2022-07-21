import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

export const CustomKey = createConverter({
    decoderName: "CustomKey",
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
        if (context.name != "key") {
            var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            context = context.advancedBy(components.preWhitespace = new Token({string:extraction}))
        }
        
        // 
        // adjectives
        // 
        var { node, remaining, context } = converters.CustomAdjectives.xdataStringToParsed({ remaining, context }); if (node == null) { return null }
        components.adjectives = node
        
        // 
        // content
        // 
        var { node, remaining, context } = converters.VanillaKey.xdataStringToParsed({ remaining, context }); if (node == null) { return null }
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
            decodeAs: "CustomKey",
            originalContext,
            childComponents: components,
            formattingInfo: {},  
        })
    },
})