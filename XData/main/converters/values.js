import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

import "./non_values.js"
import "./special_value.js"
import "./atom.js"
import "./number.js"
import "./string.js"
import "./list.js"
import "./map.js"
// FIXME: import reference

export const inlineValueToNode = ({remaining, context})=>{
    // FIXME:
}