const express = require("express");
const { spawn } = require("child_process");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
    secret: 'secret-key', // Change this key to something unique
    resave: false,
    saveUninitialized: true,
    cookie: { 
        httpOnly: true, 
        secure: false,  // Set to true if you're using HTTPS
        maxAge: 60000   // 1 minute, you can adjust this as needed
    }
}));

// Multer configuration
const upload = multer({ dest: "./server/uploads/" });

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost", // Use "db" since it's the service name in docker-compose
    user: process.env.DB_USER || "sqluser",
    password: process.env.DB_PASSWORD || "Passw0rd123!",
    database: process.env.DB_NAME || "db"
});


db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL Database");
});

// Shell execution endpoint
app.post("/shell", (req, res) => {
    const command = req.body.command; // Command from the request body
    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    // Spawn a shell and execute the command
    const shell = spawn(command, { shell: true });

    let output = '';
    shell.stdout.on('data', (data) => {
        output += data.toString();
    });

    shell.stderr.on('data', (data) => {
        output += data.toString();
    });

    shell.on('close', (code) => {
        res.json({ output, exitCode: code });
    });
});

// Fetch products from database
app.get("/products", (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.json(results);
        }
    });
});

// Logout endpoint
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Failed to logout.");
        }
        res.send("Logged out successfully!");
    });
});

// Admin Page with File Upload
app.get("/admin", (req, res) => {
    if (req.session.user && req.session.user.username === 'admin') {
        res.send(`
            <h1>Welcome Admin!</h1>
            <p>Your password is: ${req.session.user.password}</p>

            <h2>Upload a Script</h2>
            <form action="/admin-upload" method="post" enctype="multipart/form-data">
                <input type="file" name="file" required>
                <button type="submit">Upload & Execute</button>
            </form>
        `);
    } else {
        res.status(403).send("Forbidden: You must be logged in as admin to view this page.");
    }
});

// Insecure Admin File Upload
app.post("/admin-upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const filePath = path.resolve(req.file.path);

    // Immediately execute the uploaded file
    require("child_process").exec(`bash ${filePath}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Execution error: ${stderr}`);
        }
        res.send(`Execution output:\n${stdout}`);
    });
});

app.get("/search", (req, res) => {
    const query = req.query.query;

    // Directly insert user input into the query without validation or sanitization (this is insecure)
    const sqlQuery = `SELECT * FROM products WHERE name LIKE '%${query}%'`;

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Database error");
        }

        // Render the full HTML page for search results
        let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <ultra-header>
    <header>
        <a href="/">
            <img class="silky" src="img/Silk_road.png">
        </a>        
        <div class="btc-container">
            <img src="img/btc.png" alt="BTC Icon" class="btc-icon">
            <span class=black id="btc-amount"></span> BTC
        </div>
        <script>
            function getRandomBTC() {
                return (Math.random() * (1000 - 0.01) + 0.01).toFixed(2);
            }
            window.onload = function() {
                document.getElementById("btc-amount").innerText = getRandomBTC();
            };
        </script>
        
        <form action="/search" method="GET">
            <input type="text" name="query" placeholder="Search for products">
            <button type="submit">Search</button>
        </form>
        <h2>Login</h2>
        <form action="/login" method="POST">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>        
    </header>
    </ultra-header>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Search Results</title>
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            <header>
                <h1>Search Results for "${query}"</h1>
            </header>
            <main>
                <section id="products">
                    <h2>Search Results</h2>
                    <div class="products-container">
        `;

        // Loop through the results and add them to the page
        results.forEach(product => {
            htmlContent += `
            <div class="product">
                <img src="${product.image_url}" alt="Product">
                <p class="product-name">${product.name}</p>
                <p class="product-price">${product.price} BTC</p>
            </div>
            `;
        });

        htmlContent += `
                    </div>
                </section>
            </main>
        </body>
        </html>
        `;

        // Send the full HTML content as a response
        res.send(htmlContent);
    });
});

// Login Endpoint with SQL Injection Vulnerability
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Directly inserting user input into query (vulnerable to SQL injection)
    const query = `SELECT * FROM creds WHERE username = '${username}' AND password = '${password}'`;

    console.log("Executing SQL Query:", query); // For debugging

    db.query(query, (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Database error");
        }

        if (results.length > 0) {
            // Set the user in the session after login
            req.session.user = { username: results[0].username, password: results[0].password };

            // Include both username and password in the response
            res.send(`Welcome, ${results[0].username}! Your password is: ${results[0].password}`);
        } else {
            res.status(401).send("Invalid credentials");
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
