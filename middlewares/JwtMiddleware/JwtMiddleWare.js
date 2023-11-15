const jwt = require('jsonwebtoken');
const signAccessToken=( _id )=>{
    return jwt.sign({ _id}, process.env.EXPRESS_ACCESS_TOKEN || "", {
        expiresIn: process.env.EXPRESS_ACCESS_TOKEN_TOKEN_EXPIRES_IN,
      });
};
const signRefreshToken=( _id )=>{
    return jwt.sign({ _id}, process.env.EXPRESS_REFRESH_TOKEN || "", {
        expiresIn: process.env.EXPRESS_ACCESS_REFRESH_TOKEN_EXPIRES_IN,
      });
}
const refreshTokenExpire = parseInt(process.env.EXPRESS_REFRESH_TOKEN_EXPIRES_IN || '300', 10);
const accessTokenExpire = parseInt(process.env.EXPRESS_ACCESS_TOKEN_EXPIRES_IN || '1200',10);
const refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};
const accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};
const setToken = (user,statusCode,res)=>{
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    res.cookie('refresh_token', refreshToken,refreshTokenOptions);
    res.cookie('access_token', accessToken,accessTokenOptions);
    if (process.env.EXPRESS_NODE_ENV === 'production') {
        accessTokenOptions.secure = true;
    }
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
}
module.exports = {
    setToken,
    accessTokenOptions,
    refreshTokenOptions
}