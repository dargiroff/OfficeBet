const DataStore = {
    // User Management
    getUsers: function() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Ensure admin user exists
        if (!users.some(user => user.name === 'admin')) {
            const adminUser = {
                name: 'admin',
                password: '1234', // Set admin password to 1234
                tokens: Infinity,
                betsCreated: [],
                betsParticipated: [],
                isAdmin: true
            };
            users.push(adminUser);
            this.saveUsers(users);
        } else {
            // Make sure admin always has infinite tokens
            const adminIndex = users.findIndex(user => user.name === 'admin');
            if (adminIndex !== -1 && users[adminIndex].tokens !== Infinity) {
                users[adminIndex].tokens = Infinity;
                this.saveUsers(users);
            }
            
            // Make sure admin has the correct password
            if (adminIndex !== -1 && users[adminIndex].password !== '1234') {
                users[adminIndex].password = '1234';
                this.saveUsers(users);
            }
        }
        
        return users;
    },
    
    saveUsers: function(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },
    
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    },
    
    setCurrentUser: function(user) {
        // Don't store the password in the current user object
        const userToStore = { ...user };
        delete userToStore.password;
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
    },
    
    clearCurrentUser: function() {
        localStorage.removeItem('currentUser');
    },
    
    isCurrentUserAdmin: function() {
        const currentUser = this.getCurrentUser();
        return currentUser && currentUser.isAdmin;
    },
    
    authenticateUser: function(username, password) {
        const users = this.getUsers();
        const user = users.find(user => user.name === username);
        
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        if (user.password !== password) {
            return { success: false, message: 'Incorrect password' };
        }
        
        // Set current user (without password)
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        this.setCurrentUser(userWithoutPassword);
        
        return { success: true, user: userWithoutPassword };
    },
    
    createUser: function(name, password) {
        const users = this.getUsers();
        
        // Check if user already exists
        if (users.some(user => user.name === name)) {
            return { success: false, message: 'User already exists' };
        }
        
        // Create new user with 100 initial tokens
        const newUser = {
            name: name,
            password: password,
            tokens: 100,
            betsCreated: [],
            betsParticipated: [],
            isAdmin: name === 'admin' // Only admin user gets admin privileges
        };
        
        users.push(newUser);
        this.saveUsers(users);
        
        // Add initial balance history entry
        this.addBalanceHistoryEntry(name, 100, 'Initial balance');
        
        // Return user without password
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;
        
        return { success: true, user: userWithoutPassword };
    },
    
    updateUser: function(updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.name === updatedUser.name);
        
        if (index === -1) {
            return { success: false, error: 'User not found' };
        }
        
        // Preserve admin status and password if not provided
        updatedUser.isAdmin = users[index].isAdmin || updatedUser.name === 'admin';
        if (!updatedUser.password) {
            updatedUser.password = users[index].password;
        }
        
        // Ensure admin always has infinite tokens
        if (updatedUser.name === 'admin') {
            updatedUser.tokens = Infinity;
        }
        
        users[index] = updatedUser;
        this.saveUsers(users);
        
        // Update current user if it's the same user (without password)
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.name === updatedUser.name) {
            const userWithoutPassword = { ...updatedUser };
            delete userWithoutPassword.password;
            this.setCurrentUser(userWithoutPassword);
        }
        
        // Return user without password
        const userWithoutPassword = { ...updatedUser };
        delete userWithoutPassword.password;
        
        return { success: true, user: userWithoutPassword };
    },
    
    deleteUser: function(username) {
        // Don't allow deleting the admin user
        if (username === 'admin') {
            return { success: false, message: 'Cannot delete the admin user' };
        }
        
        const users = this.getUsers();
        const initialCount = users.length;
        const filteredUsers = users.filter(user => user.name !== username);
        
        if (filteredUsers.length === initialCount) {
            return { success: false, message: 'User not found' };
        }
        
        this.saveUsers(filteredUsers);
        
        // If the deleted user was the current user, log out
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.name === username) {
            this.clearCurrentUser();
        }
        
        return { success: true, message: `User ${username} has been deleted` };
    },
    
    addTokensToUser: function(username, amount) {
        if (username === 'admin') {
            return { success: false, message: 'Cannot modify admin tokens' };
        }
        
        amount = parseInt(amount);
        if (isNaN(amount) || amount <= 0) {
            return { success: false, message: 'Amount must be a positive number' };
        }
        
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.name === username);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        users[userIndex].tokens += amount;
        this.saveUsers(users);
        
        // Update current user if it's the same user
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.name === username) {
            currentUser.tokens = users[userIndex].tokens;
            this.setCurrentUser(currentUser);
        }
        
        return { 
            success: true, 
            message: `Added ${amount} tokens to ${username}`,
            newBalance: users[userIndex].tokens
        };
    },
    
    removeTokensFromUser: function(username, amount) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.name === username);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Don't modify admin tokens
        if (users[userIndex].isAdmin) {
            return { success: false, message: 'Cannot modify admin tokens' };
        }
        
        // Calculate actual tokens to remove (can't go below 0)
        const currentTokens = users[userIndex].tokens;
        const tokensToRemove = Math.min(currentTokens, amount);
        
        users[userIndex].tokens = currentTokens - tokensToRemove;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user if it's the same user
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.name === username) {
            currentUser.tokens = users[userIndex].tokens;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        return { 
            success: true, 
            message: `Removed ${tokensToRemove} tokens from ${username}`,
            newBalance: users[userIndex].tokens,
            tokensRemoved: tokensToRemove
        };
    },
    
    // Bet Management
    getBets: function() {
        return JSON.parse(localStorage.getItem('bets') || '[]');
    },
    
    saveBets: function(bets) {
        localStorage.setItem('bets', JSON.stringify(bets));
    },
    
    getBetById: function(betId) {
        const bets = this.getBets();
        return bets.find(bet => bet.id === betId) || null;
    },
    
    getActiveBets: function() {
        const bets = this.getBets();
        return bets.filter(bet => bet.status === 'open');
    },
    
    getResolvedBets: function() {
        const bets = this.getBets();
        return bets.filter(bet => bet.status === 'resolved');
    },
    
    saveBet: function(bet) {
        const bets = this.getBets();
        const index = bets.findIndex(b => b.id === bet.id);
        
        if (index !== -1) {
            bets[index] = bet;
        } else {
            bets.push(bet);
        }
        
        localStorage.setItem('bets', JSON.stringify(bets));
        return { success: true, bet: bet };
    },
    
    // Add this function to the DataStore object
    clearAllData: function() {
        // Check if current user is admin
        if (!this.isCurrentUserAdmin()) {
            return { success: false, message: 'Only admin can reset all data' };
        }
        
        // Clear all data from localStorage
        localStorage.removeItem('users');
        localStorage.removeItem('bets');
        localStorage.removeItem('currentUser');
        
        // Create admin user
        const adminUser = {
            name: 'admin',
            password: '1234', // Set admin password to 1234
            tokens: Infinity,
            betsCreated: [],
            betsParticipated: [],
            isAdmin: true
        };
        
        // Save admin user
        this.saveUsers([adminUser]);
        
        // Set current user to admin
        this.setCurrentUser(adminUser);
        
        console.log('All data has been cleared and reset');
        return { success: true, message: 'All data has been reset' };
    },
    
    // Alias for clearAllData for compatibility
    resetAllData: function() {
        return this.clearAllData();
    },
    
    // Balance History Management
    getBalanceHistory: function(username) {
        const history = JSON.parse(localStorage.getItem(`balanceHistory_${username}`) || '[]');
        return history;
    },
    
    addBalanceHistoryEntry: function(username, amount, description) {
        const history = this.getBalanceHistory(username);
        const user = this.getUsers().find(u => u.name === username);
        
        if (!user) return;
        
        const entry = {
            timestamp: new Date().toISOString(),
            amount: amount,
            description: description,
            balance: user.tokens
        };
        
        history.push(entry);
        localStorage.setItem(`balanceHistory_${username}`, JSON.stringify(history));
    },
    
    addTokens: function(username, amount) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.name === username);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Add tokens
        users[userIndex].tokens += amount;
        this.saveUsers(users);
        
        // Add to balance history
        this.addBalanceHistoryEntry(username, amount, 'Admin added tokens');
        
        return { 
            success: true, 
            newBalance: users[userIndex].tokens 
        };
    },
    
    removeTokens: function(username, amount) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.name === username);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Calculate how many tokens to actually remove
        const tokensToRemove = Math.min(users[userIndex].tokens, amount);
        
        // Remove tokens
        users[userIndex].tokens -= tokensToRemove;
        this.saveUsers(users);
        
        // Add to balance history
        this.addBalanceHistoryEntry(username, -tokensToRemove, 'Admin removed tokens');
        
        return { 
            success: true, 
            tokensRemoved: tokensToRemove,
            newBalance: users[userIndex].tokens 
        };
    },
};
