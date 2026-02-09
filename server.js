import app from "./src/app.js"
import connectDB from "./src/config/db.js";


let PORT=process.env.PORT;


connectDB()


app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}/`)    
})