export default class User {
    constructor(name, email) {
      this.name = name;
      this.email = email;
    }
  
    // Getter for name
    getName() {
      return this.name;
    }
  
    // Setter for name
    setName(name) {
      this.name = name;
    }
  
    // Getter for email
    getEmail() {
      return this.email;
    }
  
    // Setter for email
    setEmail(email) {
      this.email = email;
    }
  
    // Method to display user information
    displayInfo() {
      console.log(`Name: ${this.name}, Email: ${this.email}`);
    }
}

// export default User;