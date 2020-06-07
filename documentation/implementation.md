This will be an electron app that is both an editor and a runtime

App opens to a file explorer where you can pick an existing project or find/make a new folder

- javascript is used (at first) to compile XD into a C++ file
- emscripten is included as WASM, which is then called to compile the C++ file into WASM
- the XD compilation checks if the project uses GUI functions or not
- if theres no GUI:
  - the resulting WASM file is then executed
- if there is a GUI:
  - an electron instance is created
  - the C++ code is wrapped by a communication system that talks with the 
  - a javascript communicator/wrapper file is created that imports the WASM
  - the WASM 


Challenges/Problems:
- How to manage multiple simultanious versions of XD, when it depends on electron/node/WASM versions
- How to manage if a JS library was only made to work with a speficic environment (node/chrome 80/firefox/etc)