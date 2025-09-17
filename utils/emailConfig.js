import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({

    service:'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,
    }
});

transporter.verify((error,success)=>{
    if(error){
        console.log('Email configuration error : ', error);
    } else{
        console.log('Email Server is ready to send messages');
    }
});

export default transporter;