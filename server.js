import app from "./src/app.js"
import connectDB from "./src/config/db.js";



let PORT=process.env.PORT||9925;
console.log('first reach in server')

connectDB()


app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}/`)    
})