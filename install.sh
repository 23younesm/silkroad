# Update and upgrade system packages
sudo apt update && sudo apt upgrade -y

# Install MySQL
sudo apt install mysql-server -y

sudo systemctl start mysql && sudo systemctl enable mysql

sudo mysql -u root -p -e "
    CREATE DATABASE db;

    CREATE USER 'sqluser'@'localhost' IDENTIFIED BY 'password';
    GRANT ALL PRIVILEGES ON db.* TO 'sqluser'@'localhost';
    FLUSH PRIVILEGES;

    USE db;

    CREATE TABLE creds (
        username VARCHAR(50),
        password VARCHAR(255)
    );

    INSERT INTO creds (username, password)
    VALUES
        ('admin', 'Balls69Password!'),
        ('TGM', 'TGMisVeryBalls!');

    CREATE TABLE products (
        name VARCHAR(100),
        price DECIMAL(10, 2),
        image_url VARCHAR(255)
    );

    INSERT INTO products (name, price, image_url)
    VALUES
        ('Speedy Potion', '12.09', 'img/chug.jpg'),
        ('Funny Potion', '22.05', 'img/chug.jpg'),
        ('Giga Potion', '8.99', 'img/chug.jpg');
    "

sudo mysql -u sqluser -p password -e "
ALTER USER 'root'@'localhost' IDENTIFIED BY 'YouWillNotGuessThis';
FLUSH PRIVILEGES;
"

# Install Git
git clone https://github.com/23younesm/silkroad.git

cd silkroad

# Install Node.js and npm
sudo apt install nodejs npm -y

# Install required Node.js dependencies
npm install
npm install express mysql2 cors fs path multer body-parser express-session

# Start your Node.js app
node server/server.js
