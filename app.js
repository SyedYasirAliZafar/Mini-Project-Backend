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

app.get('/profile', isLoggedIn, async (req, res) => {
   let user =  await User.findOne({email: req.user.email}).populate("posts")
  res.render("profile", {user})
});

app.get('/like/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    const userId = req.user.user_id.toString();

    // Convert ObjectIds to strings before checking
    const likedIndex = post.likes.findIndex(id => id.toString() === userId);

    if (likedIndex === -1) {
      post.likes.push(userId); // Add like
    } else {
      post.likes.splice(likedIndex, 1); // Remove like
    }

    await post.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("❌ Error in /like route:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get('/edit/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    // Only allow editing own posts
    if (post.user.toString() !== req.user.user_id.toString()) {
      return res.status(403).send("Not authorized to edit this post");
    }

    res.render("edit", { post }); // pass post to the EJS page

  } catch (error) {
    console.error("❌ Error in /edit route:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/delete/:id', isLoggedIn, async (req, res) => {
  try {
    // 1️⃣ Find the post first
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    // 3️⃣ Remove post ID from user's 'posts' array
    await User.findByIdAndUpdate(post.user, { $pull: { posts: post._id } });

    // 4️⃣ Delete the post document itself
    await Post.findByIdAndDelete(req.params.id);

    // 5️⃣ Redirect to profile page
    res.redirect("/profile");

  } catch (error) {
    console.error("❌ Error in /delete route:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/edit/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (post.user.toString() !== req.user.user_id.toString()) {
      return res.status(403).send("Not authorized to edit this post");
    }

    post.content = req.body.content;
    await post.save();

    res.redirect("/profile");
  } catch (error) {
    console.error("❌ Error in /edit POST route:", error);
    res.status(500).send("Internal Server Error");
  }
});





app.post('/post', isLoggedIn, async (req, res) => {
   let user =  await User.findOne({email: req.user.email})
   let {content} =  req.body
   let post = await Post.create({
    user: user._id,
    content
  })

  user.posts.push(post._id)
   await user.save()
   res.redirect("/profile")
  
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

    
    res.redirect("/login");

  } catch (err) {
    console.error("❌ Error in /register route:", err);
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
            res.redirect("/profile")
        } 
            else res.redirect("/login")
    })




  } catch (err) {
    console.error("❌ Error in /create route:", err);
    res.status(500).send("Internal Server Error");
  }
});

function isLoggedIn(req,res,next){
    if(req.cookies.token === "") res.redirect("/login")
    else{
     let data = jwt.verify(req.cookies.token, "shhhh")
     req.user = data
     next()
    }
}

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});
