
function palindrome(){
    let val1 = "MAM";
    let split1 = val1.split('');
    let l1 = 0, r1 = split1.length - 1, flag= true;
    while (l1 < r1) {
        if(val1.charCodeAt[l1]!=val1.charCodeAt[r1]){
            flag= false;
            break;
        }
        l1++;
        r1--;
    }
    console.log("isPalindrome : "+flag);
}
