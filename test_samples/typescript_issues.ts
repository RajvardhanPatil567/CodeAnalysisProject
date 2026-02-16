// TypeScript test file with type safety and code quality issues

// Type safety issue - any type usage
function processData(data: any): any {
    // Using 'any' defeats the purpose of TypeScript
    return data.someProperty.anotherProperty;
}

// Type safety issue - missing return type
function calculateScore(points, multiplier) {
    return points * multiplier; // Missing parameter and return types
}

// Security vulnerability - eval with user input
function executeUserCode(code: string): unknown {
    // Dangerous: eval usage
    return eval(code);
}

// Performance issue - inefficient array operations
function filterAndMap(items: number[]): string[] {
    return items
        .filter(x => x > 0)
        .filter(x => x < 100) // Multiple filters instead of one
        .map(x => x.toString())
        .map(x => x.padStart(3, '0')); // Multiple maps instead of one
}

// Code quality issue - complex function with many responsibilities
class UserManager {
    // Function with too many parameters and responsibilities
    createUser(
        firstName: string,
        lastName: string,
        email: string,
        phone: string,
        address: string,
        city: string,
        state: string,
        zipCode: string,
        country: string,
        birthDate: Date,
        preferences: object
    ): boolean {
        // Validation logic
        if (!firstName || !lastName || !email) {
            return false;
        }
        
        // Email validation
        if (!email.includes('@')) {
            return false;
        }
        
        // Phone validation
        if (phone.length < 10) {
            return false;
        }
        
        // Database logic (should be separated)
        console.log('Saving to database...');
        
        // Email sending logic (should be separated)
        console.log('Sending welcome email...');
        
        // Logging logic (should be separated)
        console.log('User created:', firstName, lastName);
        
        return true;
    }
}

// Type safety issue - incorrect interface usage
interface User {
    id: number;
    name: string;
    email: string;
}

function getUser(id: string): User {
    // Type mismatch: returning object that doesn't match interface
    return {
        userId: parseInt(id), // Wrong property name
        fullName: "John Doe", // Wrong property name
        emailAddress: "john@example.com" // Wrong property name
    } as User; // Dangerous type assertion
}

// Performance issue - synchronous operations that should be async
function loadUserData(userId: number): User {
    // Simulating synchronous database call (blocking)
    let userData: User = { id: 0, name: '', email: '' };
    
    // Inefficient loop simulating database delay
    for (let i = 0; i < 1000000; i++) {
        // Blocking operation
        userData.id = userId;
    }
    
    return userData;
}

// High cyclomatic complexity
function validateUserInput(input: any): boolean {
    if (input) {
        if (typeof input === 'object') {
            if (input.hasOwnProperty('name')) {
                if (input.name.length > 0) {
                    if (input.hasOwnProperty('email')) {
                        if (input.email.includes('@')) {
                            if (input.hasOwnProperty('age')) {
                                if (input.age > 0) {
                                    if (input.age < 150) {
                                        if (input.hasOwnProperty('country')) {
                                            return input.country.length > 0;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

// Code quality issue - unused imports and variables
import { readFileSync } from 'fs'; // Unused import
import { join } from 'path'; // Unused import

function processFile(filename: string): string {
    const unusedVariable = "This is never used";
    const anotherUnused = 42;
    
    return filename.toUpperCase();
}

// Security issue - potential prototype pollution
function deepMerge(target: any, source: any): any {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object') {
            target[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key]; // Dangerous: can pollute prototype
        }
    }
    return target;
}

// Type safety issue - missing null checks
function getUserName(user: User | null): string {
    return user.name.toUpperCase(); // Potential null reference error
}

// Performance issue - memory leak potential
class EventManager {
    private listeners: Function[] = [];
    
    addEventListener(callback: Function): void {
        this.listeners.push(callback);
        // Missing removeEventListener - potential memory leak
    }
    
    // No cleanup method provided
}
