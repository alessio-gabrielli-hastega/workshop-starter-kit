// LEZIONE 4 - STARTER: il nostro primo server con Express.
// Se conosci Flask, il confronto e' questo:
//   app.get('/percorso', (req, res) => ...)   ~   @app.route('/percorso')
//   req.params, req.query, req.body           ~   request.view_args, request.args, request.json
//   res.json(...), res.status(404).json(...)  ~   jsonify(...), (jsonify(...), 404)
//   array di oggetti in memoria               ~   lista di dict
// Avvia con: npm run start-l4  (un solo server alla volta: la porta 3000 e' la stessa per tutti)
// Completa i TODO. Per testare usa il file richieste.http.
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// ARRAY IN MEMORIA (come una lista di dict in Python): al riavvio i dati si perdono!
// Gli id 1-5 sono gli stessi del database che useremo dalla Lezione 5.
// regista_id: numero che identifica il regista, lo capiremo nelle lezioni 5-6.
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
// MIDDLEWARE 2 (esempio): logger che stampa metodo, URL, status e durata di ogni richiesta
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
  // Esempio gia' scritto: il titolo
  if (typeof body.titolo !== 'string' || body.titolo.trim() === '') {
    return 'titolo obbligatorio (testo non vuoto)';
  }
  if (body.titolo.trim().length > 200) return 'titolo troppo lungo (massimo 200 caratteri)';

  // TODO: anno obbligatorio, intero tra 1888 e 2100.
  //       Suggerimento: Number.isInteger(...) rifiuta anche "1999" scritto come stringa.

  // TODO: genere facoltativo. Se presente e non null: testo non vuoto, massimo 50 caratteri.

  // TODO: durata_min facoltativa. Se presente e non null: intero tra 1 e 1000.

  // TODO: regista_id obbligatorio, intero positivo.

  return null; // nessun errore
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

// ===== ROTTE =====

// TODO: GET /api/film  ->  200 con l'array dei film.
//   Filtro opzionale ?genere=Fantascienza: leggilo da req.query.genere e usa film.filter(...)
//   Il confronto deve ignorare maiuscole/minuscole (toLowerCase). Genere inesistente -> 200 e [].

// TODO: GET /api/film/:id  ->  200 con il film.
//   Usa leggiId(req): se e' null rispondi 400 { errore: 'id non valido' }.
//   Cerca con film.find(...): se non lo trovi rispondi 404 { errore: 'Film non trovato' }.

// TODO: POST /api/film  ->  201 con il film creato.
//   1) validaFilm(req.body): se torna un messaggio rispondi 400 { errore: messaggio }.
//   2) pulisciFilm(req.body) per ottenere i dati puliti.
//   3) Se esiste gia' un film con stesso titolo (senza distinguere maiuscole) e stesso anno: 409.
//   4) Crea { id: prossimoId++, ...dati }, aggiungilo con film.push(...).
//   5) Rispondi con res.status(201).location(`/api/film/${nuovo.id}`).json(nuovo);

// TODO: PUT /api/film/:id  ->  200 con il film sostituito (sostituzione completa).
//   Ordine dei controlli: id valido (400), film esistente (404), body valido (400), duplicato su un ALTRO film (409).
//   Poi: film[indice] = { id, ...dati };

// TODO: DELETE /api/film/:id  ->  204 senza body.
//   id valido (400), film esistente (404), poi film.splice(indice, 1) e res.status(204).end();

// ===== FINE ROTTE =====

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

const server = app.listen(PORT, () => console.log(`Server in ascolto su http://localhost:${PORT}`));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`La porta ${PORT} è occupata: ferma l'altro server con Ctrl+C e riprova.`);
  else console.error('Errore del server:', err.message);
  process.exit(1);
});

// PROVA FINALE: ferma il server con Ctrl+C e riavvialo.
// I film aggiunti sono spariti? Perche'? Cosa ci serve per conservarli? -> Lezione 5
