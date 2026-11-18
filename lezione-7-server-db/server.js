// LEZIONE 7 - STARTER: il server Express collegato al database SQLite.
// Rispetto alla Lezione 4 l'array in memoria sparira': i dati vivranno nel database e non si perderanno al riavvio.
// Qui GET /api/film e' gia' portata sul database come ESEMPIO: porta tu le altre rotte (vedi i TODO).
// Prerequisiti: `npm run setup-db` (Lezione 5) e `npm run aggiungi-recensioni`.
// Avvia con: npm run start-l7  (un solo server alla volta: la porta 3000 e' la stessa per tutti)
//
// STILE ASINCRONO: sqlite3 lavora con le callback. db.all / db.get / db.run non restituiscono il risultato:
// chiamano la funzione che passi come ultimo argomento quando la query e' finita, con (err, risultato).
// Controlla SEMPRE err per primo.
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Percorso del DB creato da `npm run setup-db` (Lezione 5).
const DB_PATH = path.join(__dirname, '..', 'lezione-5-database', 'database.sqlite');

// OPEN_READWRITE: se il file non esiste dà errore invece di creare un DB vuoto in silenzio
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(`Impossibile aprire il database (${DB_PATH}): ${err.message}`);
    console.error('Hai eseguito `npm run setup-db`?');
    process.exit(1);
  }
  // Le chiavi esterne vanno riattivate a OGNI connessione
  db.run('PRAGMA foreign_keys = ON', (err2) => {
    if (err2) { console.error('PRAGMA fallito:', err2.message); process.exit(1); }
    avviaServer();
  });
});

// TODO (ultimo passo): quando tutte le rotte usano il DB, elimina l'array `film` e `prossimoId`.
// ARRAY IN MEMORIA della Lezione 4: lo usano ancora le rotte non ancora portate sul database.
let film = [
  { id: 1, titolo: 'Inception', anno: 2010, genere: 'Fantascienza', durata_min: 148, regista_id: 1 },
  { id: 2, titolo: 'Interstellar', anno: 2014, genere: 'Fantascienza', durata_min: 169, regista_id: 1 },
  { id: 3, titolo: 'Il Padrino', anno: 1972, genere: 'Drammatico', durata_min: 175, regista_id: 2 },
  { id: 4, titolo: 'Apocalypse Now', anno: 1979, genere: 'Guerra', durata_min: 147, regista_id: 2 },
  { id: 5, titolo: 'Matrix', anno: 1999, genere: 'Fantascienza', durata_min: 136, regista_id: 3 }
];
let prossimoId = 6;

