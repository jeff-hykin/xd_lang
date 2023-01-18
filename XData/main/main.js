import { Context, converters } from "./structure.js"
import * as utils from "./utils.js"
// converters
import "./converters/atom.js"

const string = await FileSystem.read(Deno.args[0])
console.log(Document.xdataStringToNode({ string })) 