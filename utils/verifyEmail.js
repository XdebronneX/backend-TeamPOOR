const nodemailer = require("nodemailer");

const verifyEmail = async (email, subject, text, isHTML = false) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.GMAIL_HOST,
            service: process.env.GMAIL_SERVICE,
            port: Number(process.env.GMAIL_PORT),
            secure: Boolean(process.env.GMAIL_SECURED),
            auth: {
                user: process.env.GMAIL_FROM_USER,
                pass: process.env.GMAIL_PASSWORD,
            }
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: subject,
        };

        if (isHTML) {
            // If isHTML is true, set the email content as HTML
            mailOptions.html = text;
        } else {
            // If isHTML is false, use plain text content
            mailOptions.text = text;
        }

        await transporter.sendMail(mailOptions);
    } catch (error) {
        // Handle any errors that occur during email sending
        console.error("Error sending email:", error);
    }
}

module.exports = verifyEmail;
