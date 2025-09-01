CREATE DATABASE IF NOT EXISTS db;

CREATE TABLE IF NOT EXISTS creds (
    username VARCHAR(50),
    password VARCHAR(255)
);

INSERT INTO creds (username, password) VALUES
    ('admin', 'Balls69Password!'),
    ('TGM', 'TGMisVeryBalls!');

CREATE TABLE IF NOT EXISTS products (
    name VARCHAR(100),
    price DECIMAL(10, 2),
    image_url VARCHAR(255)
);

INSERT INTO products (name, price, image_url) VALUES
    ('Speedy Potion', '12.09', 'img/chug.jpg'),
    ('Funny Potion', '22.05', 'img/chug.jpg'),
    ('Giga Potion', '8.99', 'img/chug.jpg');
