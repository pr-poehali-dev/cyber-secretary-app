-- Обновляем даты задач на актуальные (май 2026)
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '05.05.2026', done = false WHERE id IN (1, 2, 3, 4, 5, 6);
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '05.05.2026', done = true  WHERE id IN (7, 17);
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '06.05.2026', done = false WHERE id IN (8, 9);
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '07.05.2026', done = false WHERE id IN (10, 11, 12);
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '12.05.2026', done = false WHERE id = 13;
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '14.05.2026', done = false WHERE id = 14;
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '16.05.2026', done = false WHERE id = 15;
UPDATE t_p21225702_cyber_secretary_app.tasks SET task_date = '20.05.2026', done = false WHERE id = 16;

-- Обновляем даты следственных действий
UPDATE t_p21225702_cyber_secretary_app.investigations
SET date = '05.05.2026', done = true
WHERE id IN (SELECT id FROM t_p21225702_cyber_secretary_app.investigations WHERE date < '05.05.2026' AND done = false LIMIT 3);

-- Обновляем next_date у доверителей
UPDATE t_p21225702_cyber_secretary_app.clients SET next_date = '15.05.2026', last_contact = '04.05.2026' WHERE id = 1;
UPDATE t_p21225702_cyber_secretary_app.clients SET next_date = '12.05.2026', last_contact = '03.05.2026' WHERE id = 2;
UPDATE t_p21225702_cyber_secretary_app.clients SET next_date = '22.05.2026', last_contact = '01.05.2026' WHERE id = 3;
UPDATE t_p21225702_cyber_secretary_app.clients SET last_contact = '28.04.2026' WHERE id = 4;
UPDATE t_p21225702_cyber_secretary_app.clients SET next_date = '20.05.2026', last_contact = '04.05.2026' WHERE id = 5;

-- Обновляем days_left у дедлайнов (пересчитываем от сегодня 05.05.2026)
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 3  WHERE id = 1;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 7  WHERE id = 2;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 14 WHERE id = 3;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 21 WHERE id = 4;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 28 WHERE id = 5;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 35 WHERE id = 6;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 42 WHERE id = 7;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 56 WHERE id = 8;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 11 WHERE id = 9;
UPDATE t_p21225702_cyber_secretary_app.deadlines SET days_left = 17 WHERE id = 10;
