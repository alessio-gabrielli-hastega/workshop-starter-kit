const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Questo file crea (o ricrea da zero) il database usato dalle Lezioni 5-9.
// Lancialo con: npm run setup-db
const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);
db.configure('busyTimeout', 3000); // se Database Client ha il file aperto, aspetta invece di fallire subito

let errori = 0;
function esegui(sql, parametri = []) {
    db.run(sql, parametri, (err) => {
        if (err) {
            errori++;
            console.error(`Errore SQL: ${err.message}\n   Query: ${sql.trim().split('\n')[0]}`);
        }
    });
}

// DATI (id espliciti: gli id nei test e negli esercizi sono sempre gli stessi)
const registi = [ // [id, nome, nazionalita, anno_nascita]
    [1, 'Christopher Nolan', 'Regno Unito', 1970], [2, 'Francis Ford Coppola', 'USA', 1939],
    [3, 'Lana e Lilly Wachowski', 'USA', null],   // anno_nascita NULL di proposito
    [4, 'Quentin Tarantino', 'USA', 1963], [5, 'Steven Spielberg', 'USA', 1946],
    [6, 'Martin Scorsese', 'USA', 1942], [7, 'Hayao Miyazaki', 'Giappone', 1941],
    [8, 'Federico Fellini', 'Italia', 1920]       // nessun film in catalogo: serve per LEFT JOIN / IS NULL
];
const film = [ // [id, titolo, anno, genere, durata_min, regista_id]
    [1, 'Inception', 2010, 'Fantascienza', 148, 1], [2, 'Interstellar', 2014, 'Fantascienza', 169, 1],
    [3, 'Il Padrino', 1972, 'Drammatico', 175, 2], [4, 'Apocalypse Now', 1979, 'Guerra', 147, 2],
    [5, 'Matrix', 1999, 'Fantascienza', 136, 3], [6, 'Pulp Fiction', 1994, 'Crime', 154, 4],
    [7, 'Le iene', 1992, 'Crime', 99, 4], [8, 'Kill Bill: Volume 1', 2003, 'Azione', 111, 4],
    [9, 'Jurassic Park', 1993, 'Avventura', 127, 5], [10, "Schindler's List", 1993, 'Drammatico', 195, 5],
    [11, 'Salvate il soldato Ryan', 1998, 'Guerra', 169, 5], [12, 'Lo squalo', 1975, 'Thriller', 124, 5],
    [13, 'Taxi Driver', 1976, 'Drammatico', 114, 6], [14, 'Quei bravi ragazzi', 1990, 'Crime', 145, 6],
    [15, 'The Departed', 2006, 'Crime', 151, 6], [16, 'Il Padrino - Parte II', 1974, 'Drammatico', 202, 2],
    [17, 'La città incantata', 2001, 'Animazione', 125, 7], [18, 'Il mio vicino Totoro', 1988, 'Animazione', 86, 7],
    [19, 'Il Cavaliere Oscuro', 2008, 'Azione', 152, 1], [20, 'Dunkirk', 2017, 'Guerra', 106, 1],
    [21, 'Memento', 2000, null, 113, 1],            // genere NULL
    [22, 'Tenet', 2020, null, 150, 1]               // genere NULL
];
const attori = [ // [id, nome, anno_nascita]
    [1, 'Leonardo DiCaprio', 1974], [2, 'Joseph Gordon-Levitt', 1981], [3, 'Matthew McConaughey', 1969],
    [4, 'Anne Hathaway', 1982], [5, 'Marlon Brando', 1924], [6, 'Al Pacino', 1940], [7, 'Robert De Niro', 1943],
    [8, 'Keanu Reeves', 1964], [9, 'Laurence Fishburne', 1961], [10, 'John Travolta', 1954],
    [11, 'Samuel L. Jackson', 1948], [12, 'Uma Thurman', 1970], [13, 'Tom Hanks', 1956],
    [14, 'Christian Bale', 1974], [15, 'Heath Ledger', 1979], [16, 'Martin Sheen', 1940],
    [17, 'Scarlett Johansson', 1984]             // nessun film: serve per LEFT JOIN
];
const filmAttori = [ // [film_id, attore_id, personaggio]
    [1, 1, 'Dom Cobb'], [1, 2, 'Arthur'], [2, 3, 'Cooper'], [2, 4, 'Brand'],
    [3, 5, 'Vito Corleone'], [3, 6, 'Michael Corleone'], [4, 5, 'Colonnello Kurtz'], [4, 16, 'Capitano Willard'],
    [5, 8, 'Neo'], [5, 9, 'Morpheus'], [6, 10, 'Vincent Vega'], [6, 11, 'Jules Winnfield'], [6, 12, 'Mia Wallace'],
    [8, 12, 'La Sposa'], [9, 11, 'Arnold'], [11, 13, 'Capitano Miller'], [13, 7, 'Travis Bickle'],
    [14, 7, 'James Conway'], [15, 1, 'Billy Costigan'], [16, 6, 'Michael Corleone'], [16, 7, 'Vito Corleone giovane'],
    [19, 14, 'Bruce Wayne'], [19, 15, 'Joker']
]; // 23 righe. Film senza attori in catalogo: 7, 10, 12, 17, 18, 20, 21, 22 (8 film)

