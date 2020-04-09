# The XD packaging system

You can make your own code an publish it, however there is a helpful system you should know about.

# XD Stablilty Tiers

You've probably had a problem with dependencies before.
Is your code reliable? No no, not the code you wrote, but the entire recursive dependency tree that you imported to make your code.

### Why the distiction? Why the complexity?
Code should just be code.

Although there is minimal complexity, I agree, and had there been (or if there is discovered) an alternative it would/will be taken. This distinction exists because there is a great evil in software I call the "it-works-on-my-machine" catastrophe. Programs don't verify (and often don't even try) and often can't verify that they have the dependencies they need. XD creates an standard (extending beyond the language) for handling these dependencies.

### What is a Tier1 Exectuable?
Tier1 means there are no unaccounted for dependencies. Not everything needs to be Tier1. There are a lot of sneaky ways to have external dependencies, there can be a system call (e.g. `system["echo hello"]`), or there could be a JSON file that is required, or it could be that you're using a library that has it's own dependency. If you only use basic official XD functions then your code will be Tier1, if all the libraries you use are Tier1 then your code can still be Tier1.

Lets say you make a hello_world XD Tier1 executable. It would look something like this

- my_hello_world
  - .git/
  - 0.0.0-afkj308yh3g5nn53tj053/
    - info.yaml
    - .cache/

The `my_hello_world` is the public name of the library. The `0.0.0-afkj308yh3g5nn53tj053` is what we consider to be the Tier1 exectuable. It is a hash that represents an exact unique version of the library. The `info.yaml` specifies which exact version of XD lang was used, explains the dependencies (if any), and includes any additional information about the executable.

What about the other stuff? Well lets say you create a new version of hello world. This time you ask for the person's name. Here's what the structure would look like.

- my_hello_world
  - .git/
  - 0.0.0-afkj308yh3g5nn53tj053/
    - info.yaml
    - .cache/
  - 0.0.1-3098fkjhsf704fj35lkg5/
    - info.yaml
    - .cache/

Now you have two Tier1 executables. Your `0.0.0` version and your `0.0.1` version. These versions share a lot of code, and it would be a waste to have two copies of the same thing. Thats why there is a `.git` folder and `.cache` that saves the differences between the versions instead of two separate copies. The `.git` only saves a compressed version of the end-difference between the versions. This means using multiple versions of the same library is not only effortless and allowed, it is also space efficient. 

If I wanted to use your library in my own Tier1 application, then I would have to import an exact version.

### But what if I need an external exectuable

Lots of projects do, and it is still possible to be Tier1, they just have to be held to the same rigor. The challege is that, whatever executable you include must be standalone. It can't have it's own secret dependencies. There's a few things, such as WebAssembly, that can be verified automatically. Once the executable is verified (either automatically or with an online review) then you simply make it into an XD exectuable, and import it.

### But what if I need a jank exectuable

Well... (next section)

# Tier2 and Tier3

This is probally the most common case, which is why there is Tier2 and Tier3 executables. Tier2 is a risk, but it is a measured and explained risk. Tier3 is just the wild west.

### What exactly is Tier2? 

Tier2 is jank, but well documented and has a measure of jank-ness. It means that all dependencies are at least known (including recursive dependencies), but some of them can't be turned into XD dependencies because they need proprietary software or because they have hardware dependencies. All binary/exe dependencies must have an absolute path, there will be no PATH modifications or direct dependance on environment variables. Every dependency must be able to be checked, and have an explaination as to how the dependency can be met if the dependency is not found. If the project uses mostly Tier1 libraries, it will have a low jank score. If the project is importing Tier2 libraries left and right, then there the jank score will be the square of the sum of all those projects jank-ness score ex: (p1 + p2 + p3)^2, code fragility is not a linear equation. The jank-ness based for non-XD executables will be based on how large they are and how often they're called in the project.

### What is Tier3?

Tier3 is hackathon tier, go crazy, have randomly generated OS-specific dynamic runtime dependencies that change based on the cycle of the moon, alignment of the stars, and leap years. Sometimes you can write bad code that lucks out in having all Tier2 or Tier1 dependenceies. However, if not, you can still bundle the project into an XD executable. The XD compiler will try to list out your dependencies, and will warn people about the flavors of black magic you used. Basically anything that imports it will be designated as Tier3.

### What about optional depenencies?

In XD code, every dependency is already optional. XD code has as a Quantum Existance, it only exists when needed, and the Tier system reflects that. Dependencies (for Tier1 and Tier2) are not installed/verified all-at-once. They are installed, if needed, at compile time. If your code only imports a tiny function from a giant library, the XD compiler will recognize that, and any unneeded dependencies of that library will not even be verified or downloaded. Tree shaking https://en.wikipedia.org/wiki/Tree_shaking is a similar, but much weaker concept. However, trying to say that your library should be Tier1 because only small "optional" dependency is making it Tier2/Tier3 is not how the system works. Tier scoring is like Big-O, it is categorized by the worst possible case not the average case. If your is very optional, then break it into a separate library that acts as an add-on to the main library so that users can explicitly include or exclude it.


### What about errors and security?

The Tier system is about stablity not code quality. Bad libraries filled with bugs and vulnerabilities can be Tier1, but they will be consistently and statically bad allowing you learn and deal with them.