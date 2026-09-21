function countChar(){
    let val = "abhinav  Ojha";
    let map = new Map();
    for(let str of val){
        let count = map.get(str) || 0;
        map.set(str, count+1);
    }
    console.log(map);
}
countChar();