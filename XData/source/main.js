import { FileSystem } from "https://deno.land/x/quickr@0.3.24/main/file_system.js"
import { Context } from "./structure.js"
// converters
import { Comment } from "./converters/Comment/Comment.js"
import { String } from "./converters/String/String.js"
const converters = [
    Comment,
    String,
]

function parse(string) {
    const topLevelNodes = []
    let context = new Context({
        name: "topLevel",
        stringIndex: 0,
        lineIndex: 0,
        columnIndex: 0
    })
    
    function getRemaining() {
        return string.slice(context.stringIndex)
    }
    while (getRemaining().length > 0) {
        let allFailed = true
        const errors = []
        for (const eachConverter of converters) {
            try {
                const node = eachConverter.xdataStringToNode({
                    string: getRemaining(),
                    context: context.duplicate(),
                })
                allFailed = false
                context.advanceBy(node) // increments the context location
                topLevelNodes.push(node)
                break
            } catch (error) {
                errors.push(error)
            }
        }
        if (allFailed) {
            throw Error(...errors)
            break
        }
    }
    return topLevelNodes
}

const string = await FileSystem.read(Deno.args[0])
console.log(parse(string))