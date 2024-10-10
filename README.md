# Dusa implementation, examples, and benchmarking

This artifact supports the following claims in the Finite Choice Logic Programming paper, conditionally accepted for presentation at [POPL 2025](https://popl25.sigplan.org/):

1.  Dusa is our implementation of finite-choice logic programming, the language from the paper. The implementation supports three modes of interaction: a TypeScript API, a command-line program, and a browser-based editor.
2.  Dusa can enumerate solutions to finite-choice logic programs in a randomized fashion.
3.  The runtime behavior of Dusa can often reliably (if approximately) be predicted by McAllester's cost semantics based on prefix firings.
4.  Dusa outperforms state-of-the-art answer set programming engines on a variety of examples, in part because our implementation avoids the grounding bottleneck encountered by ASP solvers that take a ground-then-solve approach to program execution.

All the figures from the main body of the paper are included in the `examples/` directory, and can be run in the online editor or with the software artifact included here.

# Online editor

This is intended to be an archival version to accompany a publication, but by far the easiest way to verify claims #1 and #2 is to visit https://dusa.rocks/ and replace the contents of the text box with the program from Figure 1:

    # Mutual exclusion
    p is? ff.
    q is? ff.
    p is { tt } :- q is ff.
    q is { tt } :- p is ff.

If you then press the "load program" button, the implementation will present two solutions, which can be navigated with the `<` and `>` buttons. Reloading the program will result in the solutions being returned in different orders.

The software on https://dusa.rocks/ runs within the browser, and the site contains no telemetry or analytics.

# Software artifact

Benchmarking was performed against the version of Dusa published as dusa@0.0.13 in the Node Package Manager (NPM) registry. This package is included in the `dusa-0.0.13/` directory in the artifact, so NPM is not a dependency of this artifact.

The only dependency for running Dusa is Node.js: benchmarking was done with Node 18, but we have tested with Node v18.20.4, v20.10.0, and v22.9.0. From the directory containing this README, the following will quickly check that the implementation works.

    % node
    Welcome to Node.js v22.9.0.
    Type ".help" for more information.
    > const { Dusa } = await import('./dusa-0.0.13/lib/client.js');
    undefined
    > const dusa = new Dusa(`a is { red, green, blue }.`);
    undefined
    > [...dusa.solutions].map(({facts}) => JSON.stringify([...facts]));
    [
      '[{"name":"a","args":[],"value":{"name":"green"}}]',
      '[{"name":"a","args":[],"value":{"name":"blue"}}]',
      '[{"name":"a","args":[],"value":{"name":"red"}}]'
    ]

If the package `dusa@0.0.13` is installed from the node package manager, then `import('./dusa-0.0.13/lib/client.js')` can be replaced by `import('dusa')`.

## Command-line utility

The root directory of this repository contains a command-line utility `./dusa`.

The command-line utility requires one positional argument, a Dusa program, and if given no other arguments will return a single solution in JSON format.

    ./dusa examples/figure-1-mutual-exclusion.dusa

The `-n` flag will controls the number of solutions returned. In the case of the second figure, this command will return 62 solutions:

    ./dusa examples/figure-2-spanning-tree.dusa -n0

Including the `-q <pred>` flag will print only certain predicates instead of the full database. Including the `-c <pred>` flag will print only the number of facts about a certain predicate instead of the full database.

    ./dusa examples/figure-3-canonical-representative.dusa -n0 -c edge -q isRep
    ./dusa examples/figure-4-stop-or-more.dusa -n5 -c visit
    ./dusa examples/figure-5-sat-instance.dusa -qp -qq -qr

## Basic cost semantics

The command line utility can be used to explore the asymptotic performance of Dusa. The command line argument -f allows facts to be passed on the command line, which we can use to vary input sizes.

A classic example of McAllester's cost semantics is that this program is predicted to run in O(n^2) time on a sparse graph with n edges:

    path X Y :- edge X Y.
    path X Z :- edge X Y, path Y Z.

This can be seen with Dusa: doubling the number of edges should increase the time it takes to run by about 4x:

    time ./dusa examples/perf-edge-path.dusa -f '[{"name": "dimension", "args": [], "value": 500 }]' -cpath
    time ./dusa examples/perf-edge-path.dusa -f '[{"name": "dimension", "args": [], "value": 1000 }]' -cpath

On the other hand, this program produces the same models but the McAllester cost semantics predicts it should run in O(n^3) time on a sparse graph with n edges:

    path X Y :- edge X Y.
    path X Z :- path X Y, path Y Z.

This can be seen with Dusa: doubling the number of edges should increase the time it takes to run by about 8x:

    time ./dusa examples/perf-path-path.dusa -f '[{"name": "dimension", "args": [], "value": 250 }]' -cpath
    time ./dusa examples/perf-path-path.dusa -f '[{"name": "dimension", "args": [], "value": 500 }]' -cpath

The linear growth in the canonical representative algorithm described in Figures 9 and 10 can also be explored in this way: doubling the number of edges should increase the time it takes to run by about 2x.

    time ./dusa examples/perf-canonical-representative.dusa -f '[{"name": "dimension", "args": [], "value": 25000 }]' -qisRep
    time ./dusa examples/perf-canonical-representative.dusa -f '[{"name": "dimension", "args": [], "value": 50000 }]' -qisRep

## Grounding bottleneck

The "grounding bottleneck" is a problem for many practical problems in answer set programming, but it's most easily demonstrated through a pathological case.

    p(X1,X2,X3,X4,X5,X6) :-
        select(X1), select(X2), select(X3),
        select(X4), select(X5), select(X6).

    select(X) :- dom(X), not nselect(X).
    nselect(X) :- dom(X), not select(X).
    :- dom(X), not nselect(X), select(Y), X != Y.

The program has n+1 models, where n is the size of the dom/1 relation: one model where the p/6 relation is empty, and n facts where p(X,X,X,X,X,X) holds for some X in the dom/1 relation. However, it performs very poorly on ground-then-solve answer set programming engines by forcing the grounder to consider as many as 6^n possible programs, where n is the size of the dom/1 relation.

By downloading Clingo from a package manager (brew install clingo, apt-get install clingo, etc.) or from https://github.com/potassco/clingo/releases/ it is possible to run this benchmark yourself. It is only feasible with very small n.

    clingo examples/grounding-bottleneck.lp -csize=10

According to the ASP-to-FCLP translations described in the paper, this program is equivalent to the following Dusa program:

    p X1 X2 X3 X4 X5 X6 :-
        select X1 is tt, select X2 is tt, select X3 is tt,
        select X4 is tt, select X5 is tt, select X6 is tt.

    select X is? ff :- dom X.
    nselect X is? ff :- dom X.
    select X is { tt } :- dom X, nselect X is ff.
    nselect X is { tt } :- dom X, select X is ff.
    ok is { yes }.
    ok is { no } :- dom X, nselect X is ff, select Y is tt, X != Y.

It is possible to run this program quickly with n in the thousands:

    ./dusa examples/grounding-bottleneck.dusa -f'[{ "name": "size", "args": [], "value": 10000 }]' -qp
