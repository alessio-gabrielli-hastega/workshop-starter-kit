// LEZIONE 9 - PROGETTO CON L'AI: punto di partenza (e' il server della Lezione 8): la stessa API della Lezione 7, piu' l'interfaccia web servita da Express.
// L'API e' identica a quella della Lezione 7 (i test di richieste.http valgono anche qui).
// Prerequisiti: `npm run setup-db` (Lezione 5) e `npm run aggiungi-recensioni`.
// Avvia con: npm run start-l9  (un solo server alla volta: la porta 3000 e' la stessa per tutti)
//
// STILE ASINCRONO: sqlite3 lavora con le callback. db.all / db.get / db.run non restituiscono il risultato:
// chiamano la funzione che passi come ultimo argomento quando la query e' finita, con (err, risultato).
// Controlla SEMPRE err per primo.
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
// CORS (Cross-Origin Resource Sharing):
// - Pagina e API arrivano dallo stesso indirizzo (http://localhost:3000): stessa *origin*
//   (protocollo + host + porta). Il browser non blocca nulla e NON serve il pacchetto cors.
// - Se invece apri index.html con Live Server (porta 5500) o da file:// E cambi la costante API in
//   'http://localhost:3000/api' (con il percorso relativo /api la richiesta andrebbe a Live Server), la pagina chiama un'altra origin
//   e il browser blocca la risposta con un errore CORS (guarda la tab Console dei DevTools).
// - In quel caso bisognerebbe abilitare app.use(cors()): la riga e' lasciata commentata qui sotto
//   per fare la prova in aula.
// const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// L'interfaccia e' in public/ (copia della soluzione della Lezione 8).
const PUBLIC_DIR = path.join(__dirname, 'public');

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

// app.use(cors()); // <- solo per la prova CORS (vedi commento in testa)
// File statici (HTML, CSS, JS del frontend): vanno PRIMA delle rotte /api.
// Pagina e API hanno la stessa origin, quindi niente CORS.
app.use(express.static(PUBLIC_DIR));

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

// GET /api/film (opzionale ?genere=...)
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

// GET /api/film/:id  (db.get: una sola riga, o undefined se non c'e')
app.get('/api/film/:id', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  db.get('SELECT * FROM film WHERE id = ?', [id], (err, riga) => {
    if (err) return erroreDb(err, res, 'GET /api/film/:id');
    if (!riga) return res.status(404).json({ errore: 'Film non trovato' });
    res.json(riga);
  });
});

// POST /api/film
// db.run per INSERT/UPDATE/DELETE. Dentro la callback usa `function`, NON una arrow function:
// solo con `function` esiste `this`, che contiene this.lastID (id inserito) e this.changes (righe toccate).
app.post('/api/film', (req, res) => {
  const problema = validaFilm(req.body);
  if (problema) return res.status(400).json({ errore: problema });
  const d = pulisciFilm(req.body);
  db.run(
    'INSERT INTO film (titolo, anno, genere, durata_min, regista_id) VALUES (?, ?, ?, ?, ?)',
    [d.titolo, d.anno, d.genere, d.durata_min, d.regista_id],
    function (err) {
      if (err) return erroreDb(err, res, 'POST /api/film'); // FK -> 400, UNIQUE -> 409
      const nuovoId = this.lastID;
      db.get('SELECT * FROM film WHERE id = ?', [nuovoId], (err2, riga) => {
        if (err2) return erroreDb(err2, res, 'POST /api/film (rilettura)');
        res.status(201).location(`/api/film/${nuovoId}`).json(riga);
      });
    }
  );
});

// PUT /api/film/:id (sostituzione completa)
app.put('/api/film/:id', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  const problema = validaFilm(req.body);
  if (problema) return res.status(400).json({ errore: problema });
  const d = pulisciFilm(req.body);
  db.run(
    'UPDATE film SET titolo = ?, anno = ?, genere = ?, durata_min = ?, regista_id = ? WHERE id = ?',
    [d.titolo, d.anno, d.genere, d.durata_min, d.regista_id, id],
    function (err) {
      if (err) return erroreDb(err, res, 'PUT /api/film/:id');
      if (this.changes === 0) return res.status(404).json({ errore: 'Film non trovato' });
      db.get('SELECT * FROM film WHERE id = ?', [id], (err2, riga) => {
        if (err2) return erroreDb(err2, res, 'PUT /api/film/:id (rilettura)');
        res.json(riga);
      });
    }
  );
});

