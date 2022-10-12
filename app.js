require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')

const app = express()

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
app.set('view engine','ejs')
app.use(session({
    secret : "Our Little Secret",
    resave : false,
    saveUninitialized : false
}))
app.use(passport.initialize())
app.use(passport.session())


mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser : true})

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    secret : String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User",userSchema)

passport.use(User.createStrategy())

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:745/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user)
    })
  }
))



app.get('/',function(req,res){
    res.render('home')
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }
))

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets')
})

app.get('/register',function(req,res){
    res.render('register')
})

app.get('/login',function(req,res){
    res.render('login')
})

app.get('/logout',function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err)
        }
        res.redirect('/')
    })
})

app.get('/secrets',function(req,res){
    User.find({'secrets' : {$ne : null}}, function(err,foundUsers){
        if(err){
            console.log(err)
        }
        else{
            if(foundUsers){
                res.render("secrets",{usersWithSecrets : foundUsers})
            }
        }
    })
})

app.get('/submit',function(req,res){
    if(req.isAuthenticated()){
        res.render('submit')
    }
    else{
        res.redirect('/login')
    }
})

app.post('/submit',function(req,res){
    const SubmittedSecret = req.body.secret
    // console.log(req.user.id)
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err)
        }
        else{
            if(foundUser){
                foundUser.secret = SubmittedSecret
                foundUser.save(function(){
                    res.redirect('/secrets')
                })
            }
        }
    })

})



app.post('/register',function(req,res){
    User.register({username : req.body.username,},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.render('/register')
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets')
            })
        }
    })
})

app.post('/login',function(req,res){
    const user = new User({
        username : req.body.username,
        password : req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err)
        }
        else{
            passport.authenticate('local')(req,res,function(){
                res.redirect('/secrets')
            })
        }
    })

})












app.listen(745,function(){
    console.log("server is running on port 745......");
})
