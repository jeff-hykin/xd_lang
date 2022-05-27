import { String } from "../String.js"

console.debug(`String is:`,String)


console.debug(`"howdy" is: `,String.xdataStringToNode({ string: `"howdy"`, context: { name: "key" }}))
console.debug(`"""howdy"""`,String.xdataStringToNode({ string: `"""howdy"""`, context: { name: "key" }}))