const User = require('../models/User');

exports.getUsers = async(req,res)=>{
    try{
        const users = await User.find({})
        res.json(users);
    }
    catch(err){
        console.log(err);
    }
}