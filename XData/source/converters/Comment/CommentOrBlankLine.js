import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

export const CommentOrBlankLine = createConverter({
    decoderName: "CommentOrBlankLine",
    xdataStringToNode({ string, context }) {
        var remaining = string
        var { node, remaining, context } = tools.oneOf({
            remaining,
            context,
            converters: [
                converters.Comment,
                converters.BlankLine,
            ],
        })

        return node
    },
})