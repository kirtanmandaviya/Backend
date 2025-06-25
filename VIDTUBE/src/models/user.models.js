import mongoose , { Schema }from "mongoose"; 
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";


const userSchema = new Schema(
    {
        username : {
            type:String,
            required : true,
            unique: true,
            lowercase:true,
            trim: true,
            index:true
        },
        email:{
            type:String,
            required : true,
            unique: true,
            lowercase:true,
            trim: true,
        },
        fullname:{
            type:String,
            required : true,
            trim: true,
            index:true
        },
        avatar:{
            type:String, // cloudniary URL
            required:true
        },
        coverImage:{
            type:String, // cloudniary URL
            required:true
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required: [true, "Password is required"]
        },
        refreshToken:{
            type:String,
        }
    },
    { timestamps: true } 
) 

userSchema.pre("save", async function (next) {
 
    if(!this.isModified("password")) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt)
   

    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    console.log("enteredPassword:", password, typeof password);
    console.log("this.password (hash):", this.password, typeof this.password);
    const result =  await bcrypt.compare(password, this.password);
    console.log("Comparison result:", result);
    return result
}

userSchema.methods.generateAccessToken = function () {
    // Short lived access token
    return jwt.sign({
        _id : this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn:process.env.ACCESS_TOKEN_EXPIRY }
    );
}


userSchema.methods.generateRefreshToken = function () {
    // Short lived access token
    return jwt.sign({
        _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn:process.env.REFRESH_TOKEN_EXPIRY }
    );
}

export const User = mongoose.model("User", userSchema)     
                