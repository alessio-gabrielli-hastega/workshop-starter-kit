# Progetta l'API del catalogo film

Prima di scrivere il server (Lezione 4) decidiamo come deve essere fatta l'API.

## L'idea

In un'API REST:
- le **risorse** sono **sostantivi al plurale** (film, registi, recensioni);
- il **metodo HTTP** e' il **verbo**: GET legge, POST crea, PUT sostituisce, DELETE elimina.

## Regole di naming

- La collezione sta al plurale: `/api/film`.
- Un singolo elemento si indica con l'id: `/api/film/:id` (per esempio `/api/film/3`).
- Niente verbi nell'URL: `/api/film` e non `/api/creaFilm`.

## Tabella da compilare

Compila le colonne vuote.

| Operazione | Metodo | URL | Query/Body | Status se OK | Status se errore |
|---|---|---|---|---|---|
| Elenco di tutti i film | | | | | |
| Film filtrati per genere | | | | | |
| Dettaglio di un film | | | | | |
| Creazione di un film | | | | | |
| Sostituzione di un film | | | | | |
| Cancellazione di un film | | | | | |
| Elenco dei registi | | | | | |
| Film di un regista | | | | | |
| Recensioni di un film | | | | | |
| Aggiungere una recensione | | | | | |

## Domande aperte

1. Cosa torna una GET su un id inesistente?
2. Il filtro per genere e' un pezzo del percorso o una query string?
3. La creazione restituisce solo l'id o tutto l'oggetto?
4. Cosa succede se mando un titolo mancante?
