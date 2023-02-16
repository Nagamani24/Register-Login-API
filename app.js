const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever is starting at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDbAndServer();

// Register API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * 
                            FROM user
                            WHERE username = '${username}';`;
  const selectedUser = await db.get(selectUserQuery);

  if (selectedUser != undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const createNewUserQuery = `INSERT INTO user(username,name,password,gender,location)
                                  VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')
                                  `;
    const newUser = await db.run(createNewUserQuery);
    response.status(200);
    response.send("User created successfully");
  }
});

//Login API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT *
                            FROM user
                            WHERE username = '${username}';`;
  const checkUser = await db.get(checkUserQuery);

  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Change Password API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  const userQuery = `SELECT *
                    FROM user
                    WHERE username = '${username}';`;

  const userDetails = await db.get(userQuery);
  const isOldPasswordMatched = await bcrypt.compare(
    oldPassword,
    userDetails.password
  );
  if (isOldPasswordMatched != true) {
    response.status(400);
    response.send("Invalid current password");
  } else if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const updatePasswordQuery = `UPDATE user
                                SET password = '${newHashedPassword}'
                                WHERE username = '${username}';`;
    const updatePassword = await db.run(updatePasswordQuery);
    response.status(200);
    response.send("Password updated");
  }
});

module.exports = app;
