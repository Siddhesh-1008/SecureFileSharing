const express=require("express")
require('dotenv').config()
const mongoose=require('mongoose')
const multer=require('multer')
const app=express()
const bcrypt=require('bcrypt')
const FileModel=require('./models/file')
const path=require('path')
const nodemailer = require('nodemailer');


//Configure your SMTP transport 
//EMAIL CODE SETTING SNEDER MAIL AND APP PASSOWRD
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like 'smtp', 'yahoo', etc.
    auth: {
        user: '20102130.siddhesh.sawant@gmail.com', // Your email
        pass: 'nrwd ggqx zxbb hjlq'   // Your email password or application-specific password
    }
});

//PARSER
app.use(express.urlencoded({extended:true}))


//SET VIEW ENGINE
app.set("view engine","ejs")


//PORT WILL BE COMING FROM DOT ENV
//process.envND BASICALLY GETS THE PORT NUMBER AND THEN  RUN THE PORT 
const PORT=process.env.PORT

//MONGOOSE CONNECTION
mongoose.connect(process.env.DATABASE_URL)

//SIMPLE MIDDLEWARE FOR MULTER
const upload=multer({
    dest:'uploads'
})


//HOME PAGE
app.get('/',function(req,res){
    res.render('index.ejs')
})

//UPLOAD FILE
//req.file give all detials of file as wll as its path where it hs benn stored 
app.post('/upload',upload.single('file'),async function(req,res){
    console.log(req.file.path)
    console.log(req.body.password)
    //SETTING THE VALUES IN identites OF FILE SCHEMA
    const filedata={
        path:req.file.path,
        originalName:req.file.originalname
    }

    //CONVERTING PASSWORD INOT HASH
    let salt=await bcrypt.genSalt(10)
    console.log("random string->",salt)
        
    //SEE ADD THIS PASSWORD IDENTITY TO FILEDATA ONLY IF PASWWORD IS WRITTEN
    if(req.body.password!= null && req.body.password!==""){
        filedata.password=await bcrypt.hash(req.body.password,salt)
    }

    // ADD ALL VALUES TO THE IDENTITES  OF FILE SCHEMA
    const file=await FileModel.create(filedata)
    const share=await FileModel.find()
    
    //EMAIL CODE OF SENDING
    const fL = `${req.headers.origin}/file/${file.id}`;
    if (req.body.email) {
        const mailOptions = {
            from: '20102130.siddhesh.sawant@gmail.com', // Sender address
            to: req.body.email,                    // List of recipients
            subject: 'Your file is uploaded', // Subject line
            text: `Your file has been uploaded. You can access it here:- ${fL}`, // Plain text body
            html: `<p>Your file has been uploaded. You can access it <a href="${fL}">here</a>.</p>` // HTML body
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    res.render('index',{fileLink:`${req.headers.origin}/file/${file.id}`})

})

//PASSWORD 
//BASICALLY ROUTE IS USED WHEN you to define multiple HTTP methods (such as GET, POST, PUT, DELETE, etc.) for a specific route using a more concise and organized syntax
//same route on which u will perform both get and post request
//.get(handleDownload) FIRST CHECKS WHETHER THE LINK IS PASSWORD PRTOTECTED OR NOT 
//IF IT IS PASSWORD PROTECTED THEN IT WILL RENDER PASSWORD EJS PAGE 
//THEN IT WILL AGAIN RUN .post(handleDownload) FUNCTION TO CHECK WHETHER THE PASWWORD IS RIGHT OR WORNG BY BCRYPT
app.route("/file/:id").get(handleDownload).post(handleDownload)
async function handleDownload(req,res){
    //we will get file object of that particular id
    const file=await FileModel.findById(req.params.id)
    
    //now check whether that FILE OBJECT IDENTITES HAVE PASSWORD IDENTITY BLANK OR FILLED 
    // IF FILLED THEN RENDER PASSWORD EJS AND THEN AGAIN CHECK TO SEE THE PASSWORD IS CORRECT OR NOT
    //file.password!=null SAYS THAT FILE IS PROTECTED
    if(file.password!=null){
        //HERE FILE IS NOT PASSWORD PROTECTED A 
        if(req.body.password==null){
            res.render('password')
            return
        }
        if(!await bcrypt.compare(req.body.password,file.password)){
            res.render("password.ejs",{error:true})
            return
        }
    }

    //IF FILE OBJECT HAS PASSWORD NULL THEN INCREMENT THE COUNT IN IT AND SAVE IT MANUALLY AND THEN DOWNLOAD WITH THE HELP OF INBUILT FUNCTION res.download(get_the_fiel_from_path,original_name _of the file)
    file.downloadCount++
    await file.save()
    res.download(file.path,file.originalName)

}

app.listen(PORT,()=>{
    console.log("APP IS LISTENING ON PORT" + PORT)
})