// MIDDLEWARE 1: legge il body JSON e lo mette in req.body
app.use(express.json());
// MIDDLEWARE 2: logger (stampa metodo, URL, status e durata)
app.use((req, res, next) => {
  const inizio = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inizio} ms)`));
  next(); // senza next() la richiesta resta appesa
});

// Legge e controlla l'id nell'URL: ritorna un intero positivo oppure null
function leggiId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Controlla il body di un film. Ritorna null se e' tutto valido, altrimenti il messaggio del primo errore.
function validaFilm(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'il body deve essere un oggetto JSON';
  }
  if (typeof body.titolo !== 'string' || body.titolo.trim() === '') {
    return 'titolo obbligatorio (testo non vuoto)';
  }
  if (body.titolo.trim().length > 200) return 'titolo troppo lungo (massimo 200 caratteri)';
  // Number.isInteger("1999") e' false: un anno passato come stringa viene rifiutato
  if (!Number.isInteger(body.anno) || body.anno < 1888 || body.anno > 2100) {
    return 'anno obbligatorio (numero intero tra 1888 e 2100)';
  }
  if (body.genere !== undefined && body.genere !== null) {
    if (typeof body.genere !== 'string' || body.genere.trim() === '' || body.genere.trim().length > 50) {
      return 'genere non valido (testo non vuoto, massimo 50 caratteri)';
    }
  }
  if (body.durata_min !== undefined && body.durata_min !== null) {
    if (!Number.isInteger(body.durata_min) || body.durata_min < 1 || body.durata_min > 1000) {
      return 'durata_min non valida (numero intero tra 1 e 1000)';
    }
  }
  if (!Number.isInteger(body.regista_id) || body.regista_id < 1) {
    return 'regista_id obbligatorio (numero intero positivo)';
  }
  return null;
}

// Whitelist dei campi: mai fare {...req.body} (mass assignment: un client potrebbe mandare "id")
function pulisciFilm(body) {
  return {
    titolo: body.titolo.trim(),
    anno: body.anno,
    genere: typeof body.genere === 'string' ? body.genere.trim() : null,
    durata_min: body.durata_min ?? null,
    regista_id: body.regista_id
  };
}

// Controlla il body di una recensione (stessa logica di validaFilm: null = ok, altrimenti il messaggio)
function validaRecensione(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'il body deve essere un oggetto JSON';
  }
  if (typeof body.autore !== 'string' || body.autore.trim() === '' || body.autore.trim().length > 50) {
    return 'autore obbligatorio (testo da 1 a 50 caratteri)';
  }
  if (!Number.isInteger(body.voto) || body.voto < 1 || body.voto > 5) {
    return 'voto obbligatorio (numero intero da 1 a 5)';
  }
  if (body.commento !== undefined && body.commento !== null) {
    if (typeof body.commento !== 'string' || body.commento.length > 500) {
      return 'commento non valido (testo di massimo 500 caratteri)';
    }
  }
  return null;
}

// Traduce gli errori del database in risposte HTTP.
// Il dettaglio tecnico (err.message di SQLite) resta nel log: al client non va mai mostrato.
function erroreDb(err, res, contesto) {
  if (err.code === 'SQLITE_CONSTRAINT') {
    if (err.message.includes('FOREIGN KEY')) return res.status(400).json({ errore: 'Riferimento a una risorsa inesistente' });
    if (err.message.includes('UNIQUE')) return res.status(409).json({ errore: 'Risorsa già presente' });
    return res.status(400).json({ errore: 'Dati non validi' }); // CHECK, NOT NULL
  }
  // Se leggi "no such table: recensioni" hai eseguito `npm run aggiungi-recensioni`?
  console.error(`[ERRORE DB] ${contesto}:`, err.message);
  res.status(500).json({ errore: 'Errore interno del server' });
}

// GET /api/film (opzionale ?genere=...)  -- ESEMPIO GIA' PORTATO SUL DB
// db.all: esegue la query e passa TUTTE le righe alla callback. Il secondo argomento sono i parametri.
// I valori dell'utente vanno SEMPRE nei parametri (?), mai concatenati nella stringa SQL.
app.get('/api/film', (req, res) => {
  const { genere } = req.query;
  let sql = 'SELECT * FROM film';
  const parametri = [];
  if (typeof genere === 'string' && genere.trim() !== '') {
    sql += ' WHERE genere = ? COLLATE NOCASE'; // NOCASE: ignora maiuscole e minuscole
    parametri.push(genere.trim());
  }
  sql += ' ORDER BY id';
  db.all(sql, parametri, (err, righe) => {
    if (err) return erroreDb(err, res, 'GET /api/film');
    res.json(righe);
  });
});

// ===== DA PORTARE SUL DATABASE =====
// Queste quattro rotte usano ancora l'array: sostituisci il corpo con le query SQL.
// Ricorda: usa sempre i parametri (?) e controlla sempre err per primo.
// Dentro le callback di db.run usa `function`, NON una arrow function, altrimenti `this` non funziona.

// TODO: GET /api/film/:id
//   db.get('SELECT * FROM film WHERE id = ?', [id], (err, riga) => { ... })
//   err -> erroreDb(err, res, '...');  riga undefined -> 404;  altrimenti res.json(riga)
app.get('/api/film/:id', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  const trovato = film.find(f => f.id === id);
  if (!trovato) return res.status(404).json({ errore: 'Film non trovato' });
  res.json(trovato);
});

// TODO: POST /api/film
//   db.run('INSERT INTO film (titolo, anno, genere, durata_min, regista_id) VALUES (?, ?, ?, ?, ?)', [...], function (err) { ... })
//   Dentro la callback: this.lastID e' l'id nuovo; rileggi il film con db.get e rispondi 201 + Location.
//   Errori: erroreDb traduce FK (regista inesistente) in 400 e UNIQUE (duplicato) in 409.
app.post('/api/film', (req, res) => {
  const problema = validaFilm(req.body);
  if (problema) return res.status(400).json({ errore: problema });
  const dati = pulisciFilm(req.body);
  if (film.some(f => f.titolo.toLowerCase() === dati.titolo.toLowerCase() && f.anno === dati.anno)) {
    return res.status(409).json({ errore: 'Esiste già un film con stesso titolo e anno' });
  }
  const nuovo = { id: prossimoId++, ...dati };
  film.push(nuovo);
  res.status(201).location(`/api/film/${nuovo.id}`).json(nuovo);
});

// TODO: PUT /api/film/:id
//   db.run('UPDATE film SET titolo = ?, anno = ?, genere = ?, durata_min = ?, regista_id = ? WHERE id = ?', [...], function (err) { ... })
//   this.changes === 0 -> 404; altrimenti rileggi il film e rispondi 200.
app.put('/api/film/:id', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  const indice = film.findIndex(f => f.id === id);
  if (indice === -1) return res.status(404).json({ errore: 'Film non trovato' });
  const problema = validaFilm(req.body);
  if (problema) return res.status(400).json({ errore: problema });
  const dati = pulisciFilm(req.body);
  if (film.some(f => f.id !== id && f.titolo.toLowerCase() === dati.titolo.toLowerCase() && f.anno === dati.anno)) {
    return res.status(409).json({ errore: 'Esiste già un film con stesso titolo e anno' });
  }
  film[indice] = { id, ...dati };
  res.json(film[indice]);
});

// TODO: DELETE /api/film/:id
//   db.run('DELETE FROM film WHERE id = ?', [id], function (err) { ... })
//   this.changes === 0 -> 404; altrimenti 204. (ON DELETE CASCADE cancella anche attori collegati e recensioni)
app.delete('/api/film/:id', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  const indice = film.findIndex(f => f.id === id);
  if (indice === -1) return res.status(404).json({ errore: 'Film non trovato' });
  film.splice(indice, 1);
  res.status(204).end();
});

// ===== NUOVE ROTTE (non esistevano nella Lezione 4) =====

// TODO: GET /api/registi  ->  200
//   db.all('SELECT id, nome, nazionalita, anno_nascita FROM registi ORDER BY nome', [], (err, righe) => { ... })

// TODO: GET /api/registi/:id/film  ->  200 (anche []), 404 se il regista non esiste
//   1) db.get('SELECT id FROM registi WHERE id = ?', [id], ...)  -> se manca: 404
//   2) db.all con JOIN, UNA sola query (niente query dentro un ciclo):
//      SELECT f.id, f.titolo, f.anno, f.genere, f.durata_min, r.nome AS regista
//      FROM film f JOIN registi r ON r.id = f.regista_id WHERE r.id = ? ORDER BY f.anno
//   Fellini (id 8) esiste ma non ha film: deve rispondere 200 e [].

// TODO: GET /api/film/:id/recensioni  ->  200, 404 se il film non esiste
//   Verifica il film (db.get), poi:
//   SELECT id, film_id, autore, voto, commento, data_creazione FROM recensioni WHERE film_id = ? ORDER BY id DESC
//   Se leggi "no such table: recensioni" hai eseguito `npm run aggiungi-recensioni`?

// TODO: POST /api/film/:id/recensioni  ->  201, 400 dati non validi, 404 film inesistente, 409 recensione doppia
//   validaRecensione(req.body) e' gia' pronta. Verifica il film (404), poi:
//   INSERT INTO recensioni (film_id, autore, voto, commento) VALUES (?, ?, ?, ?)
//   Rileggi la riga con this.lastID e rispondi 201. Il vincolo UNIQUE fa il resto (erroreDb -> 409).

// Rotta /api/* sconosciuta -> 404 in JSON
app.use('/api', (req, res) => res.status(404).json({ errore: 'Risorsa non trovata' }));

// Gestore errori (4 parametri): JSON malformato e imprevisti
app.use((err, req, res, next) => {
  // Se la risposta è già partita, lasciamo gestire l'errore a Express
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ errore: 'JSON non valido' });
  // Body più grande del limite di express.json (100 KB): errore del client, non del server
  if (err.type === 'entity.too.large') return res.status(413).json({ errore: 'Body troppo grande' });
  console.error('[ERRORE]', err);
  res.status(500).json({ errore: 'Errore interno del server' });
});

function avviaServer() {
  const server = app.listen(PORT, () => console.log(`Server in ascolto su http://localhost:${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`La porta ${PORT} è occupata: ferma l'altro server con Ctrl+C e riprova.`);
    else console.error('Errore del server:', err.message);
    process.exit(1);
  });
}

