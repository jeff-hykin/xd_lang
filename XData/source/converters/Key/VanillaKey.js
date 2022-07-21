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
        var remaining = string
        var { node, remaining, context } = tools.oneOf({
            remaining,
            context,
            converters: [
                converters.SpecialValues,
                converters.NumberLiteral,
                converters.AtomValue,
                converters.SystemCharacter,
                converters.String,
            ],
        })

        return node
    },
})