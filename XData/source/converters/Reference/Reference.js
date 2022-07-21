import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

// (referenceToNode):
//     regex: "/#valueOf/"
//     optional:
//         loop:
//             regex: "/\[/"
//             regex: "/ */"
//             (keyToNode):
//             regex: "/ */"
//             regex: "/\]/"

export const Reference = createConverter({
    decoderName: "Reference",
    contextNames: [ "key", "stringFigurative" ],
    xdataStringToNode({ string, context }) {
        var remaining = string
        let components = {
            preWhitespace: null,
            symbol: null,
            escape: null,
            openBracket: null,
            openBracketWhitespace: null,
            input: null,
            closeBracketWhitespace: null,
            closeBracket: null,
            postWhitespace: null,
            comment: null,
        }

        // 
        // preWhitespace
        // 
        if (context.name != "keyDefinition" && context.name != "stringFigurative") {
            var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.preWhitespace = new Token({string:extraction})
            context = context.advancedBy(components.preWhitespace)
        }
        
        // 
        // symbol
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /#/, from: remaining }); if (extraction == null) { return null }
        components.symbol = new Token({string:extraction})
        context = context.advancedBy(components.symbol)

        // 
        // escape
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /valueOf/, from: remaining }); if (extraction == null) { return null }
        components.escape = new Token({string:extraction})
        context = context.advancedBy(components.escape)
        
        // 
        // openBracket
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\[/, from: remaining }); if (extraction == null) { return null }
        components.openBracket = new Token({string:extraction})
        context = context.advancedBy(components.openBracket)
        
        // 
        // openBracketWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.openBracketWhitespace = new Token({string:extraction})
        context = context.advancedBy(components.openBracketWhitespace)
        
        // 
        // input
        // 
        

        // 
        // closeBracketWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */i, from: remaining }); if (extraction == null) { return null }
        components.closeBracketWhitespace = new Token({string:extraction})
        context = context.advancedBy(components.closeBracketWhitespace)

        // 
        // closeBracket
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\]/i, from: remaining }); if (extraction == null) { return null }
        components.closeBracket = new Token({string:extraction})
        context = context.advancedBy(components.closeBracket)
        
        // 
        // postWhitespace
        // 
        if (context.name != "keyDefinition" && context.name != "stringFigurative") {
            var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.postWhitespace = new Token({string:extraction})
            context = context.advancedBy(components.postWhitespace)
        }
        
        // 
        // comment
        // 
        if (context.name != "keyDefinition" && context.name != "stringFigurative") {
            components.comment = converters.Comment.xdataStringToNode({
                string: remaining,
                context: context,
            })
            context = context.advancedBy(components.comment)
        }
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "Reference",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    nodeToXdataString({node, contextName}) {
        if (contextName == "key") {
            node.childComponents.preWhitespace = null
            node.childComponents.comment = null
        } else if (contextName == "stringLiteral") {
            node.childComponents.preWhitespace = null
            node.childComponents.postWhitespace = null
            node.childComponents.comment = null
        }
        return convertComponent({
            component: Object.values(node.childComponents),
            parent:node,
            contextName
        })
    }
})