import "dotenv/config";
import express from "express";
import userRoute from "./routes/userRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import sessionMiddleware from "../src/config/session.js";
import flash from "connect-flash";

const app = express()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"))


app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use("/public", express.static(path.join(__dirname, "../public")));


console.log('hello reached to app.js')

app.use(sessionMiddleware);
app.use(flash());
app.use((req,res,next)=>{
    res.locals.errorMessage= req.flash("error");
    res.locals.successMessage= req.flash("success");
    next();
})

app.use(userRoute);
app.use((req, res) => {
  res.status(404).render("user/404");
});


export default app;