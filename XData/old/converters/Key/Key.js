import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

// (ValueOfAKey):
//     oneOf:
//         (specialValuesToNode):
//         (NumberToNode):
//         (AtomToNode):
//         (systemCharacterToNode):
//         (stringLiteralKeyToNode):
//         (stringFigurativeKeyToNode): #recursion
export const Key = createConverter({
    decoderName: "Key",
    xdataStringToNode({ string, context }) {
        var remaining = string
        var { node, remaining, context } = tools.oneOf({
            remaining,
            context,
            converters: [
                converters.ValueOfAKey,
                converters.KeyAndAdjective,
            ],
        })

        return node
    },
})