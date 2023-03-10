// WEB SERVER
const express = require("express");
const { key } = require("./config.json");
const app = express();
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { existsSync, mkdirSync } = require("fs");
const path = require("path");
const fs = require("fs");

// DB
const dbConnect = require("./src/db/db");
const User = require("./src/db/models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./src/db/auth");

if (!existsSync("./images/")) mkdirSync("./images/");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static("./images"));

app.use(fileUpload());

// randomName() creates a random file name for the image.
function randomName() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let newText = "";
  for (let i = 0; i < 8; i++) {
      newText += characters[Math.floor(Math.random() * characters.length)];
  }
  return newText;
}

dbConnect();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// ----------
// MY WEBPAGE
app.use("/static", express.static(path.join(__dirname, "static")));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});
// ----------

// API
app.post("/upload", (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.headers["authorization"] !== key) return res.status(403).json({
    success: false,
    file: null,
    message: "You are not allowed to perform this action."
  });

  if (!req.files) return res.status(400).json({
    success: false,
    file: null,
    message: "No file was uploaded."
  });

  if (!req.headers["authorization"]) return res.status(401).json({
    success: false,
    file: null,
    message: "Missing authorization header."
  });

  const file = req.files.image;
  const imageName = randomName();
  const ext = require("path").extname(file.name);
  const newPath = `${__dirname}/images/${imageName}${ext}`;

  const properties = {
    name: req.query.name || fs.readdirSync("./images") + ".png",
    tags: req.query.tags.split(","), // need some ideas
    uploaded: Date.now(),
    user: req.query.email
  }

  const jsonString = fs.readFileSync("./data.json");
  let data = JSON.parse(jsonString);
  data.push(properties);
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

  file.mv(newPath, (err) => {
  if (err) {
    console.log(`[ERROR] Failed to upload file: ${imageName}${ext}\n${err}`);
    return res.send({
      success: false,
      error: true,
      file: null,
      message: err
    });
  }

  console.log(`[INFO] Uploaded file: ${imageName}${ext}`);

  return res.json({
    success: true,
    file: `${imageName}${ext}`,
    message: "Done! The file was uploaded."
    });
  });
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, 10)
    .then((hashedPassword) => {
        const user = new User({
          email: req.body.email,
          password: hashedPassword,
        })
        user.save()
          .then((result) => {
            res.status(201).send({
              message: "User created successfully.",
              result: result
            })
          })
          .catch((error) => {
            res.status(500).send({
              message: "Error creating user.",
              error: error
            })
          })
      })
    .catch((error) => {
      res.status(500).send({
        message: "Password was not hashed successfully.",
        error: error
      })
    })
})

app.post("/login", (req, res) => {
  User.findOne({ email: req.body.email })
  .then((user) => {
    bcrypt
      .compare(req.body.password, user.password)
        .then((passwordCheck) => {
          if(!passwordCheck) {
            return res.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          res.status(200).send({
            message: "Login successful.",
            email: user.email,
            token: token,
          });
        })

        .catch((error) => {
          res.status(400).send({
            message: "Incorrect password.",
            error: error,
          });
        });
    })

    .catch((e) => {
      res.status(404).send({
        message: "Email not found.",
        error: e,
      });
    });
})

app.listen(3333, (err) => {
  if (err) throw err;
  console.log("[INFO] Server started on port 3333!");
});

