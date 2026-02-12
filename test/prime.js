let arr=[1,2,3,4,5,6,7,8,9,10];

for(let i=0;i<arr.length;i++){
    let isPrime=true;
    if(arr[i]==1)isPrime=false;
    for(let j=2;j<=arr[i]/2;j++){
        if(arr[i]%j==0){
            isPrime=false;
        }
    }
    if(isPrime){
        for(let k=i;k<arr.length;k++){
            arr[k]=arr[k+1];
        }
        arr.length =arr.length-1;
        i--;
    }
}
console.log(arr)