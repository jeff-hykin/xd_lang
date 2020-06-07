
- the ability to create a token such as #ITSELF that is only valid on the right-hand side of an assignment, and that it would grab and paste the left-hand side of the assignment
- the ability to have every evaluation print its output to the console unless there's a semicolon at the end
- the ability to pause the execution of code (and possibly execute other code)
- the ability to set a priority on functions/processes


To create this kind of "super functionality" there likely needs to be a DOM-query like system. Tokens such as #ITSELF would be searched for, and replaced in particular contexts. Same with ; at the end of a line. This behavior will be tricky because it will be important which replacements happen first.
