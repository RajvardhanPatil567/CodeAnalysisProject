// JavaScript test file with common security and performance issues

// Security vulnerability - eval usage
function processUserInput(userCode) {
    // Dangerous: executing user input directly
    return eval(userCode);
}

// Security vulnerability - innerHTML with user data
function displayMessage(message) {
    document.getElementById('output').innerHTML = message; // XSS vulnerability
}

// Performance issue - inefficient DOM manipulation
function createList(items) {
    const container = document.getElementById('list');
    for (let i = 0; i < items.length; i++) {
        // Inefficient: causes reflow on each iteration
        container.innerHTML += '<li>' + items[i] + '</li>';
    }
}

// Code quality issue - function with too many parameters
function processOrder(customerId, productId, quantity, price, discount, tax, shipping, currency, paymentMethod, billingAddress) {
    // This function has too many parameters
    return {
        total: (price * quantity) - discount + tax + shipping,
        customer: customerId,
        product: productId
    };
}

// Performance issue - inefficient string concatenation in loop
function buildLargeString(data) {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result += data[i] + " | "; // Inefficient string concatenation
    }
    return result;
}

// High cyclomatic complexity
function complexValidation(user) {
    if (user.age) {
        if (user.age > 18) {
            if (user.hasLicense) {
                if (user.country === 'US') {
                    if (user.state) {
                        if (user.zipCode) {
                            if (user.email) {
                                if (user.phone) {
                                    return true;
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// Security issue - potential prototype pollution
function mergeObjects(target, source) {
    for (let key in source) {
        target[key] = source[key]; // Dangerous: can modify prototype
    }
    return target;
}

// Performance issue - unnecessary global variable access
var globalCounter = 0;
function incrementCounter() {
    for (let i = 0; i < 1000; i++) {
        globalCounter++; // Accessing global variable in tight loop
    }
}

// Code quality issue - unused variable
function calculateTotal(items) {
    let subtotal = 0;
    let discount = 0.1; // Unused variable
    let tax = 0.08;
    
    for (let item of items) {
        subtotal += item.price;
    }
    
    return subtotal * (1 + tax);
}

// Security vulnerability - potential command injection
function executeCommand(userInput) {
    const command = "ls " + userInput; // Dangerous: command injection
    // In real code, this would use child_process.exec()
    console.log("Would execute: " + command);
}
