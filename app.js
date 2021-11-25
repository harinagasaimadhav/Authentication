const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());

let db = null;

//initialize database and server
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: '${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//user registration
app.post(`/register`, async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectedUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectedUserQuery);

  if (dbUser == undefined) {
    if (`${password}`.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
                user (username, name, password, gender, location)
            VALUES 
                ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password
app.put(`/change-password`, async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);

  if (isPasswordMatched) {
    if (`${newPassword}`.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `
            UPDATE user 
            SET password = '${hashedNewPassword}'
            WHERE username = '${username}' ;`;
      await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
