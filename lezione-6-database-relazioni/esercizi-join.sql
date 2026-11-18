-- Lezione 6: relazioni tra tabelle, JOIN e integrita' dei dati.
-- Seleziona una query e premi "Run" (o Ctrl+Enter) per eseguirla. Le query finiscono con `;`.
-- Se rompi qualcosa: `npm run setup-db` ricrea il database da zero.
--
-- SCHEMA E RELAZIONI
--
--   registi (id, nome, nazionalita, anno_nascita)
--      1
--      |            1 regista -> N film   (film.regista_id punta a registi.id)
--      N
--   film (id, titolo, anno, genere, durata_min, regista_id)
--      1
--      |            N film <-> N attori, tramite la tabella ponte film_attori
--      N
--   film_attori (film_id, attore_id, personaggio)
--      N
--      |
--      1
--   attori (id, nome, anno_nascita)
--
-- PRIMO COMANDO DA ESEGUIRE NELLA SESSIONE: attiva i controlli sulle chiavi esterne.
-- (In Database Client possono essere spenti: verifica con `PRAGMA foreign_keys;` -> deve dare 1.)
PRAGMA foreign_keys = ON;

-- ============================================================
-- PARTE A - JOIN
-- ============================================================

-- 1. Titolo e nome del regista di ogni film (INNER JOIN).


-- 2. Titoli dei film diretti da Steven Spielberg.


-- 3. Per ogni regista che ha film: nome e numero di film (JOIN + GROUP BY).


-- 4. Tutti i registi con il numero di film, compresi quelli a 0 (LEFT JOIN).
--    Perche' si usa COUNT(f.id) e non COUNT(*)?


-- 5. Registi senza alcun film (LEFT JOIN ... IS NULL).


-- 6. Attori e personaggi di "Pulp Fiction" (3 tabelle).


-- 7. Titoli dei film in cui recita Robert De Niro.


-- 8. Film senza attori in catalogo.


-- 9. Tutti gli attori con il numero di film, dal piu' presente (anche quelli a 0).


-- 10. Per ogni film: titolo, regista e elenco degli attori separati da virgola (GROUP_CONCAT, LEFT JOIN).


-- 11. BONUS: coppie attore-regista che hanno collaborato in almeno 2 film.


-- ============================================================
-- PARTE B - INTEGRITA'
-- ============================================================

-- 12. Con le chiavi esterne attive, prova a eseguire ciascuna di queste operazioni e scrivi l'errore ottenuto:
--   a. inserire un film con regista_id = 999
--   b. cancellare il regista 1
--   c. inserire un regista con un nome gia' esistente
--   d. inserire un film con anno 1500
--   e. inserire un film senza titolo
--   f. cancellare il film 3 e guardare cosa succede in film_attori


-- 13. Transazioni:
--     BEGIN; DELETE FROM film WHERE anno < 1980; SELECT COUNT(*) FROM film; ROLLBACK;
--     Poi ripeti con COMMIT al posto di ROLLBACK solo se vuoi (ricorda `npm run setup-db`).


-- 14. Indici: guarda come SQLite esegue questa query...
--     EXPLAIN QUERY PLAN SELECT * FROM film WHERE regista_id = 1;
--     ...poi crea l'indice `idx_film_regista_id` su film(regista_id) e riesegui la EXPLAIN.

