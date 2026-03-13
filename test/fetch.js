async function fetchData(){
    
    const data = await fetch("https://jsonplaceholder.typicode.com/posts")
    console.log(data)
}

fetchData()

