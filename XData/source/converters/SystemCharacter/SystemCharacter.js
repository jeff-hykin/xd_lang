import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// (systemCharacterToNode):
//     oneOf:
//         regex: "/#tab|#newline/"
//         group:
//             regex: "/#unicode\[ */"
//             (stringLiteralKey):
//             regex: "/ *\]/"
//         group:
//             regex: "/#ascii\[ */"
//             (number):
//             regex: "/ *\]/"

export const SystemCharacter = createConverter({
    decoderName: "SystemCharacter",
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
        if (context.name != "key" && context.name != "stringFigurative") {
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
        var { remaining, extraction } = utils.extractFirst({ pattern: /tab|newline|unicode|ascii/, from: remaining }); if (extraction == null) { return null }
        components.escape = new Token({string:extraction})
        context = context.advancedBy(components.escape)
        
        if (extraction == 'unicode' || extraction == 'ascii') {
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
            if (components.escape.string == 'ascii') {
                // 
                // integer 0-255
                // 
                var { remaining, extraction } = utils.extractFirst({ pattern: /[12]\d\d|\d\d/, from: remaining }); if (extraction == null) { return null }
                components.input = new Token({string:extraction})
                context = context.advancedBy(components.input)
            } else {
                // 
                // whole number
                // 
                var { remaining, extraction } = utils.extractFirst({ pattern: /\d+/, from: remaining });
                if (extraction != null) {
                    components.input = new Token({string:extraction})
                    context = context.advancedBy(components.input)
                } else {
                    // 
                    // string
                    // 
                    var { node, remaining, context } = converters.String.xdataStringToParsed({
                        string: remaining,
                        context: new Context({
                            ...context,
                            name: "key",
                        }),
                    })
                }
            }

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
        }
        
        // 
        // postWhitespace
        // 
        if (context.name != "key" && context.name != "stringFigurative") {
            var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.postWhitespace = new Token({string:extraction})
            context = context.advancedBy(components.postWhitespace)
        }
        
        // 
        // postWhitespace
        // 
        if (context.name != "key" && context.name != "stringFigurative") {
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
            decodeAs: "SystemCharacter",
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