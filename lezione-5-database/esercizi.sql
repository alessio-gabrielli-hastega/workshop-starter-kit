-- Lezione 5: scrivi qui le tue query SQL.
-- Seleziona una query e premi "Run" (o Ctrl+Enter) per eseguirla.
-- Le query SQL finiscono con `;` e si eseguono selezionandole.
-- Le query INSERT/UPDATE/DELETE MODIFICANO il database: se rompi qualcosa, niente paura:
-- lancia `npm run setup-db` nel terminale per ripartire da zero.
--
-- PROMEMORIA SCHEMA
--   film   (id, titolo, anno, genere, durata_min, regista_id)
--   registi(id, nome, nazionalita, anno_nascita)
-- (le tabelle attori e film_attori le useremo nella Lezione 6)

-- ============================================================
-- PARTE A - SELECT (facile)
-- ============================================================

-- 1. Mostra tutti i film con tutte le colonne.


-- 2. Mostra solo titolo e anno di ogni film.


-- 3. Film usciti dopo il 2000.


-- 4. Film di fantascienza, dal piu' recente al piu' vecchio.


-- 5. Film il cui titolo contiene la parola "Padrino" (usa LIKE).


-- 6. Film usciti tra il 1990 e il 1999 inclusi (usa BETWEEN).


-- 7. I 5 film piu' lunghi (ORDER BY ... DESC LIMIT).


-- 8. Film senza genere (IS NULL). Perche' `= NULL` non funziona?


-- ============================================================
-- PARTE B - AGGREGAZIONI (media)
-- ============================================================

-- 9. Quanti film ci sono? Confronta COUNT(*) con COUNT(genere): perche' sono diversi?


-- 10. Durata media (arrotondata a 1 decimale), minima e massima.


-- 11. Quanti film ci sono per genere, dal genere piu' popolato? (Dove compare il NULL?)


-- 12. Generi con almeno 3 film (HAVING).


-- 13. Per ogni regista_id: numero di film, anno del film piu' vecchio e piu' recente.


-- ============================================================
-- PARTE C - MODIFICA DEI DATI
-- ============================================================

-- 14. INSERT del film "Oppenheimer", 2023, 'Drammatico', 180 minuti, regista_id 1. Verificalo con una SELECT.


-- 15. UPDATE che assegna il genere 'Thriller' a "Memento". Cosa succede se dimentichi il WHERE?


-- 16. DELETE del film inserito al punto 14.


-- ============================================================
-- BONUS
-- ============================================================

-- 17. Registi con anno_nascita NULL.


-- 18. Film piu' lunghi della durata media (sottoquery).

