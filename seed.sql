-- Diocese
INSERT INTO diocese (name, bishop_name, created_at) VALUES ('Diocese of Koforidua', 'Most Rev. Dr. Samuel Osei Akrofi', datetime('now'));

-- Deaneries
INSERT INTO deaneries (name, diocese_id, dean_name, created_at) VALUES ('Suhum Deanery', 1, 'Rev. Fr. Emmanuel Mensah', datetime('now'));
INSERT INTO deaneries (name, diocese_id, dean_name, created_at) VALUES ('Nsawotafo Deanery', 1, 'Rev. Fr. Joseph Kwaku Boateng', datetime('now'));
INSERT INTO deaneries (name, diocese_id, dean_name, created_at) VALUES ('Koforidua Central Deanery', 1, 'Rev. Fr. Peter Yaw Oppong', datetime('now'));
INSERT INTO deaneries (name, diocese_id, dean_name, created_at) VALUES ('Akwapim Deanery', 1, 'Rev. Fr. Francis Kofi Acheampong', datetime('now'));
INSERT INTO deaneries (name, diocese_id, dean_name, created_at) VALUES ('Akuapim South Deanery', 1, 'Rev. Fr. Thomas Mensah', datetime('now'));

-- Parishes (4 per deanery)
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Joseph''s Parish Suhum', 1, 'Rev. Fr. Suhum Ato', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Mary''s Parish Suhum', 1, 'Rev. Fr. Suhum Kofi', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Augustine''s Parish Suhum', 1, 'Rev. Fr. Suhum Mensah', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Theresa''s Parish Suhum', 1, 'Rev. Fr. Suhum Adjei', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Joseph''s Parish Nsawotafo', 2, 'Rev. Fr. Nsawotafo Ato', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Mary''s Parish Nsawotafo', 2, 'Rev. Fr. Nsawotafo Kofi', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Augustine''s Parish Nsawotafo', 2, 'Rev. Fr. Nsawotafo Mensah', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Theresa''s Parish Nsawotafo', 2, 'Rev. Fr. Nsawotafo Adjei', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Joseph''s Parish Koforidua', 3, 'Rev. Fr. Koforidua Ato', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Mary''s Parish Koforidua', 3, 'Rev. Fr. Koforidua Kofi', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Augustine''s Parish Koforidua', 3, 'Rev. Fr. Koforidua Mensah', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Theresa''s Parish Koforidua', 3, 'Rev. Fr. Koforidua Adjei', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Joseph''s Parish Akwapim', 4, 'Rev. Fr. Akwapim Ato', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Mary''s Parish Akwapim', 4, 'Rev. Fr. Akwapim Kofi', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Augustine''s Parish Akwapim', 4, 'Rev. Fr. Akwapim Mensah', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Theresa''s Parish Akwapim', 4, 'Rev. Fr. Akwapim Adjei', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Joseph''s Parish Akuapim', 5, 'Rev. Fr. Akuapim Ato', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Mary''s Parish Akuapim', 5, 'Rev. Fr. Akuapim Kofi', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Augustine''s Parish Akuapim', 5, 'Rev. Fr. Akuapim Mensah', datetime('now'));
INSERT INTO parishes (name, deanery_id, priest_name, created_at) VALUES ('St. Theresa''s Parish Akuapim', 5, 'Rev. Fr. Akuapim Adjei', datetime('now'));

-- Users (5 roles)
INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, parish_id, is_active)
VALUES ('usr-admin-001', 'ICT Administrator', 'admin@dyckoforidua.org', 1, datetime('now'), datetime('now'), 'system_admin', '+233244123456', 1, 1);

INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, is_active)
VALUES ('usr-chaplain-001', 'Fr. Emmanuel Asamoah', 'chaplain@dyckoforidua.org', 1, datetime('now'), datetime('now'), 'diocesan_youth_chaplain', '+233244234567', 1);

INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, parish_id, is_active)
VALUES ('usr-exec-001', 'Kojo Mensah', 'chairman@dyckoforidua.org', 1, datetime('now'), datetime('now'), 'dyc_executive', '+233244345678', 1, 1);

INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, parish_id, is_active)
VALUES ('usr-coord-001', 'Kwame Antwi', 'coordinator@dyckoforidua.org', 1, datetime('now'), datetime('now'), 'coordinator', '+233244456789', 1, 1);

INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, parish_id, is_active)
VALUES ('usr-member-001', 'Ama Mensah', 'member@dyckoforidua.org', 1, datetime('now'), datetime('now'), 'member', '+233244567890', 2, 1);

-- Accounts (Better Auth credential accounts)
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc-admin-001', 'usr-admin-001', 'credential', 'usr-admin-001', 'pbkdf2:100000:J6GfqKqGo6RsrQd8HonNOA==:iyiWxeLkcppJanK7pViEOcihIPREVS66FIeX3uezYK8=', unixepoch(), unixepoch());

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc-chaplain-001', 'usr-chaplain-001', 'credential', 'usr-chaplain-001', 'pbkdf2:100000:qi96g6EqNIc6iXYtv/g/YA==:seKP47VP5pOJ/VzfoT51SpHsd8UimMBXR1GtXi8w3ps=', unixepoch(), unixepoch());

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc-exec-001', 'usr-exec-001', 'credential', 'usr-exec-001', 'pbkdf2:100000:qi96g6EqNIc6iXYtv/g/YA==:seKP47VP5pOJ/VzfoT51SpHsd8UimMBXR1GtXi8w3ps=', unixepoch(), unixepoch());

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc-coord-001', 'usr-coord-001', 'credential', 'usr-coord-001', 'pbkdf2:100000:qi96g6EqNIc6iXYtv/g/YA==:seKP47VP5pOJ/VzfoT51SpHsd8UimMBXR1GtXi8w3ps=', unixepoch(), unixepoch());

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc-member-001', 'usr-member-001', 'credential', 'usr-member-001', 'pbkdf2:100000:qi96g6EqNIc6iXYtv/g/YA==:seKP47VP5pOJ/VzfoT51SpHsd8UimMBXR1GtXi8w3ps=', unixepoch(), unixepoch());

-- News articles (published, with slugs)
INSERT INTO news (title, slug, body, scope, is_featured, status, published_at, author_id, created_at, updated_at)
VALUES ('Diocesan Youth Congress 2026: A Gathering of Faith and Fellowship', 'diocesan-youth-congress-2026',
'Preparations are underway for the biggest youth gathering of the year. All parishes across the five deaneries are encouraged to participate in this celebration of our Catholic youth identity. The congress will feature keynote speakers, workshops on faith and leadership, and opportunities for fellowship among young people from across the diocese. Registration opens soon — watch this space for updates.',
'diocese', 1, 'published', datetime('now'), 'usr-exec-001', datetime('now'), datetime('now'));

INSERT INTO news (title, slug, body, scope, is_featured, status, published_at, author_id, created_at, updated_at)
VALUES ('Lenten Retreat Series Begins This Weekend', 'lenten-retreat-series-2026',
'Join us for a series of spiritual retreats throughout the Lenten season at various parishes across the diocese. This year''s theme focuses on prayer, fasting, and almsgiving as pillars of our Lenten journey. Each retreat will feature guided meditations, Eucharistic adoration, and the Sacrament of Reconciliation. Contact your parish coordinator for the schedule in your deanery.',
'diocese', 0, 'published', datetime('now'), 'usr-chaplain-001', datetime('now'), datetime('now'));

INSERT INTO news (title, slug, body, scope, is_featured, status, published_at, author_id, created_at, updated_at)
VALUES ('DYC Executive Council Meeting Highlights', 'dyc-executive-meeting-february-2026',
'Key decisions from the February meeting including programme approvals and upcoming event planning. The Executive Council approved the annual budget, reviewed pastoral programme submissions from 12 parishes, and finalized plans for the Youth Day celebration in June. A new subcommittee on digital evangelization was also formed.',
'diocese', 0, 'published', datetime('now'), 'usr-exec-001', datetime('now'), datetime('now'));

