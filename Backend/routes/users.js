import express from "express";
import {login, logout, signUp, updateUser, getUsers, getProfile} from "../controllers/user.js";
import {authenticate} from "../middlewares/auth.js";

const router = express.Router();

router.post("/update-user", authenticate, updateUser);
router.get("/users", authenticate, getUsers);
router.get("/profile", authenticate, getProfile);

router.post("/signup", signUp);

router.post("/login", login);

router.post("/logout", logout);

export default router;

// import express from "express";
// import {
//   getUsers,
//   login,
//   signup,
//   updateUser,
//   logout,
// } from "../controllers/user.js";

// import { authenticate } from "../middlewares/auth.js";
// const router = express.Router();

// router.post("/update-user", authenticate, updateUser);
// router.get("/users", authenticate, getUsers);

// router.post("/signup", signup);
// router.post("/login", login);
// router.post("/logout", logout);

// export default router;