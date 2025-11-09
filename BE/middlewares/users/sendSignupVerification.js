const nodemailer = require("nodemailer");
const User = require("../../models/user.model");
const EmailVerification = require("../../models/email.model");
const { verifyEmailHTML } = require("../../utils/emailTemplates");

const sendSignupVerification = async (req, res, next) => {
  try {
    const user = req.createdUser;
    if (!user) {
      return res.status(404).json({ message: "User not found after creation." });
    }

    await EmailVerification.deleteMany({ email: user.email, for: "signup" });

    const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();

    const newVerification = new EmailVerification({
      email: user.email,
      verificationCode: verificationCode,
      for: "signup",
    });
    await newVerification.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: process.env.EMAIL_SERVICE,
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"SocialEcho" <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Verify Your Email Address for SocialEcho",
      html: verifyEmailHTML(user.name, "#", verificationCode),
    });

    res.status(201).json({
      message: "User registered successfully. Please check your email for the verification code.",
      user: { email: user.email }
    });

  } catch (error) {
    if (req.createdUser) {
      await User.deleteOne({ _id: req.createdUser._id });
    }
    res.status(500).json({ message: "Failed to send verification email. Please try registering again." });
  }
};

module.exports = { sendSignupVerification };