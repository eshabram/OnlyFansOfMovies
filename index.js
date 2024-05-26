const express = require('express');
const ejs = require('ejs')
const mysql = require('mysql')
const bcrypt = require('bcrypt')
const session = require('express-session')
const app = express();
const pool = dbConnection();
const port = 3000;
const saltRounds = 10;
//made this global to get the userID
app.set("view engine", "ejs");
app.use(express.static("public"));
let apiKey = "143819ab";

//for session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
//we need this method for POST method
app.use(express.urlencoded({ extended: true }));

app.get("/", isFanAuthenticated, (req, res) => {
    res.render("login");
});

app.get("/home", isFanAuthenticated, (req, res) => {
    res.render("home");
});

app.get("/about", isFanAuthenticated, (req, res) => {
    res.render("about");
});

app.get("/browse", isFanAuthenticated, (req, res) => {
    res.render("browse");
});

app.get("/searchMovies", isFanAuthenticated, async (req, res) => {
    // API is Open Movie Database 
    let movieTitle = req.query.movieTitle; 
    let url = `http://www.omdbapi.com/?apikey=${apiKey}&t=${movieTitle}`;
    let response = await fetch(url);
    let movieData = await response.json();
     const length = Object.keys(movieData).length;
    if(length > 3){
    res.render("browse", {"movie" : movieData});
    }else{
      
    res.render("browse", {error:"Undefined movie name: Please enter a valid movie name"});
    }
});

// route for handling user ratings
app.get("/rating", isFanAuthenticated, async (req, res) => {
    // first add movie to the db. We do it here because we only want to have movies in the db that we have rated
    let title = req.query.movieTitle;
    let year = req.query.movieYear;
    let genre = req.query.movieGenre;
    let director = req.query.movieDirector;
    let plot = req.query.moviePlot;
    let poster = req.query.moviePoster;
    let movieSql = `INSERT IGNORE INTO movies (title, year, genre, director, description, poster) 
    VALUES (?, ?, ?, ?, ?, ?);`
    let movieParams = [title, year, genre, director, plot, poster]
    let movieRows = await executeSQL(movieSql, movieParams);

    // get the movieID
    let idSql = `SELECT movieID FROM movies WHERE title = ?;`
    let idParams = [title]
    let idRows = await executeSQL(idSql, idParams)

    // now we can add the rating
    if (idRows && idRows.length > 0) {
        let recommended = false;
        let movieID = idRows[0].movieID;
        let rating = req.query.stars;
        let userID = req.session.userID;
        let review = req.query.review;
        let checkbox = req.query.recommended
        if (checkbox == "on") {
          recommended = true;
        } 
        let ratingSQL = `INSERT INTO ratings (userID, movieID, rating, reviewDescription, recommend)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE rating = VALUES(rating), reviewDescription = VALUES(reviewDescription), recommend = VALUES(recommend);`
        let ratingParam = [userID, movieID, rating, review, recommended];
        let ratingrows = await executeSQL(ratingSQL, ratingParam)
        res.render("rating");
    } else {
        res.render("browse");
    }
});

// route for displaying user reviews
app.get("/mylists", isFanAuthenticated, async(req, res) => {
		let sql = `select * from ratings r
								join movies m on r.movieID = m.movieID
								where userID = ?`;

		let list = await executeSQL(sql, [req.session.userID]);

		res.render("mylists", {listData: list});
});

app.get("/login", (req, res) => {
    res.render("login");
});

//getting login credentials from database to verify
app.get("/loginCredentials", async (req, res) => {
    let defaultPassword = "defaultPassword";
    let defaultHashedPassword = "defaultHashedPassword";
   let username = req.query.username;
    // set the session username so we can identify later
    // req.session.username = username;
    let password = req.query.password;
    let hashedPassword = "";
    let sql = `SELECT * FROM users
                WHERE username=?`;
    
    let rows = await executeSQL(sql, [username]);
	
	   req.session.userID = rows[0].userID;
			
    if(rows.length > 0){
      //username was found
      hashedPassword = rows[0].password;
    }
	
    let match = await bcrypt.compare(password, hashedPassword);

    if (match) {
      req.session.authenticated = true;
      res.render("home");
    } else {
      res.render("login.ejs", { error: "Wrong credentials!" });
    }
});

// update rating route
app.get("/updateRating", isFanAuthenticated, async (req, res) => {
	let id = req.query.ratingID;
	let sql = `SELECT * 
              FROM ratings r
							JOIN movies m on r.movieID = m.movieID
							WHERE ratingID = ?`;
	let rows = await executeSQL(sql, [id]);
	
	res.render("updateRating", { ratingInfo: rows[0] });
});

// update ratings
app.post("/updateRating", isFanAuthenticated, async (req, res) => {
  let recommend = false
	let ratingID = req.body.ratingID;
	let rating = req.body.rating;
	let reviewDesc = req.body.reviewDescription;
  let checkbox = req.body.recommend
  if (checkbox == "on") {
    recommend = true;
  }
	let sql = `UPDATE ratings 
              SET reviewDescription = ?, rating = ?, recommend = ?                
              WHERE ratingID = ?`;

  params = [reviewDesc, rating, recommend, ratingID]
	let rows = await executeSQL(sql, params);

	let ratingSql = `SELECT * 
                    FROM ratings r
							      JOIN movies m on r.movieID = m.movieID
							      WHERE userID = ?`;

	let listData = await executeSQL(ratingSql, [req.session.userID]);
  
	res.redirect("mylists");
});

//LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("login");
});

//rendering signup page
app.get("/signUp", (req, res) =>{
    res.render("signup");
});

//inserting credentials to database
app.get("/signupCredentials", async (req, res) =>{
  let username = req.query.username;
  let password = req.query.password;

  let query = `SELECT * FROM users
              WHERE username=?`;

  let user = await executeSQL(query, [username]);

  if(user.length > 0){
    res.render("signup.ejs", { error: "Username already exists please use a different one" });
  }else{
  res.render("accountCreation",{"username":username,"password":password})
  }
});

  app.post("/signupCredentials", async (req, res) =>{
    
    let username = req.body.username;
    let password = req.body.password;
    
  bcrypt.hash(password, saltRounds, async function(err, hash) {
      
     let sql = `INSERT INTO 
                  users(username, password)
                  VALUES(?,?);`;
     let params = [username, hash];
    let rows = await executeSQL(sql, params);
    res.render("login");
  });
});


//functions
async function executeSQL(sql, params) {
	return new Promise(function (resolve, reject) {
		pool.query(sql, params, function (err, rows, fields) {
			if (err) throw err;
			resolve(rows);
		});
	});
} //executeSQL

function dbConnection() {
	const pool = mysql.createPool({
		connectionLimit: 10,
		host: "xefi550t7t6tjn36.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
		user: "jouhdxvg6l3pzbqt",
		password: "gtv0wf7qlalo876s",
		database: "l6t7qj1udtm7dl37",
	});

	return pool;
} //dbConnection

//CHECKING AUTHENTICATION
function isFanAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    // go ahead and keep processing request
    next();
  } else {
    res.render("login.ejs");
  }
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});