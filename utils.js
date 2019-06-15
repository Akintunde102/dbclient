import jwt from "express-jwt";
import models from "./src/models";

export const validateUser = (email, password, done) => {
  models.Users.findOne({ email })
    .then(user => {
      if (!user || !user.validatePassword(password)) {
        return done(null, false, {
          errors: { "email or password": "is invalid" }
        });
      }

      return done(null, user);
    })
    .catch(done);
};

const getTokenFromHeaders = req => {
  const {
    headers: { authorization }
  } = req;

  if (authorization && authorization.split(" ")[0] === "Token") {
    return authorization.split(" ")[1];
  }
  return null;
};

export const auth = {
  required: jwt({
    secret: "secret",
    userProperty: "payload",
    getToken: getTokenFromHeaders
  }),
  optional: jwt({
    secret: "secret",
    userProperty: "payload",
    getToken: getTokenFromHeaders,
    credentialsRequired: false
  })
};
