import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

import "./0_0_non_values.js"
import "./1_1_special_value.js"
import "./1_2_atom.js"
import "./number.js"
import "./string.js"
import "./list.js"
import "./map.js"
// FIXME: import reference

export const inlineValueToNode = ({remaining, context})=>{
    // FIXME:
}