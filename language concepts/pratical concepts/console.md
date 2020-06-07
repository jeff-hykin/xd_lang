Printing to the console by default tells the item/object to convert itself to it's XData form, and then it sends that to the console.

To customize it youself, you can add a siphon to the the ##output function. Lets say you named your item Bob (thing@name << "Bob")

```
bob << item:
    @name; "bob"

##output bob

# this would show:
# item:
#   !atom name: bob

# create the siphon
#siphon[##output]
    If: #input@name = "bob"
    Then: #Console@stdout: "Bob"

##output bob

# this would now show:
# bob
```

You can also change the xdata form of an object, however only do this if you're making it compatible with xdata (for saving you value to a file).


For debugging use #debug because it automatically indents and says where the data is being printed
