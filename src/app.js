import "dotenv/config";
import express from "express";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import path from 'path';
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
    res.locals.error= req.flash("error");
    res.locals.success= req.flash("success");
    next();
})

app.use(authRoute);
app.use(userRoute);
app.use((req, res) => {
  res.status(404).render("user/404");
});

app.use((err,req,res,next)=>{
  if(err){
    console.log(err.message)
    res.send(err.message)
  }
  next()
})
export default app;