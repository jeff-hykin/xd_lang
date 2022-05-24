import { FileSystem } from "https://deno.land/x/quickr@0.3.24/main/file_system.js"
import { Context, converters } from "./structure.js"
import * as utils from "./utils.js"
// converters
import "./converters/String/BlankLine.js"
import "./converters/Comment/Comment.js"
import "./converters/String/String.js"

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
        for (const [decoderName, eachConverter] of Object.entries(converters)) {
            try {
                const node = eachConverter.xdataStringToNode({
                    string: getRemaining(),
                    context: context.duplicate(),
                })
                if (node instanceof Node) {
                    allFailed = false
                    context = context.advancedBy(node)
                    topLevelNodes.push(node)
                    break
                } else {
                    error.push(`${decoderName} returned ${utils.toString(node)}`)
                }
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