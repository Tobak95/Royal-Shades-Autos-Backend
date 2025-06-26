//The user controller handles user-related operations such as registration, login, and profile management.

const USER = require("../models/users");
const bcrypt = require("bcrypt");
const generateToken = require("../helpers/generateToken");
const { sendWelcomeEmail, sendResetEmail } = require("../email/sendEmail");

const handleRegister = async (res, req) => {
  //destructuring the register action or logic from the userSchema from the request body

  const { fullName, email, phoneNumber, password } = req.body;

  try {
    //check if the user already exists or find the user by email

    const alreadyExistingUser = await USER.findOne({
      $or: [{ email: email || null }, { phoneNumber: phoneNumber || null }],
    });
    if (alreadyExistingUser) {
      return res
        .status(400)
        .json({ message: "Email or Phone Number already exist" });
    }
    // protecting users password : bcrypt would be installed for hashing password

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    //verify process
    const verificationToken = generateToken();
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    //save to database
    const user = await USER.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      verificationToken,
      verificationTokenExpires,
    });

    //sending an email - this comes after the user is created and we need to construct the client Url
    const clientUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendWelcomeEmail({
      email: user.email,
      fullName: user.fullName,
      clientUrl,
    });
    // message that should be sent the the user is registered successfully

    return res
      .status(201)
      .json({ success: true, message: "User Registered Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//handle register has been set up and the next thing i need to fix is my handle email verification, which would be verified with a token

const handleVerifyEmail = async (res, req) => {
  const { token } = res.params;
  try {
    //1, find the user (by email)
    //2, find the user by token

    const user = await USER.findOne({
      verificationToken: token,
    });
    if (!user) {
      return res.status(404).json({ message: "invalid verification token" });
    }
    //Expired token
    if (user.verificationTokenExpires < Date.now()) {
      return res
        .status(404)
        .json({ message: "verification token has expired", email: user.email });
    }

    //if user is verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    //the user is fully verified
    user.isVerified = true;
    user.verificationToken = undefined,
    user.verificationTokenExpires = undefined
    await user.save()

    // send a success message
    return res.status(200).json({success: true, message: "Email verified Successfully"})
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  handleRegister,
  handleVerifyEmail,
};