INSERT INTO news (title, slug, body, scope, is_featured, status, published_at, author_id, created_at, updated_at)
VALUES ('New Portal Launch Announcement', 'new-portal-launch',
'We are excited to announce the launch of our new digital platform for the Diocese of Koforidua. The DYC Koforidua Portal will serve as the central hub for all youth activities, events, news, and communications within our diocese. Members can register for events, access documents, and stay connected with their parish community.',
'diocese', 0, 'published', datetime('now'), 'usr-admin-001', datetime('now'), datetime('now'));

INSERT INTO news (title, slug, body, scope, is_featured, status, published_at, author_id, created_at, updated_at)
VALUES ('Youth Leadership Training Workshop', 'youth-leadership-training-2026',
'Applications now open for the annual leadership development programme for parish youth coordinators. The two-day workshop will cover topics including servant leadership, project management, public speaking, and spiritual formation. Spaces are limited to 50 participants. Apply through your deanery coordinator by March 30, 2026.',
'diocese', 0, 'published', datetime('now'), 'usr-exec-001', datetime('now'), datetime('now'));

INSERT INTO news (title, slug, body, scope, is_featured, status, published_at, author_id, created_at, updated_at)
VALUES ('Pastoral Programme Submissions Due March 31', 'pastoral-programme-deadline-2026',
'Reminder to all parish coordinators: pastoral programme submissions for 2026 are due by March 31. Each parish is required to submit their planned activities for the year, including spiritual formation events, community outreach programmes, and youth engagement initiatives. Late submissions will delay the approval process.',
'diocese', 0, 'published', datetime('now'), 'usr-coord-001', datetime('now'), datetime('now'));

-- News submissions
INSERT INTO news_submissions (submitter_name, submitter_email, submitter_phone, title, body, status, created_at)
VALUES ('Grace Owusu', 'grace.owusu@email.com', '+233201234567',
'St. Peter''s Parish Youth Group Organizes Community Cleanup',
'The youth group of St. Peter''s Parish in Suhum organized a successful community cleanup exercise last Saturday. Over 30 young people participated, cleaning streets and drainage channels around the parish and the local market area.',
'pending', datetime('now'));

INSERT INTO news_submissions (submitter_name, submitter_email, title, body, status, created_at)
VALUES ('Samuel Addo', 'samuel.addo@email.com',
'Bible Quiz Competition Results',
'Congratulations to St. Augustine''s Parish Koforidua for winning the inter-parish Bible Quiz Competition held on February 15. Teams from 8 parishes participated in the event which tested knowledge of the Gospel of Matthew.',
'approved', datetime('now'));

INSERT INTO news_submissions (submitter_name, submitter_phone, title, body, status, created_at)
VALUES ('Akosua Bempong', '+233209876543',
'Request for Youth Camp',
'I would like to request that the DYC organizes a youth camp during the Easter holidays. Many of us would benefit from a few days of spiritual retreat and fellowship.',
'rejected', datetime('now'));

-- Pastoral letters (documents)
INSERT INTO documents (title, category, scope, file_url, file_name, file_size, mime_type, issuing_authority, date_issued, uploaded_by, created_at)
VALUES ('Lenten Pastoral Letter 2026', 'pastoral_letter', 'diocese', '/documents/lenten-letter-2026.pdf', 'lenten-letter-2026.pdf', 245000, 'application/pdf', 'Most Rev. Dr. Samuel Osei Akrofi', '2026-02-14', 'usr-chaplain-001', datetime('now'));

INSERT INTO documents (title, category, scope, file_url, file_name, file_size, mime_type, issuing_authority, date_issued, uploaded_by, created_at)
VALUES ('DYC Constitution and Guidelines (Revised 2025)', 'pastoral_letter', 'diocese', '/documents/dyc-constitution-2025.pdf', 'dyc-constitution-2025.pdf', 1250000, 'application/pdf', 'DYC Executive Council', '2025-12-01', 'usr-exec-001', datetime('now'));

INSERT INTO documents (title, category, scope, file_url, file_name, file_size, mime_type, issuing_authority, date_issued, uploaded_by, created_at)
VALUES ('Circular: Youth Day Celebration 2026', 'pastoral_letter', 'diocese', '/documents/circular-youth-day-2026.pdf', 'circular-youth-day-2026.pdf', 180000, 'application/pdf', 'DYC General Secretary', '2026-03-01', 'usr-exec-001', datetime('now'));

