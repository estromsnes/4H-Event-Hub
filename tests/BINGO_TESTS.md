# Bingo Test Suite

Dette dokumentet beskriver testene som er implementert for Bingo-funksjonen.

## Oversikt

Testene er delt inn i to kategorier:
- **Unit tests** (`tests/unit/bingo.test.js`) - Tester individuelle funksjoner isolert
- **Integration tests** (`tests/integration/bingo.test.js`) - Tester API-endepunkter end-to-end

## Unit Tests (20 tester)

### checkAchievements() - 12 tester

Tester logikken for å oppdage fullførte rader, kolonner, diagonaler og fulle kort:

1. ✅ Skal returnere tomme achievements når ingen oppgaver er fullført
2. ✅ Skal oppdage fullført rad (første rad)
3. ✅ Skal oppdage fullført rad (midtre rad med fri rute)
4. ✅ Skal oppdage fullført kolonne (første kolonne)
5. ✅ Skal oppdage fullført kolonne (midtre kolonne med fri rute)
6. ✅ Skal oppdage fullført diagonal (øvre venstre til nedre høyre)
7. ✅ Skal oppdage fullført diagonal (øvre høyre til nedre venstre)
8. ✅ Skal oppdage begge diagonaler samtidig
9. ✅ Skal oppdage flere rader og kolonner samtidig
10. ✅ Skal oppdage fullt kort (alle 24 posisjoner + fri rute)
11. ✅ Skal fungere med 3x3 kort-størrelse
12. ✅ Skal håndtere fri rute korrekt for 3x3 grid

### calculatePoints() - 8 tester

Tester beregning av poeng basert på fullførte oppgaver og achievements:

1. ✅ Skal beregne 0 poeng for ingen fullføringer
2. ✅ Skal beregne poeng kun for oppgaver (ingen achievements)
3. ✅ Skal beregne poeng for én rad achievement
4. ✅ Skal beregne poeng for flere achievements
5. ✅ Skal beregne poeng for fullt kort
6. ✅ Skal bruke egendefinerte konfigurasjonsverider
7. ✅ Skal beregne poeng med kun fullt kort bonus
8. ✅ Skal håndtere null bonus-verdier

## Integration Tests (29 tester)

### Participant Endpoints

#### POST /api/bingo/start - 4 tester
1. ✅ Skal returnere 400 hvis participant_code mangler
2. ✅ Skal returnere 404 for ikke-eksisterende deltaker
3. ✅ Skal opprette Bingo-kort for gyldig deltaker
4. ✅ Skal returnere eksisterende kort hvis allerede opprettet

#### GET /api/bingo/card/:participant_code - 3 tester
5. ✅ Skal returnere 404 for deltaker uten kort
6. ✅ Skal returnere Bingo-kort for deltaker med kort
7. ✅ Kort skal ha korrekt struktur (tasks, layout, completions, achievements, stats)

#### POST /api/bingo/scan - 5 tester
8. ✅ Skal returnere 400 hvis påkrevde felter mangler
9. ✅ Skal returnere 400 hvis participant_code mangler
10. ✅ Skal returnere 400 hvis scanned_code mangler
11. ✅ Skal returnere 404 for ikke-eksisterende kort
12. ✅ Skal forhindre scanning av seg selv

#### GET /api/bingo/leaderboard - 4 tester
13. ✅ Skal returnere Bingo leaderboard
14. ✅ Leaderboard-oppføringer skal ha påkrevde felter
15. ✅ Leaderboard skal være sortert korrekt (full card first, then points)
16. ✅ Leaderboard skal ha sekvensielle rangeringer

### Admin Endpoints

#### GET /api/bingo/admin/config - 2 tester
17. ✅ Skal returnere Bingo-konfigurasjon
18. ✅ Skal ha standard konfigurasjonsverdier

#### GET /api/bingo/admin/tasks - 3 tester
19. ✅ Skal returnere liste over Bingo-oppgaver
20. ✅ Skal ha minst 25 oppgaver for et fullt kort
21. ✅ Oppgaver skal ha påkrevde felter (id, task_text, category, active)

#### POST /api/bingo/admin/config - 2 tester
22. ✅ Skal kreve admin token
23. ✅ Skal oppdatere Bingo-konfigurasjon

#### POST /api/bingo/admin/tasks - 3 tester
24. ✅ Skal kreve admin token
25. ✅ Skal opprette ny Bingo-oppgave
26. ✅ Skal returnere 400 hvis task_text mangler

#### GET /api/bingo/admin/stats - 3 tester
27. ✅ Skal kreve admin token
28. ✅ Skal returnere Bingo-statistikk
29. ✅ Statistikk skal ha gyldige numeriske verdier

## Kjøre Testene

### Alle tester
```bash
npm test
```

### Kun unit tests
```bash
npm run test:unit
```

### Kun integration tests
```bash
npm run test:integration
```

### Kun Bingo-tester
```bash
npm run test:unit -- --testNamePattern="Bingo"
npm run test:integration -- --testNamePattern="Bingo"
```

### Med coverage rapport
```bash
npm run test:coverage
```

## Test Coverage

Testene dekker:
- ✅ Alle hjelpefunksjoner (checkAchievements, calculatePoints)
- ✅ Alle public API-endepunkter
- ✅ Error handling (400, 401, 404 statuskoder)
- ✅ Edge cases (ingen data, full card, multiple achievements)
- ✅ Input validering
- ✅ Admin token autentisering
- ✅ Database operasjoner

## Notater

- Integration tests bruker in-memory database (`:memory:`) for å unngå å påvirke faktisk data
- Admin tests logger automatisk inn for å få gyldig token
- Admin tests hoppes over hvis autentisering feiler (graceful degradation)
- Tests rydder opp etter seg (sletter test-data)
- Timeout satt til 10 sekunder for å håndtere trege systemer
