require('dotenv').config()
console.log(process.env)
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const md5 = require('md5')

const app = express()

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser : true})

const userSchema = new mongoose.Schema({
    email : String,
    password : String
})



const User = new mongoose.model("User",userSchema)




app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
app.set('view engine','ejs')

app.get('/',function(req,res){
    res.render('home')
})

app.get('/register',function(req,res){
    res.render('register')
})

app.post('/register',function(req,res){
    const newUser = new User({
        email : req.body.username,
        password : md5(req.body.password)
    })
    newUser.save(function(err){
        if(err){
            console.log(err)
        }
        else{
            res.render('secrets')
        }
    })
})

app.get('/login',function(req,res){
    res.render('login')
})

app.post('/login',function(req,res){
    const username = req.body.username
    const password = md5(req.body.password)
 
    User.findOne({email : username},function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render('secrets')
                }
                else{
                    res.send("<center><h1>Incorrect Password</h1></center><center><h3><----- Go back and give a correct password</h3></center>")
                }
            }
        }
    })
})












app.listen(745,function(){
    console.log("sever is running on port 745");
})

console.log(md5("123456"));