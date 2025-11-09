const nodemailer = require("nodemailer");
const EmailVerification = require("../../models/email.model");
const { query, validationResult } = require("express-validator");
const { verifyEmailHTML } = require("../../utils/emailTemplates");

const CLIENT_URL = process.env.CLIENT_URL;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE;

const verifyEmailValidation = [
  query("email").isEmail().normalizeEmail(),
  query("id").isLength({ min: 24, max: 24 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

// SỬA LỖI: Đổi tên hàm từ sendVerificationEmail thành verifyEmail
const verifyEmail = async (req, res, next) => {
  const USER = process.env.EMAIL;
  const PASS = process.env.PASSWORD;

  const { email, name } = req.user;
  const { id } = req.query;

  const verificationLink = `${CLIENT_URL}/auth/verify?id=${id}&email=${email}`;
  const blockLink = `${CLIENT_URL}/auth/block?id=${id}&email=${email}`;

  try {
    let transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: USER,
        pass: PASS,
      },
    });

    let info = await transporter.sendMail({
      from: `"SocialEcho" <${USER}>`,
      to: email,
      subject: "Action Required: Verify Your Account",
      html: verifyEmailHTML(name, verificationLink, blockLink),
    });

    const newVerification = new EmailVerification({
      email,
      verificationCode: id,
      messageId: info.messageId,
      for: "signup-device",
    });

    await newVerification.save();

    // SỬA LỖI: Gọi next() để chuyển sang middleware addContextData
    next();

  } catch (err) {
    console.log(
      "Could not send email. There could be an issue with the provided credentials or the email service."
    );
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  verifyEmailValidation,
  verifyEmail, // SỬA LỖI: Export đúng tên hàm
};