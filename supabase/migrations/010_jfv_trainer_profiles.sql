-- ============================================================
-- Migration 010: JFV Hünstetten Trainer-Profile
-- 28 Trainer aus der JFV-Hünstetten Trainerliste
-- Nur Profile (ohne Supabase Auth), Rolle: trainer
-- ============================================================

INSERT INTO profiles (first_name, last_name, email, phone, ist_trainer, kann_buchen) VALUES
  ('Manuel',    'Asvany',       'manuel.asvany@gmx.de',                      '017620760182',     true, true),
  ('Holger',    'Bouffier',     'Holger.Bouffier@JFV-Huenstetten.de',        '0612655371',       true, true),
  ('Tobias',    'Bruhn',        'Tobias.Bruhn@JFV-Huenstetten.de',           '01736789564',      true, true),
  ('Basti',     'Buchholz',     'basti81buchholz@web.de',                     '01772429475',      true, true),
  ('Timo',      'Burggraf',     'Timo.Burggraf@JFV-Huenstetten.de',          '01722666013',      true, true),
  ('Oliver',    'Champaert',    'oliver.champaert@jfv-huenstetten.de',        '01776808952',      true, true),
  ('Dennis',    'Duras',        'Dennis.Duras@JFV-Huenstetten.de',           '01637931705',      true, true),
  ('Christian', 'Engelke',      'Christian.Engelke@JFV-Huenstetten.de',      '017631643968',     true, true),
  ('Peter',     'Enkelmann',    'Peter.Enkelmann@JFV-Huenstetten.de',         NULL,               true, true),
  ('Markus',    'Forbach',      'Markus_Forbach@hotmail.de',                  '017624777005',     true, true),
  ('Karsten',   'Größchen',     'karsten.groesschen@jfv-huenstetten.de',      '017624660603',     true, true),
  ('Stan',      'Günther',      'Stan.Guenther@JFV-Huenstetten.de',          '015120336382',     true, true),
  ('Uli',       'Hanenkamp',    'Uli.Hanenkamp@JFV-Huenstetten.de',           NULL,               true, true),
  ('Leonie',    'Höhn',         'hoehnleonie22@gmail.com',                    '015117488645',     true, true),
  ('Brigitte',  'Jodway',       'brigittehendel@hotmail.de',                  '017645779333',     true, true),
  ('Lutz',      'Kandler',      'kandler.lutz@t-online.de',                   '017652878300',     true, true),
  ('Jan',       'Kimpel',       'Jan.Kimpel@JFV-Huenstetten.de',             '016090343002',     true, true),
  ('Heiko',     'Köhler',       'Heiko123460@msn.com',                        '015231802377',     true, true),
  ('Dominik',   'Leciejewski',  'Dominik.Leciejewski@JFV-Huenstetten.de',    '01634411765',      true, true),
  ('Philip',    'Maurer',       'philip.maurer@jfv-huenstetten.de',           '015126770805',     true, true),
  ('Guiseppe',  'Monaco',       'G.Monaco@t-online.de',                       '01787476521',      true, true),
  ('Basti',     'Paul',         'BastianPaul@gmx.de',                         '01714696390',      true, true),
  ('Sascha',    'Rosowski',     'sascha.rosowski@jfv-huenstetten.de',          '01733014603',      true, true),
  ('Daniel',    'Schröder',     'Daniel.Schroeder@JFV-Huenstetten.de',       '017682076434',     true, true),
  ('Tim',       'Steffens',     'Tim.Steffens@JFV-Huenstetten.de',            NULL,               true, true),
  ('Michelle',  'Tramontana',   'tramo83@yahoo.de',                           '01705260331',      true, true),
  ('Vincenzo',  'Urso',         'enzo@jfv-huenstetten-wuerges.de',            '017623318232',     true, true),
  ('Danny',     'Werning',      'danny_werning@yahoo.de',                     '016090978499',     true, true);

-- Hinweis: Trainer-Zuordnungen (trainer_assignments) zu den jeweiligen
-- Mannschaften müssen über die Admin-Oberfläche (Organisation) erfolgen.
-- Folgende Zuordnungen aus der Trainerliste:
--   Manuel Asvany       → E2-Jugend
--   Holger Bouffier     → G-Jugend
--   Tobias Bruhn        → B-Jugend
--   Basti Buchholz      → E1-Jugend
--   Timo Burggraf       → F-Jugend
--   Oliver Champaert    → E3-Jugend
--   Dennis Duras        → F-Jugend
--   Christian Engelke   → D1-Jugend
--   Peter Enkelmann     → F-Jugend
--   Markus Forbach      → F-Jugend
--   Karsten Größchen    → C-Jugend
--   Stan Günther        → F-Jugend
--   Uli Hanenkamp       → F-Jugend
--   Leonie Höhn         → E2-Jugend
--   Brigitte Jodway     → G-Jugend
--   Lutz Kandler        → G-Jugend
--   Jan Kimpel          → F-Jugend
--   Heiko Köhler        → E3-Jugend
--   Dominik Leciejewski → B-Jugend
--   Philip Maurer       → A-Jugend
--   Guiseppe Monaco     → D2-Jugend
--   Basti Paul          → F-Jugend
--   Sascha Rosowski     → A-Jugend
--   Daniel Schröder     → F-Jugend
--   Tim Steffens        → E1-Jugend
--   Michelle Tramontana → D1-Jugend
--   Vincenzo Urso       → D2-Jugend
--   Danny Werning       → G-Jugend
