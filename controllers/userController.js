//The user controller handles user-related operations such as registration, login, and profile management.

const USER = require("../models/users");
const bcrypt = require("bcrypt");
const generateToken = require("../helpers/generateToken");
const { sendWelcomeEmail, sendResetEmail } = require("../email/sendEmail");
const jwt = require("jsonwebtoken");
const normalizePhone = require("../helpers/normalizePhone");

const handleRegister = async (req, res) => {
  //destructuring the register action or logic from the userSchema from the request body
  const { fullName, email, password } = req.body;
  //accepts 08012345678 or +2348012345678 and stores both as +2348012345678
  const phoneNumber = normalizePhone(req.body.phoneNumber);

  try {
    //check if the user already exists or find the user by email
    //older records may have the phone saved in local 0... format, so check that too
    const localPhone =
      phoneNumber && phoneNumber.startsWith("+234")
        ? `0${phoneNumber.slice(4)}`
        : phoneNumber;

    const alreadyExistingUser = await USER.findOne({
      $or: [
        { email: email || null },
        { phoneNumber: phoneNumber || null },
        { phoneNumber: localPhone || null },
      ],
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
    //invalid input (e.g. bad phone number) is the client's fault, not a server error
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

//handle register has been set up and the next thing i need to fix is my handle email verification, which would be verified with a token

const handleVerifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    //1, find the user (by email)
    //2, find the user by token

    const user = await USER.findOne({
      verificationToken: token,
    });
    console.log(user);
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
    (user.verificationToken = undefined),
      (user.verificationTokenExpires = undefined);
    await user.save();

    // send a success message
    return res
      .status(200)
      .json({ success: true, message: "Email verified Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//handling log-in with the already registered unique email and password
const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  //finding a user with a unique email
  try {
    const user = await USER.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Account not found, Please Register" });
    }
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Email is not verified, Check your email" });
    }

    //checking if password is correct while the user is logging in
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    //generate token  (validity, period) jwt would be used for authorization,
    //payload means the unique identification of the user
    //jsonwebtoken is used to sign the token, and its would be installed in the terminal as npm i jason web token

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1 day" }
    );

    return res.status(200).json({
      token,
      message: "Login successful",
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await USER.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: " Email is already verified" });
    }

    //since we are resending a new verification email, we need to generate a new verification token for the user

    const newToken = generateToken();
    const tokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.verificationToken = newToken;
    user.verificationTokenExpires = tokenExpires;
    await user.save();

    //resend the verification email to he user
    const clientUrl = `${process.env.FRONTEND_URL}/verify-email/${newToken}`;
    await sendWelcomeEmail({
      email: user.email,
      fullName: user.fullName,
      clientUrl,
    });

    return res.status(200).json({
      success: true,
      message: "verification Email sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await USER.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    //we need to generate a reset password token for the user

    const token = generateToken();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; //1 day
    await user.save();

    //resend mail to the user with the reset password link
    const clientUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendResetEmail({
      email: user.email,
      fullName: user.fullName,
      clientUrl,
    });
    return res.status(200).json({
      success: true,
      message: "Reset password email sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const handleChangePassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "All inputs is required" });
    }
    const user = await USER.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//reset password from the emailed link: POST /reset-password/:token with { password }
const handleResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const user = await USER.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  handleRegister,
  handleVerifyEmail,
  handleLogin,
  resendVerificationEmail,
  handleForgotPassword,
  handleChangePassword,
  handleResetPassword,
};
