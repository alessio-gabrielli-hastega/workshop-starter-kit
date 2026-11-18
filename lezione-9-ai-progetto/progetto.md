# Lezione 9: progetto con l'AI

Partiamo dall'applicazione completa della Lezione 8 (`npm run start-l9`).
Prerequisiti: `npm run setup-db` e poi `npm run aggiungi-recensioni`.

## 1. Obiettivo

Aggiungere al catalogo, con l'aiuto di Cline, due funzioni end-to-end (database, API e interfaccia):

- il **voto medio** (e il numero di recensioni) di ogni film;
- un filtro per **attore**.

## 2. Requisiti funzionali

- `GET /api/film` restituisce per ogni film anche `voto_medio` (numero decimale con 1 cifra, `null` se non ci sono recensioni) e `numero_recensioni`.
- `GET /api/film?attore=de%20niro` restituisce solo i film in cui recita un attore il cui nome contiene la stringa (senza distinguere maiuscole e minuscole). E' combinabile con `?genere=`.
- `GET /api/attori` restituisce l'elenco degli attori (utile ad esempio per riempire un menu a tendina).
- Interfaccia:
  - il voto medio e' visibile accanto a ogni film;
  - c'e' un campo (o un select) per filtrare per attore;
  - c'e' un modo per aggiungere una recensione a un film (un form, oppure finestre di dialogo con prompt()).

## 3. Vincoli

- Query parametrizzate (`?`), mai concatenazione di stringhe con input dell'utente.
- Validazione degli input.
- Nessuna dipendenza nuova senza consultare il docente.
- I test di `richieste.http` della Lezione 7 devono continuare a passare.
- L'interfaccia non deve rompersi quando `voto_medio` e' `null`.
- Le liste si ottengono con un solo JOIN / GROUP BY, mai con una query per ogni riga (problema "N+1").

## 4. Criteri di accettazione

- `GET /api/film?attore=Brando` -> 2 film (Il Padrino, Apocalypse Now).
- `?attore=De Niro` -> 3 film.
- Dopo `aggiungi-recensioni`, il voto medio di Inception e' 4.7 (voti 5, 4, 5).
- `?attore=zzz` -> `[]`.
- Nessun film duplicato quando un film ha piu' attori che corrispondono.

## 5. Come lavorare con Cline

### Prompt efficaci

Indica il contesto (file e tabelle), l'obiettivo, i vincoli (query parametrizzate, stile del progetto) e il formato atteso.
Chiedi prima un piano in modalita' plan, poi procedi un passo alla volta.

Esempio di prompt iniziale:

> Nel file `server.js` voglio aggiungere `voto_medio` a `GET /api/film`. Le tabelle sono `film` e `recensioni(film_id, voto)`. Usa una `LEFT JOIN` e query parametrizzate. Prima spiegami il piano, poi modifica solo `server.js`.

### Prompt da evitare

- «fai tutto tu»;
- richieste vaghe;
- incollare segreti o chiavi.

### Revisione critica

Rivedi ogni modifica prima di accettarla. Checklist:

- [ ] Legge davvero il database o inventa colonne?
- [ ] Ci sono concatenazioni di stringhe nelle query?
- [ ] Gestisce i NULL (media senza recensioni)?
- [ ] Evita query in un ciclo (N+1)?
- [ ] Valida i parametri?
- [ ] Gli errori danno gli status giusti (400/404/500)?
- [ ] Ha aggiunto dipendenze non richieste?
- [ ] Capisco ogni riga? Se no: chiedi a Cline di spiegarla.

### Debug

- Incolla l'errore completo e il file coinvolto.
- Chiedi la causa prima della correzione.
- Riproduci il problema con `richieste.http`.
- Usa Git per tornare indietro (se la tua cartella e' un repository Git): fai un commit a ogni passo che funziona.

## 6. Cenni finali

- **Autenticazione:** sessioni o JWT; le password si salvano con hash, mai in chiaro.
- **Deploy:** servizio di hosting, `PORT` da variabile d'ambiente, attenzione al DB SQLite su disco effimero.
- **Variabili d'ambiente:** file `.env` mai nel repository.
- **HTTPS** in produzione.

## 7. Consegna e demo

5 minuti: mostrate le due funzioni, spiegate una query scritta dall'AI e un errore che Cline ha fatto e come lo avete trovato.
