delete(X,Y) :- edge(X,Y), not keep(X,Y).
keep(X,Y) :- edge(X,Y), delete(X1,Y1), X1 != X.
keep(X,Y) :- edge(X,Y), delete(X1,Y1), Y1 != Y.
reachable(X,Y) :- keep(X,Y).
reachable(X,Y) :- special(Y),reachable(X,Z),reachable(Z,Y).