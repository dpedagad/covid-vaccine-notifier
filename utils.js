
const nodemailer = require('nodemailer');
const minimumAge = (age) => {
    if (age < 45) {
        return 18
    } else {
        return 45
    }
}

let transporter = nodemailer.createTransport({
    name: 'smtp.ethereal.email',
    host: 'smtp.ethereal.email',
    port: 465,
    sendmail: true,
    secure: false,
    auth: {
        user: 'johnnie72@ethereal.email',
        pass: 'K5fgvduYzWP83v2mcx'
    },

});



const sendEmail = (toEmail, bodyText) => {
    let mailOptions = {
        from: 'johnnie72@ethereal.email',
        to: toEmail,
        subject: 'Your covid-19 vaccine availability info',
        text: bodyText
    };
    console.log("receiving", toEmail, "and ", bodyText)
    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            console.log("Error " + err);
        } else {
            console.log("Email sent successfully");

        }
    })
}



module.exports = { minimumAge, sendEmail };