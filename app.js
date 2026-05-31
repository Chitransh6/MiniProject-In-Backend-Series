const express = require("express");
const app = express();
const path = require("path");
const userModel = require("./models/user");
const bcrypt = require("bcrypt");
const postModel = require("./models/post");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
app.use(cookieparser());

app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.set("view engine","ejs");

app.use(express.static(path.join(__dirname+"/public")));


app.get("/",(req,res)=>{
    res.render("index");
})



app.post("/register",async(req,res)=>{
    let{username,name,age,email,password} = req.body;

    let user = await userModel.findOne({email : email});

    if(user) return res.status(500).send("User Already Registered");

    bcrypt.genSalt(10,(err,val)=>{
        bcrypt.hash(password,val,async(err,ans)=>{

            createdUser =  await userModel.create({
                username,
                name,
                age,
                email,
                password : ans
             });

           let token = jwt.sign({email:email , userid : createdUser._id},"heyyyy");

           res.cookie("token",token);
           res.send("user created");


        })
    })
})

app.get("/login",(req,res)=>{
  res.render("login");
})


app.post("/login",async(req,res)=>{

    let{email,password} = req.body;

    let user = await userModel.findOne({email : email});

    if(!user) return res.status(500).send("User Not Found");

    bcrypt.compare(password,user.password,(err,result)=>{
        if(!result) return res.status(500).send("User Not Found");


       else{
        let token = jwt.sign({email:email , userid : user._id},"heyyyy");

           res.cookie("token",token);
         res.redirect("/profile");
       }
    });
})

app.get("/logout",(req,res)=>{

    res.cookie("token" , "");
    res.redirect("/login");

})

app.get("/profile",isLogedin ,async(req,res)=>{

    let user = await userModel.findOne({email : req.user.email});
    await user.populate("posts");
   
    // console.log(user);
     
    res.render("profile",{user});
})


app.post("/post",isLogedin,async(req,res)=>{

    let{textarea} = req.body;
    let user =  await userModel.findOne({email : req.user.email});

   let post = await postModel.create({
        user : user._id,
        content :textarea
    });

    user.posts.push(post._id);
   await user.save();
    
   res.redirect("/profile");


})

app.get("/like/:id",isLogedin, async(req,res)=>{
   let post = await postModel.findOne({_id : req.params.id});

   if(post.likes.indexOf(req.user.userid) === -1){
   post.likes.push(req.user.userid);
   }

   else{
   post.likes.splice(post.likes.indexOf(req.user.userid));
   }
   await post.save();

   res.redirect("/profile");



});

app.get("/edit/:id",isLogedin, async(req,res)=>{
   let post =  await postModel.findOne({_id : req.params.id});

   res.render("edit",{post});
})

app.post("/edit/:id",async(req,res)=>{
    let post =  await postModel.findOne({_id : req.params.id});

    let updatedPost = await postModel.findOneAndUpdate(
        {_id : req.params.id}, {
        $set :{
            content : req.body.textarea
        }
        },
        {new : true}
);

   res.redirect("/profile");
})

function isLogedin(req,res,next){

    if(!req.cookies || !req.cookies.token || req.cookies.token === "") res.redirect("/login");

    else{
      let data = jwt.verify(req.cookies.token,"heyyyy");
      if(data){
        req.user = data;
         next();
      }
    }
   
  

}



app.listen(3000);