-- Events
INSERT INTO events (title, description, event_type, scope, start_at, end_at, venue, status, registration_type, fee_amount, contact_name, contact_phone, author_id, created_at, updated_at)
VALUES ('Diocesan Youth Day 2026', 'Celebrating our faith and youth presence in the Diocese. A day of praise, worship, talks, and fellowship for all Catholic youth.', 'rally', 'diocese', '2026-06-15 09:00:00', '2026-06-15 17:00:00', 'St. Joseph''s Cathedral, Koforidua', 'published', 'free', NULL, 'Kojo Mensah', '+233244345678', 'usr-exec-001', datetime('now'), datetime('now'));

INSERT INTO events (title, description, event_type, scope, start_at, end_at, venue, status, registration_type, fee_amount, contact_name, contact_phone, author_id, created_at, updated_at)
VALUES ('Youth Retreat: Finding Peace in Christ', 'A day of reflection and spiritual renewal for all youth.', 'retreat', 'deanery', '2026-05-20 08:00:00', '2026-05-20 18:00:00', 'St. Augustine''s Parish Hall, Koforidua', 'published', 'paid', 50.00, 'Fr. Emmanuel Asamoah', '+233244234567', 'usr-chaplain-001', datetime('now'), datetime('now'));

INSERT INTO events (title, description, event_type, scope, start_at, end_at, venue, status, registration_type, fee_amount, contact_name, contact_phone, author_id, created_at, updated_at)
VALUES ('Monthly Youth Mass — April', 'Monthly gathering for youth mass and fellowship.', 'mass', 'diocese', '2026-04-05 10:00:00', '2026-04-05 12:00:00', 'All Parishes', 'published', 'free', NULL, NULL, NULL, 'usr-coord-001', datetime('now'), datetime('now'));

INSERT INTO events (title, description, event_type, scope, start_at, end_at, venue, status, registration_type, fee_amount, contact_name, contact_phone, author_id, created_at, updated_at)
VALUES ('DYC Executive Meeting — May', 'Regular executive council meeting.', 'meeting', 'diocese', '2026-05-10 10:00:00', '2026-05-10 13:00:00', 'Diocesan Center, Koforidua', 'published', 'free', NULL, 'Yaw Boateng', '+233244567890', 'usr-exec-001', datetime('now'), datetime('now'));

INSERT INTO events (title, description, event_type, scope, start_at, end_at, venue, status, registration_type, fee_amount, contact_name, contact_phone, author_id, created_at, updated_at)
VALUES ('Youth Leadership Workshop', 'Two-day intensive leadership programme for parish youth coordinators.', 'other', 'diocese', '2026-07-12 08:00:00', '2026-07-13 17:00:00', 'Holy Family Conference Hall, Koforidua', 'published', 'paid', 30.00, 'Akua Afriyie', '+233244678901', 'usr-exec-001', datetime('now'), datetime('now'));

-- DYC Executive
INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current, created_at) VALUES ('Kojo Mensah', 'Chairman', 'chairman@dyckoforidua.org', '+233244345678', '2026-2028', 1, datetime('now'));
INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current, created_at) VALUES ('Abena Serwaa', 'Vice Chairperson', 'vice@dyckoforidua.org', '+233244456789', '2026-2028', 1, datetime('now'));
INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current, created_at) VALUES ('Yaw Boateng', 'General Secretary', 'secretary@dyckoforidua.org', '+233244567890', '2026-2028', 1, datetime('now'));
INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current, created_at) VALUES ('Akua Afriyie', 'Organizing Secretary', 'org@dyckoforidua.org', '+233244678901', '2026-2028', 1, datetime('now'));
INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current, created_at) VALUES ('Kwame Osei', 'Treasurer', 'treasurer@dyckoforidua.org', '+233244789012', '2026-2028', 1, datetime('now'));
INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current, created_at) VALUES ('Efua Mansa', 'PRO', 'pro@dyckoforidua.org', '+233244890123', '2026-2028', 1, datetime('now'));
