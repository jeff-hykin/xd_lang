import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// (vanillaKeyToNode):
//     oneOf:
//         (specialValuesToNode):
//         (numberLiteralToNode):
//         (atomValueToNode):
//         (systemCharacterToNode):
//         (stringLiteralKeyToNode):
//         (stringFigurativeKeyToNode): #recursion
export const VanillaKey = createConverter({
    decoderName: "VanillaKey",
    xdataStringToNode({ string, context }) {
        const originalContext = context
        var remaining = string
        let components = {
            adjectives: null, // node
            content: null, // node
            postWhitespace: null,
        }
        
        var { node, remaining, context } = tools.oneOf({
            converters: [
                converters.SpecialValues,
                converters.NumberLiteral,
                converters.AtomValue,
                converters.SystemCharacter,
                converters.StringLiteralKey,
                converters.StringFigurativeKey,
            ],
        })

        return node
    },
})