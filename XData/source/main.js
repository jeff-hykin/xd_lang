import { FileSystem } from "https://deno.land/x/quickr@0.3.24/main/file_system.js"
import { Context } from "./structure.js"
// converters
import { Comment } from "./converters/Comment/Comment.js"
import { String } from "./converters/String/String.js"

const string = await FileSystem.read(Deno.args[0])
let remaining = string
let context = new Context({ name: "topLevel", stringIndex=0, lineIndex=0, columnIndex=0 })
const converters = [
    Comment,
    String,
]
function getRemaining() {
    return string.slice(context.)
}
while (remaining > 0) {
    let allFailed = true
    const errors = []
    for (const eachConverter of converters) {
        try {
            const node = eachConverter.xdataStringToNode({ string: remaining, context: context.duplicate() })
            allFailed = false
            const endLocation = node.getEndLocation(context.duplicate())
            // advance the pointer
            Object.assign(context, endLocation)
        } catch (error) {
            
        }
    }
}