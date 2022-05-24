import { Comment } from "./converters/Comment/Comment.js"
import { BlankLine } from "./converters/BlankLine/BlankLine.js"

export const commentOrEndOfLineToParsed = ({ string, context }) => {
    const result = Comment.xdataStringToParsed({ string, context })
    if (result) {
        return result
    } else {
        return BlankLine.xdataStringToParsed({ string, context })
    }
}