console.log('Inizializzazione del database (Lezione 5)...');

// serialize() fa eseguire le query una dopo l'altra, nell'ordine in cui sono scritte.
db.serialize(() => {
    esegui('PRAGMA foreign_keys = ON'); // vale solo per QUESTA connessione: ogni server deve riattivarlo

    // Ripartiamo da zero: prima le tabelle "figlie", poi le "madri"
    // (nome tabella da lista fissa nel codice, mai da input utente)
    ['recensioni', 'film_attori', 'attori', 'film', 'registi'].forEach(t => esegui(`DROP TABLE IF EXISTS ${t}`));

    // Registi: nome obbligatorio, non vuoto e unico
    esegui(`CREATE TABLE registi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE CHECK (length(trim(nome)) > 0),   -- niente nomi vuoti né doppioni
        nazionalita TEXT,                                           -- facoltativa (puo' essere NULL)
        anno_nascita INTEGER CHECK (anno_nascita IS NULL OR anno_nascita > 1800)
    )`);

    // Film: regista_id e' la chiave esterna verso registi
    esegui(`CREATE TABLE film (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titolo TEXT NOT NULL CHECK (length(trim(titolo)) > 0),
        anno INTEGER NOT NULL CHECK (anno BETWEEN 1888 AND 2100),   -- il primo film della storia e' del 1888
        genere TEXT CHECK (genere IS NULL OR length(trim(genere)) > 0),
        durata_min INTEGER CHECK (durata_min IS NULL OR durata_min > 0),
        regista_id INTEGER NOT NULL REFERENCES registi(id) ON DELETE RESTRICT,  -- non si cancella un regista che ha film
        UNIQUE (titolo, anno)                                       -- stesso titolo e anno = stesso film
    )`);

    // Attori
    esegui(`CREATE TABLE attori (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE CHECK (length(trim(nome)) > 0),
        anno_nascita INTEGER CHECK (anno_nascita IS NULL OR anno_nascita > 1800)
    )`);

    // Tabella ponte (relazione molti-a-molti tra film e attori)
    esegui(`CREATE TABLE film_attori (
        film_id INTEGER NOT NULL REFERENCES film(id) ON DELETE CASCADE,      -- cancellando un film spariscono i collegamenti
        attore_id INTEGER NOT NULL REFERENCES attori(id) ON DELETE CASCADE,  -- idem cancellando un attore
        personaggio TEXT,
        PRIMARY KEY (film_id, attore_id)                                     -- un attore compare una sola volta per film
    )`);

    registi.forEach(r => esegui('INSERT INTO registi (id, nome, nazionalita, anno_nascita) VALUES (?, ?, ?, ?)', r));
    film.forEach(f => esegui('INSERT INTO film (id, titolo, anno, genere, durata_min, regista_id) VALUES (?, ?, ?, ?, ?, ?)', f));
    attori.forEach(a => esegui('INSERT INTO attori (id, nome, anno_nascita) VALUES (?, ?, ?)', a));
    filmAttori.forEach(l => esegui('INSERT INTO film_attori (film_id, attore_id, personaggio) VALUES (?, ?, ?)', l));

    db.all(`SELECT 'registi' AS tabella, COUNT(*) AS righe FROM registi
            UNION ALL SELECT 'film', COUNT(*) FROM film
            UNION ALL SELECT 'attori', COUNT(*) FROM attori
            UNION ALL SELECT 'film_attori', COUNT(*) FROM film_attori`, (err, righe) => {
        if (err) { errori++; console.error('Errore nel conteggio:', err.message); return; }
        console.table(righe); // attesi: 8, 22, 17, 23
    });
    db.all('PRAGMA foreign_key_check', (err, viol) => { // elenco righe che violano le chiavi esterne: deve essere vuoto
        if (!err && viol.length > 0) { errori++; console.error('Violazioni FK:', viol); }
    });

    // close() e' accodato: parte solo quando tutte le query precedenti sono finite
    db.close((err) => {
        if (err) { console.error('Errore nella chiusura:', err.message); process.exitCode = 1; return; }
        if (errori > 0) { console.error(`Database creato con ${errori} errori.`); process.exitCode = 1; }
        else console.log('Database creato con successo: lezione-5-database/database.sqlite');
    });
});
