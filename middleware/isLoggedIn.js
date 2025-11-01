import jwt from "jsonwebtoken"

function isLoggedIn(req,res,next){
    if(req.cookies.token === "") res.redirect("/login")
    else{
     let data = jwt.verify(req.cookies.token, "shhhh")
     req.user = data
     next()
    }
}

export {isLoggedIn}