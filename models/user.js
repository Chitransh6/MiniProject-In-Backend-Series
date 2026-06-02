const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/miniProject")

const userschema = mongoose.Schema({
    username : String,
    name : String,
    age : Number,
    email : String,
    password : String,
    profilepic :{
        type : String,
        default : "profilepic.jfif"
    },
    posts : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "post"
        }
    ]
});

module.exports = mongoose.model("user",userschema);