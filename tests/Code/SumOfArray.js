function sumOfArray1(){
  const arr = [1, 2, [3, 4], [[5, 6]]];
  const sum = arr.flat(Infinity).reduce((acc, num) => acc + num, 0);
  console.log(sum); // 21
}

function sumOfArray2(){
  const arr = [1, 2, [3, 4], [[5, 6]]];
  let flatArr = arr.flat(Infinity);
console.log(flatArr)
}

function sumOfArray(){
  const arr = [1, 2, [3, 4], [[5, 6]]];
  
function flatten(arr) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      result = result.concat(flatten(arr[i]));
    } else {
      result.push(arr[i]);
    }
  }
  return result;
}

let array1 = flatten(arr);
let Count = 0;
for(let sum of array1){
  Count = Count + sum;
}
console.log(Count); // 21

}