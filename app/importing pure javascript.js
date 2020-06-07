// use: `parcel ${fileName} --target node --bundle-node-modules --no-source-maps --no-autoinstall --no-hmr  --no-cache`
// which will generate a dist/$fileName
// then add this 



require = (...args)=>{
    throw new Error(`System level node modules are not allowed\nsomewhere in the code a file is trying to import "${args}" or require("${args}")`)
}

