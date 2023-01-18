import { FileSystem } from "https://deno.land/x/quickr@0.3.24/main/file_system.js"
import { Context, converters } from "./structure.js"
import * as utils from "./utils.js"
// converters
import { Document } from "./converters/Document/Document.js"

const string = await FileSystem.read(Deno.args[0])
console.log(Document.xdataStringToNode({ string })) 