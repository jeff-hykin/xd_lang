Since XD is compiled, all imports are known at compile time.

There's no explicit package manager because all dependencies are installed as needed/used.

If running a single script file (no project folder) the version of XD being used is auto-added to the top of the file the first time you run it.
```
##output "Hello"
```
Running that hello world would result in
```
#import: XD, version: 1.0.0
##output "Hello"
```

If its a project (If there's an info.xdata file) then the XD version will be stored in there so its not redundantly at the top of every file.


Imports can be pulled from different places <br>
`#import[ @some_library_name ]` quick import of a library (likely an official library)<br>
`#import[ url[""] ]` import library from somewhere other than the XD <br>
`#import[ ./path/to/local/XD/code ]` import from a file path <br>
`#import[ \absolute/path ]` quick import of a library <br>



If no version is specified, `#import: some_library_name` then the code will automatically be edited to include the version `#importVersion[1.0.0]Of: some_library_name`.

All XD imports are stored globally. XD imports are designed to handle multiple versions of the same library.

If an import is missing it will searched online 