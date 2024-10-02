//MONGO DB DAATABASE
const mongoose=require('mongoose')

const FileSchema=new mongoose.Schema({
    path:{
        type:String,
        require:true
    },
    originalName:{
        type:String,
        required:true
    },
    password:String,
    downloadCount:{
        type:Number,
        required:true,
        default:0
    }
})

module.exports=mongoose.model('File',FileSchema)