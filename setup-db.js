const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log("Inizializzazione del database...");

db.serialize(() => {
    // Crea la tabella se non esiste
    db.run("CREATE TABLE IF NOT EXISTS film (id INTEGER PRIMARY KEY AUTOINCREMENT, titolo TEXT, anno INTEGER, genere TEXT)");
    
    // Pulisce i vecchi dati per evitare duplicati ad ogni avvio
    db.run("DELETE FROM film");
    
    // Inserisce dati di prova (il nostro "catalogo Netflix")
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Inception', 2010, 'Fantascienza')");
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Il Padrino', 1972, 'Drammatico')");
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Matrix', 1999, 'Fantascienza')");
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Interstellar', 2014, 'Fantascienza')");
    db.run("INSERT INTO film (titolo, anno, genere) VALUES ('Parasite', 2019, 'Thriller')");
    
    console.log("Database popolato con successo con i film iniziali!");
});

db.close();
