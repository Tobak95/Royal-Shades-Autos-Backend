//The user controller handles user-related operations such as registration, login, and profile management.

const USER = require("../models/users");

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
    const clientUrl = ``
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  handleRegister,
};