// DELETE /api/film/:id
// Grazie a ON DELETE CASCADE cancella anche i collegamenti in film_attori e le recensioni del film.
app.delete('/api/film/:id', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  db.run('DELETE FROM film WHERE id = ?', [id], function (err) {
    if (err) return erroreDb(err, res, 'DELETE /api/film/:id');
    if (this.changes === 0) return res.status(404).json({ errore: 'Film non trovato' });
    res.status(204).end();
  });
});

// GET /api/registi
app.get('/api/registi', (req, res) => {
  db.all('SELECT id, nome, nazionalita, anno_nascita FROM registi ORDER BY nome', [], (err, righe) => {
    if (err) return erroreDb(err, res, 'GET /api/registi');
    res.json(righe);
  });
});

// GET /api/registi/:id/film
// Prima controlliamo che il regista esista (404), poi leggiamo i film con UNA sola query con JOIN
// (mai una query per ogni film: sarebbe il problema "N+1").
app.get('/api/registi/:id/film', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  db.get('SELECT id FROM registi WHERE id = ?', [id], (err, regista) => {
    if (err) return erroreDb(err, res, 'GET /api/registi/:id/film (regista)');
    if (!regista) return res.status(404).json({ errore: 'Regista non trovato' });
    db.all(
      `SELECT f.id, f.titolo, f.anno, f.genere, f.durata_min, r.nome AS regista
       FROM film f JOIN registi r ON r.id = f.regista_id
       WHERE r.id = ? ORDER BY f.anno`,
      [id],
      (err2, righe) => {
        if (err2) return erroreDb(err2, res, 'GET /api/registi/:id/film');
        res.json(righe); // un regista senza film (es. Fellini) restituisce 200 e []
      }
    );
  });
});

// GET /api/film/:id/recensioni
app.get('/api/film/:id/recensioni', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  db.get('SELECT id FROM film WHERE id = ?', [id], (err, filmTrovato) => {
    if (err) return erroreDb(err, res, 'GET recensioni (film)');
    if (!filmTrovato) return res.status(404).json({ errore: 'Film non trovato' });
    db.all(
      'SELECT id, film_id, autore, voto, commento, data_creazione FROM recensioni WHERE film_id = ? ORDER BY id DESC',
      [id],
      (err2, righe) => {
        if (err2) return erroreDb(err2, res, 'GET recensioni'); // "no such table"? -> npm run aggiungi-recensioni
        res.json(righe);
      }
    );
  });
});

// POST /api/film/:id/recensioni
app.post('/api/film/:id/recensioni', (req, res) => {
  const id = leggiId(req);
  if (id === null) return res.status(400).json({ errore: 'id non valido' });
  const problema = validaRecensione(req.body);
  if (problema) return res.status(400).json({ errore: problema });
  db.get('SELECT id FROM film WHERE id = ?', [id], (err, filmTrovato) => {
    if (err) return erroreDb(err, res, 'POST recensioni (film)');
    if (!filmTrovato) return res.status(404).json({ errore: 'Film non trovato' });
    const commento = typeof req.body.commento === 'string' ? req.body.commento : null;
    db.run(
      'INSERT INTO recensioni (film_id, autore, voto, commento) VALUES (?, ?, ?, ?)',
      [id, req.body.autore.trim(), req.body.voto, commento],
      function (err2) {
        if (err2) return erroreDb(err2, res, 'POST recensioni'); // UNIQUE (stesso autore, stesso film) -> 409
        db.get(
          'SELECT id, film_id, autore, voto, commento, data_creazione FROM recensioni WHERE id = ?',
          [this.lastID],
          (err3, riga) => {
            if (err3) return erroreDb(err3, res, 'POST recensioni (rilettura)');
            res.status(201).json(riga);
          }
        );
      }
    );
  });
});

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
