const mongoose = require("mongoose");
// const userschema = mongoose.Schema({
//     name:String,
//     email:String,
//     password:String,
//     phone:Number,
//     roles:String
// })

// mongoose.model("users",userschema);
// module.exports=mongoose.model("users")

const userSchema  = new mongoose.Schema({
    name:{ type : String, required: true },
    email:{ type : String, required: true, unique : true },
    password:{type : String, required : true},
    otp: {  type: String  },
    isLoggedIn: { type: Boolean, default: false }
})


  mongoose.model('User', userSchema);

  // module.exports=mongoose.model(User);
  module.exports=mongoose.model("User")
