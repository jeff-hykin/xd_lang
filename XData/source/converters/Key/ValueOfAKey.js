import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

// (ValueOfAKey):
//     oneOf:
//         (specialValuesToNode):
//         (numberLiteralToNode):
//         (atomValueToNode):
//         (systemCharacterToNode):
//         (stringLiteralKeyToNode):
//         (stringFigurativeKeyToNode): #recursion
export const ValueOfAKey = createConverter({
    decoderName: "ValueOfAKey",
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