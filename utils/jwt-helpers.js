import jwt from 'jsonwebtoken';

function jwtTokens({user_id,user_name,user_email}){
    const user = {user_id,user_name,user_email};

    // ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET set as environment variables in server also

    const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'10m'});
    const refreshToken = jwt.sign(user,process.env.REFRESH_TOKEN_SECRET,{expiresIn:'50m'});

    return ({
        accessToken,refreshToken
    });

}

export{jwtTokens};