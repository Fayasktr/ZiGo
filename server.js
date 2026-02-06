import express from "express";

let app=express();


let PORT=9925



app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}/`)
})