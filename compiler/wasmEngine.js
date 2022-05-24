import getWabt from "./libwabt.js"
var wabt = await getWabt()

function wabtToWasm({string, features}) {
    var wasmModule = wabt.parseWat(
        "_.wat",
        (new TextEncoder()).encode(string),
        {
            mutable_globals: true,
            exceptions: false,
            multi_value: true,
            sign_extension: false,
            sat_float_to_int: false,
            simd: false,
            threads: false,
            tail_call: false,
            bulk_memory: false,
            reference_types: false,
        }
    )
    try {
        var { buffer } = wasmModule.toBinary({})
        return buffer
    } catch (error) {
        return wasmModule
    }
}

var features = {
    mutable_globals: true,
    multi_value: true,
    exceptions: false,
    sign_extension: false,
    sat_float_to_int: false,
    simd: false,
    threads: false,
    tail_call: false,
    bulk_memory: false,
    reference_types: false,
}
var code = `
    (module
        (func $factorial (export "fac") (param f64) (result f64)
            local.get 0
            f64.const 1
            f64.lt
            if (result f64)
            f64.const 1
            else
            local.get 0
            local.get 0
            f64.const 1
            f64.sub
            call $fac
            f64.mul
            end
        )
    )
`


var output = wabtToWasm({ string: code, features })

// extract the factorial function 
var { factorial } = new WebAssembly.Instance(
    new WebAssembly.Module(
        output
    )
).exports

console.log(factorial(2))