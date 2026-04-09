UPDATE t_p21225702_cyber_secretary_app.users SET is_admin = TRUE WHERE email = 'mayckova@mail.ru';

UPDATE t_p21225702_cyber_secretary_app.subscriptions SET status = 'free' WHERE user_id = (SELECT id FROM t_p21225702_cyber_secretary_app.users WHERE email = 'mayckova@mail.ru');
