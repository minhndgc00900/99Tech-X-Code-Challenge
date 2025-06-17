
// uses the closed-form formula for the sum of the first n natural numbers
var sum_to_n_a = function(n) {
    return n * (n+1) / 2;
};

// uses for loop to add numbers from 1 to n
var sum_to_n_b = function(n) {
    let sum = 0;

    for(let i = 1; i <=n; i++){
      sum += i;
    }

    return sum;
};

// recursion
var sum_to_n_c = function(n) {
    if(n <= 1) return n;

    return n + sum_to_n_c(n - 1);
};

// Log to console
console.log(sum_to_n_a(22))
console.log(sum_to_n_b(22))
console.log(sum_to_n_c(22))