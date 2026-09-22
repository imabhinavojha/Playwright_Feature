function countVowel(){
    let string = "Abhinav";
    let vowel = "aeiou";
    let map = new Map();
    let totalVowel = 0;
    string = string.toLowerCase();
    for(let i =0; i <string.length-1; i++){
        let ch = string[i];
        if(vowel.includes(ch)){
            let count = map.get(ch) || 0;
            map.set(ch, count + 1);
            totalVowel++;
        }
    }
    console.log("Total Vowel : "+totalVowel);
    console.log("Total Vowel With Charcter : ",map);
    console.log("Total Vowel With Charcter and There Count Using Object.fromEntries(map) : ",Object.fromEntries(map));
    console.log("Total Vowel With Charcter and There Count Using Array.from(map) : ",Array.from(map));
    
}

countVowel();