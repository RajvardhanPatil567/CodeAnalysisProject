// Java test file with performance, security, and code quality issues

import java.util.*;
import java.io.*;
import java.sql.*;

public class JavaIssues {
    
    // Security vulnerability - SQL injection
    public List<User> getUsersByName(String name) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/test");
        Statement stmt = conn.createStatement();
        
        // Dangerous: SQL injection vulnerability
        String query = "SELECT * FROM users WHERE name = '" + name + "'";
        ResultSet rs = stmt.executeQuery(query);
        
        List<User> users = new ArrayList<>();
        while (rs.next()) {
            users.add(new User(rs.getString("name"), rs.getString("email")));
        }
        
        // Resource leak - connections not closed
        return users;
    }
    
    // Performance issue - inefficient string concatenation
    public String buildLargeString(List<String> items) {
        String result = "";
        for (String item : items) {
            result += item + ", "; // Inefficient string concatenation
        }
        return result;
    }
    
    // Code quality issue - method with too many parameters
    public boolean processPayment(String customerId, String productId, double amount, 
                                String currency, String paymentMethod, String cardNumber,
                                String expiryDate, String cvv, String billingAddress,
                                String shippingAddress, boolean isGift, String giftMessage) {
        // Method has too many parameters
        return amount > 0 && customerId != null && productId != null;
    }
    
    // High cyclomatic complexity
    public String determineUserCategory(User user) {
        if (user != null) {
            if (user.getAge() != null) {
                if (user.getAge() >= 18) {
                    if (user.getIncome() != null) {
                        if (user.getIncome() > 50000) {
                            if (user.getCreditScore() != null) {
                                if (user.getCreditScore() > 700) {
                                    if (user.getEmploymentStatus() != null) {
                                        if (user.getEmploymentStatus().equals("EMPLOYED")) {
                                            if (user.getYearsEmployed() != null) {
                                                if (user.getYearsEmployed() > 2) {
                                                    return "PREMIUM";
                                                } else {
                                                    return "STANDARD";
                                                }
                                            } else {
                                                return "BASIC";
                                            }
                                        } else {
                                            return "BASIC";
                                        }
                                    } else {
                                        return "BASIC";
                                    }
                                } else {
                                    return "BASIC";
                                }
                            } else {
                                return "BASIC";
                            }
                        } else {
                            return "BASIC";
                        }
                    } else {
                        return "BASIC";
                    }
                } else {
                    return "MINOR";
                }
            } else {
                return "UNKNOWN";
            }
        } else {
            return "INVALID";
        }
    }
    
    // Performance issue - inefficient collection usage
    public List<String> findDuplicates(List<String> items) {
        List<String> duplicates = new ArrayList<>();
        
        for (int i = 0; i < items.size(); i++) {
            for (int j = i + 1; j < items.size(); j++) {
                // O(n²) algorithm when O(n) is possible with HashSet
                if (items.get(i).equals(items.get(j))) {
                    if (!duplicates.contains(items.get(i))) {
                        duplicates.add(items.get(i));
                    }
                }
            }
        }
        
        return duplicates;
    }
    
    // Security vulnerability - deserialization without validation
    public Object deserializeObject(byte[] data) throws IOException, ClassNotFoundException {
        ByteArrayInputStream bis = new ByteArrayInputStream(data);
        ObjectInputStream ois = new ObjectInputStream(bis);
        
        // Dangerous: deserializing untrusted data
        return ois.readObject();
    }
    
    // Code quality issue - unused variables and imports
    public void processData() {
        String unusedVariable = "This is never used";
        int anotherUnused = 42;
        List<String> neverUsed = new ArrayList<>();
        
        System.out.println("Processing data...");
    }
    
    // Performance issue - synchronization bottleneck
    public synchronized void updateCounter() {
        // Unnecessary synchronization on entire method
        for (int i = 0; i < 1000; i++) {
            counter++;
        }
        System.out.println("Counter updated");
    }
    
    private static int counter = 0;
    
    // Security issue - hardcoded credentials
    public Connection getDatabaseConnection() throws SQLException {
        String username = "admin"; // Hardcoded credentials
        String password = "password123"; // Security vulnerability
        String url = "jdbc:mysql://localhost:3306/production";
        
        return DriverManager.getConnection(url, username, password);
    }
    
    // Performance issue - memory leak potential
    private static Map<String, Object> cache = new HashMap<>();
    
    public void cacheData(String key, Object value) {
        cache.put(key, value);
        // No cache eviction strategy - potential memory leak
    }
    
    // Code quality issue - magic numbers
    public boolean isValidAge(int age) {
        return age >= 0 && age <= 150; // Magic numbers should be constants
    }
    
    // Performance issue - inefficient exception handling
    public String readFile(String filename) {
        try {
            BufferedReader reader = new BufferedReader(new FileReader(filename));
            StringBuilder content = new StringBuilder();
            String line;
            
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
            
            return content.toString();
        } catch (Exception e) {
            // Catching generic Exception instead of specific ones
            // Also not closing resources properly
            return null;
        }
    }
    
    // Inner class for User
    public static class User {
        private String name;
        private String email;
        private Integer age;
        private Double income;
        private Integer creditScore;
        private String employmentStatus;
        private Integer yearsEmployed;
        
        public User(String name, String email) {
            this.name = name;
            this.email = email;
        }
        
        // Getters
        public String getName() { return name; }
        public String getEmail() { return email; }
        public Integer getAge() { return age; }
        public Double getIncome() { return income; }
        public Integer getCreditScore() { return creditScore; }
        public String getEmploymentStatus() { return employmentStatus; }
        public Integer getYearsEmployed() { return yearsEmployed; }
        
        // Setters
        public void setAge(Integer age) { this.age = age; }
        public void setIncome(Double income) { this.income = income; }
        public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }
        public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }
        public void setYearsEmployed(Integer yearsEmployed) { this.yearsEmployed = yearsEmployed; }
    }
}
