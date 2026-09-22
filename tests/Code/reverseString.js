function reverseString(){
    let val = "Abhinav";
    let split = val.split('');
    console.log(split);
    let l = 0, r = split.length - 1;
    while (l < r) {
        [split[l], split[r]] = [split[r], split[l]];
        l++;
        r--;
    }
    console.log(split.join(''));

}
