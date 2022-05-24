import { Comment } from "./converters/Comment/Comment.js"
import { BlankLine } from "./converters/BlankLine/BlankLine.js"

export const commentOrEndOfLineToNode = ({ string, context }) => {
    const node = Comment.xdataStringToNode({ string, context })
    if (node) {
        return node
    } else {
        return BlankLine.xdataStringToNode({ string, context })
    }
}
