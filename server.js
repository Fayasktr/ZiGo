import app from "./src/app.js"
import connectDB from "./src/config/db.js";


let PORT=process.env.PORT||3000;


connectDB()


app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}/`)    
})