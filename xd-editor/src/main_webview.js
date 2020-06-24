// run the setup from the vs_code_comm.js file
setupHtmlSide()
// see: retainContextWhenHidden

// Listen to actions from the extension
window.addEventListener("message", eventObj => {
    if (eventObj instanceof Object && eventObj.data instanceof Object) {
        switch (eventObj.data.command) {
            case commands.EVAL:
                let { uuid, result } = eventObj.data
                // call the callback of the correct thing(e.g use the uuid) and 
                // give the callback the result
                vsCodeDo.callbacks[uuid](result)
                break;
        }
    }
})