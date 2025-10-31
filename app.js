import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { User } from './models/user.model.js';
import { Post } from './models/post.model.js';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.render("index");
});

app.get('/profile', isLoggedIn, (req, res) => {
  console.log(req.user);
  res.render("login")
  
});

app.get('/login',  (req, res) => {
  res.render("login");
});

app.get('/logout', (req, res) => {
  res.cookie("token", "")
  res.redirect("/login")
});

app.post('/register', async (req, res) => {
  try {
    const { email, name, userName, password, age } = req.body;

    // ✅ check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already registered");
    }

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ create new user
    const user = await User.create({
      userName,
      name,
      password: hashedPassword,
      email,
      age
    });

    // ✅ generate token
    const token = jwt.sign(
      { email: user.email, user_id: user._id },
      "shhhh",
      { expiresIn: "7d" }
    );

    // ✅ send token as cookie
    res.cookie("token", token, { httpOnly: true });
    res.send("✅ User Registered Successfully");

  } catch (err) {
    console.error("❌ Error in /create route:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ check if user is not login
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).send("❌ Something went wrong");
    }

    bcrypt.compare(password, existingUser.password, function(err, result){
        if(result){
            const token = jwt.sign(
                { email: existingUser.email, user_id: existingUser._id },
                "shhhh",
                { expiresIn: "7d" }
            );
            
            // ✅ send token as cookie
            res.cookie("token", token, { httpOnly: true });
            res.status(200).send("✅ You are now Logged In")
        } 
            else res.redirect("/login")
    })




  } catch (err) {
    console.error("❌ Error in /create route:", err);
    res.status(500).send("Internal Server Error");
  }
});

function isLoggedIn(req,res,next){
    if(req.cookies.token === "") res.send("You must be logged in")
    else{
     let data = jwt.verify(req.cookies.token, "shhhh")
     req.user = data
     next()
    }
}

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});
