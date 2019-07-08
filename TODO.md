 * n-Player GameSession

1Player: dummy fight, creature fight
2Players: symetrical duel, random duel, 5-plan duel
(n-players: bukake party)


 * type: 'createGameSession'
    - password: null/string
    - mode: symmetricalDuel {viz vyse}
 * type: 'joinGameSession'
    - password: null/string
 * type: 'rejoinSession' (potom co se spojeni client-server prerusilo)
    - sessionHandle: string

 
[create] [join]
JOIN(password: null) = spoji te s nahodnou hrou kde je prazdne misto
JOIN(password:'xyz') = spoji te pouze s hrou xyz pokud je v ni misto


