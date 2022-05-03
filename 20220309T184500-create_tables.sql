PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS last_seen;
DROP TABLE IF EXISTS reply;
DROP TABLE IF EXISTS message;
DROP TABLE IF EXISTS channel;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE channel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_name TEXT NOT NULL
);

CREATE TABLE message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY(channel_id) REFERENCES channel(id),
    FOREIGN KEY(author_id) REFERENCES user(id) 
);

CREATE TABLE reply (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY(message_id) REFERENCES message(id),
    FOREIGN KEY(author_id) REFERENCES user(id)
);

CREATE TABLE last_seen (
    user_id INTEGER NOT NULL,
    channel_id INTEGER NOT NULL,
    last_message_id INTEGER NOT NULL,
    PRIMARY KEY(user_id, channel_id),
    FOREIGN KEY(channel_id) REFERENCES channel(id),
    FOREIGN KEY(user_id) REFERENCES user(id),
    FOREIGN KEY(last_message_id) REFERENCES message(id)
);


