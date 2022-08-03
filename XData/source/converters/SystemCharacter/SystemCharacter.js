import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "mapKey", "stringFigurative" ]
    // creates: []

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
    xdataStringToNode({ string, context }) {
        var remaining = string
        let components = {
            preWhitespace: null,
            systemToken: null,
            openBracket: null,
            openBracketWhitespace: null,
            content: null,
            closeBracketWhitespace: null,
            closeBracket: null,
            postWhitespace: null,
            comment: null,
        }

        // 
        // preWhitespace
        // 
        if (context.name != "mapKey" && context.name != "stringFigurative") {
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.preWhitespace = new Token({string:extraction})
        }
        
        // 
        // systemToken
        // 
        var { remaining, extraction, context } = tools.extractFirst({ pattern: /#(tab|newline|unicode|ascii)/, from: remaining }); if (extraction == null) { return null }
        components.systemToken = new Token({string:extraction})

        if (extraction == 'unicode' || extraction == 'ascii') {
            // 
            // openBracket
            // 
            var { remaining, extraction, context } = tools.extractFirst({ pattern: /\[/, from: remaining }); if (extraction == null) { return null }
            components.openBracket = new Token({string:extraction})
            
            // 
            // openBracketWhitespace
            // 
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.openBracketWhitespace = new Token({string:extraction})
            
            // 
            // content
            // 
            // TODO: consider allow hex/octal numbers
            if (components.escape.string == 'ascii') {
                // 
                // integer 0-255
                // 
                var { remaining, extraction, context } = tools.extractFirst({ pattern: /[12]\d\d|\d(\d)?/, from: remaining }); if (extraction == null) { return null }
                components.content = new Token({string:extraction})
            } else {
                // 
                // whole number
                // 
                var { remaining, extraction, context } = tools.extractFirst({ pattern: /\d+/, from: remaining });
                if (extraction != null) {
                    components.content = new Token({string:extraction})
                }
            }

            // 
            // closeBracketWhitespace
            // 
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */i, from: remaining }); if (extraction == null) { return null }
            components.closeBracketWhitespace = new Token({string:extraction})

            // 
            // closeBracket
            // 
            var { remaining, extraction, context } = tools.extractFirst({ pattern: /\]/i, from: remaining }); if (extraction == null) { return null }
            components.closeBracket = new Token({string:extraction})
        }
        
        // 
        // postWhitespace
        // 
        if (context.name != "mapKey" && context.name != "stringFigurative") {
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.postWhitespace = new Token({string:extraction})
        }
        
        // 
        // postWhitespace
        // 
        if (context.name != "mapKey" && context.name != "stringFigurative") {
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
        if (contextName == "mapKey") {
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