// Chiusura pulita del database con Ctrl+C
process.on('SIGINT', () => db.close(() => process.exit(0)));

// ===========================================================================
// ATTENZIONE: SQL INJECTION
// ===========================================================================
// === ESEMPIO DA NON FARE MAI (discutilo con il docente, non attivarlo) ===
// app.get('/api/film-pericoloso', (req, res) => {
//   const genere = req.query.genere;
//   const sql = "SELECT * FROM film WHERE genere = '" + genere + "'";   // <-- concatenazione!
//   db.all(sql, (err, righe) => res.json(righe));
// });
// Con ?genere=Crime tutto bene. Ma con ?genere=' OR '1'='1 la query diventa
//   SELECT * FROM film WHERE genere = '' OR '1'='1'      -> restituisce TUTTO
// e con ?genere=' UNION SELECT id, nome, 0, NULL, NULL, 1 FROM registi --
// l'attaccante legge anche altre tabelle (stesso numero di colonne di film: 6).
// db.all esegue una sola istruzione, ma db.exec ne eseguirebbe più d'una, ad es.
// '; DROP TABLE film; --
// SOLUZIONE: parametri ?, il driver tratta il valore SEMPRE come dato, mai come codice:
//   db.all("SELECT * FROM film WHERE genere = ?", [genere], ...)
