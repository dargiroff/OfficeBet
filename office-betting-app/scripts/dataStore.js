const DataStore = {
    // Emergency fix: Universal data fetching solution
    forceRefreshData: async function() {
        console.log('Emergency data refresh triggered');
        
        try {
            // Clear any Firestore cache
            if (window.indexedDB) {
                console.log('Clearing IndexedDB cache');
                try {
                    indexedDB.deleteDatabase('firebaseLocalStorageDb');
                } catch (e) {
                    console.warn('Error clearing IndexedDB:', e);
                }
            }
            
            // Store test data in localStorage as fallback
            const testBets = [
                {
                    id: 'test-bet-1',
                    description: 'Will it rain tomorrow?',
                    creator: 'admin',
                    options: ['Yes', 'No'],
                    status: 'open',
                    createdAt: new Date().toISOString(),
                    deadline: new Date(Date.now() + 86400000).toISOString(),
                    stake: 10,
                    participants: {}
                },
                {
                    id: 'test-bet-2',
                    description: 'Who will win the game?',
                    creator: 'admin',
                    options: ['Team A', 'Team B', 'Draw'],
                    status: 'open',
                    createdAt: new Date().toISOString(),
                    deadline: new Date(Date.now() + 172800000).toISOString(),
                    stake: 20,
                    participants: {}
                },
                {
                    id: 'test-bet-3',
                    description: 'What will the temperature be?',
                    creator: 'admin',
                    options: ['Below 70°F', '70-80°F', 'Above 80°F'],
                    status: 'resolved',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    deadline: new Date(Date.now() - 86400000).toISOString(),
                    resolvedAt: new Date().toISOString(),
                    stake: 15,
                    participants: {
                        'user1': 'Below 70°F',
                        'user2': 'Above 80°F'
                    },
                    winningOption: 'Above 80°F',
                    winners: ['user2']
                }
            ];
            
            // Store test users as fallback
            const testUsers = [
                {name: 'admin', isAdmin: true, tokens: Infinity},
                {name: 'user1', tokens: 150},
                {name: 'user2', tokens: 200},
                {name: 'user3', tokens: 100}
            ];
            
            localStorage.setItem('activeBets', JSON.stringify(testBets.filter(bet => bet.status === 'open')));
            localStorage.setItem('resolvedBets', JSON.stringify(testBets.filter(bet => bet.status === 'resolved')));
            localStorage.setItem('users', JSON.stringify(testUsers));
            
            return true;
        } catch (e) {
            console.error('Error during emergency refresh:', e);
            return false;
        }
    },
    
    // User Management
    getUsers: async function() {
        console.log('DataStore: Getting users - optimized access');
        
        // Force clear caches if this is after a user switch
        if (this._afterUserSwitch) {
            console.log('Detected user switch, clearing caches before fetching users');
            await this.clearAllCaches();
            this._afterUserSwitch = false;
        }
        
        // Try to get cached users first for immediate display
        let cachedUsers = null;
        try {
            const cachedUsersJSON = localStorage.getItem('users');
            if (cachedUsersJSON) {
                cachedUsers = JSON.parse(cachedUsersJSON);
                console.log('DataStore: Found', cachedUsers.length, 'cached users in localStorage');
            }
        } catch (e) {
            console.error('Error parsing cached users:', e);
        }

        // Return cached users immediately if available
        if (cachedUsers && cachedUsers.length > 0) {
            console.log('DataStore: Using cached users from localStorage for immediate display');
            
            // Try to fetch fresh data in the background to update the cache
            this._refreshUsersInBackground();
            
            return cachedUsers;
        }
        
        // If no cached users, try to fetch from Firestore with a short timeout
        try {
            console.log('DataStore: No cached users available, trying Firestore with a short timeout');
            
            // Create a timeout promise to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore users fetch timed out')), 3000) // Short 3s timeout
            );
            
            // Race the fetch against the timeout
            const usersSnapshot = await Promise.race([
                db.collection('users').get({ source: 'server' }),
                timeoutPromise
            ]);
            
            // Process the results
            const users = usersSnapshot.docs.map(doc => doc.data());
            console.log('DataStore: Successfully fetched', users.length, 'users from Firestore');
            
            // Cache the results
            localStorage.setItem('users', JSON.stringify(users));
            
            return users;
        } catch (error) {
            console.warn('DataStore: Error fetching users from Firestore:', error);
            
            // Create default user data as a last resort
            const defaultUsers = [
                {name: 'admin', tokens: Infinity, betsCreated: [], betsParticipated: [], isAdmin: true},
                {name: 'user1', tokens: 150, betsCreated: [], betsParticipated: []},
                {name: 'user2', tokens: 200, betsCreated: [], betsParticipated: []}
            ];
            
            // Cache the default data
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            console.log('DataStore: Created and cached default users');
            
            return defaultUsers;
        }
    },
    
    // Helper method to refresh users data in the background
    _refreshUsersInBackground: function() {
        setTimeout(async () => {
            try {
                console.log('DataStore: Refreshing users in background');
                const usersSnapshot = await db.collection('users').get({ 
                    source: 'server',
                    cache_bust: Date.now()
                });
                
                const users = usersSnapshot.docs.map(doc => doc.data());
                console.log('DataStore: Successfully refreshed', users.length, 'users in background');
                
                // Update the cache
                localStorage.setItem('users', JSON.stringify(users));
                
                // Notify UI to update if needed
                if (typeof UI !== 'undefined' && UI.updateLeaderboard) {
                    console.log('DataStore: Triggering UI refresh with new user data');
                    UI.updateLeaderboard();
                }
            } catch (error) {
                console.warn('DataStore: Background refresh of users failed:', error);
                // Silently fail - we already have cached data
            }
        }, 5000); // 5 second delay to allow UI to initialize first
    },
    
    // Get a single user by name - more efficient than getting all users
    getUser: async function(username) {
        console.log(`DataStore: Getting user ${username} with universal access`);
        try {
            if (!username) {
                console.error('DataStore: getUser called without username');
                return null;
            }
            
            console.log(`DataStore: Direct fetch for user ${username} from Firestore`);
            
            try {
                // Simply call Firestore directly - our enhanced get() method will handle timeouts and retries
                const userDoc = await db.collection('users').doc(username).get({
                    universal_access: window.UNIVERSAL_ACCESS_TOKEN
                });
                
                if (userDoc.exists) {
                    console.log(`DataStore: Successfully fetched user ${username} from Firestore`);
                    const userData = userDoc.data();
                    
                    // Save to localStorage as a backup
                    try {
                        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                        const userIndex = allUsers.findIndex(u => u.name === username);
                        
                        if (userIndex >= 0) {
                            allUsers[userIndex] = userData;
                        } else {
                            allUsers.push(userData);
                        }
                        
                        localStorage.setItem('users', JSON.stringify(allUsers));
                        console.log(`Cached user ${username} to localStorage`);
                    } catch (cacheError) {
                        console.warn(`Failed to cache user ${username} to localStorage`, cacheError);
                    }
                    
                    return userData;
                }
                
                console.warn(`DataStore: User ${username} not found in Firestore`);
            } catch (firestoreError) {
                console.error(`Error fetching user ${username} from Firestore:`, firestoreError);
            }
            
            // If we reach here, we couldn't fetch from Firestore
            // Check localStorage as fallback
            console.log(`DataStore: Trying localStorage fallback for user ${username}`);
            const cachedUsers = localStorage.getItem('users');
            if (cachedUsers) {
                try {
                    const users = JSON.parse(cachedUsers);
                    const user = users.find(u => u.name === username);
                    if (user) {
                        console.log(`DataStore: Found user ${username} in localStorage`);
                        return user;
                    }
                } catch (parseError) {
                    console.error('Error parsing cached users:', parseError);
                }
            }
            
            // Create a new user if it's supposed to be there but isn't
            if (['admin', 'user1', 'user2'].includes(username)) {
                console.log(`DataStore: Creating default user ${username}`);
                const defaultUser = {
                    name: username,
                    tokens: username === 'admin' ? Infinity : 100,
                    betsCreated: [],
                    betsParticipated: [],
                    isAdmin: username === 'admin'
                };
                
                // Try to save this user to Firestore in the background
                db.collection('users').doc(username).set(defaultUser)
                    .then(() => console.log(`Created default user ${username} in Firestore`))
                    .catch(err => console.warn(`Failed to create default user ${username} in Firestore:`, err));
                    
                return defaultUser;
            }
            
            return null;
        } catch (error) {
            console.error("Error getting user:", error);
            
            // Fall back to localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(user => user.name === username);
            
            // Return user or create default if it's a standard user
            if (user) return user;
            
            if (['admin', 'user1', 'user2'].includes(username)) {
                const defaultUser = {
                    name: username,
                    tokens: username === 'admin' ? Infinity : 100,
                    betsCreated: [],
                    betsParticipated: [],
                    isAdmin: username === 'admin'
                };
                return defaultUser;
            }
            
            return null;
        }
    },
    
    saveUsers: async function(users) {
        try {
            // Create a batch write
            const batch = db.batch();
            
            // Add each user to the batch
            for (const user of users) {
                const userRef = db.collection('users').doc(user.name);
                batch.set(userRef, user);
            }
            
            // Commit the batch
            await batch.commit();
            
            // Also update localStorage as backup
            localStorage.setItem('users', JSON.stringify(users));
        } catch (error) {
            console.error("Error saving users:", error);
            // Fall back to localStorage if Firebase fails
            localStorage.setItem('users', JSON.stringify(users));
        }
    },
    
    // Get the current user
    getCurrentUser: function() {
        try {
            // First try to get from localStorage
            const localUser = JSON.parse(localStorage.getItem('currentUser'));
            if (localUser) {
                // If we have a user in localStorage, check if it's admin and ensure it has proper admin properties
                if (localUser.name === 'admin') {
                    // Always ensure admin has the correct properties
                    localUser.isAdmin = true;
                    localUser.tokens = Infinity;
                    if (!localUser.betsCreated) localUser.betsCreated = [];
                    if (!localUser.betsParticipated) localUser.betsParticipated = [];
                    
                    // Update localStorage with corrected admin data
                    localStorage.setItem('currentUser', JSON.stringify(localUser));
                }
                
                // For all users, ensure required properties exist
                if (!localUser.betsCreated) localUser.betsCreated = [];
                if (!localUser.betsParticipated) localUser.betsParticipated = [];
                
                // Return the user from localStorage immediately
                return localUser;
            }
            
            // If not in localStorage, return null - we'll handle Firebase auth separately
            console.error("No user found in localStorage");
            return null;
        } catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    },
    
    // Set the current user
    setCurrentUser: function(user) {
        if (!user) return;
        
        // Store in localStorage for persistence
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Also try to store in Firestore if it's not already there
        if (user.name) {
            db.collection('users').doc(user.name).get()
                .then(doc => {
                    if (!doc.exists) {
                        // Create user document in Firestore
                        db.collection('users').doc(user.name).set(user)
                            .catch(error => console.error("Error creating user in Firestore:", error));
                    }
                })
                .catch(error => console.error("Error checking user in Firestore:", error));
        }
    },
    
    // Comprehensive logout function
    logout: function() {
        console.log('DataStore.logout called');
        
        // Generate a new cache bust value for the next login
        if (window.CACHE_BUST) {
            window.CACHE_BUST = Date.now();
            console.log('Updated cache bust parameter to:', window.CACHE_BUST);
        }
        
        // Force clear all caches before logout
        this.clearAllCaches();
        
        // Clear user data
        this.clearCurrentUser();
        
        // Then try to sign out from Firebase Auth (don't wait for it)
        try {
            if (auth && typeof auth.signOut === 'function') {
                auth.signOut()
                    .then(() => {
                        console.log('Firebase Auth signOut successful');
                    })
                    .catch(error => {
                        console.error('Firebase Auth signOut error:', error);
                    });
            }
        } catch (e) {
            console.error('Error calling Firebase Auth signOut:', e);
        }
        
        // Return true to indicate logout was attempted
        return true;
    },
    
    // Clear all caches comprehensively
    clearAllCaches: function() {
        console.log('Clearing all caches before user switch');
        
        // Clear localStorage cache
        localStorage.removeItem('activeBets');
        localStorage.removeItem('resolvedBets');
        localStorage.removeItem('users');
        
        // Clear sessionStorage cache
        sessionStorage.clear();
        
        // Try to clear Firebase caches
        try {
            // Create a Promise that resolves after clearing cache
            const clearPromise = new Promise((resolve) => {
                // Clear any Firestore cache via IndexedDB
                if (window.indexedDB) {
                    console.log('Attempting to clear IndexedDB caches');
                    
                    // Try to delete the Firestore database
                    const deleteRequest = indexedDB.deleteDatabase('firebaseLocalStorageDb');
                    
                    deleteRequest.onsuccess = function() {
                        console.log('Successfully cleared IndexedDB cache');
                        resolve(true);
                    };
                    
                    deleteRequest.onerror = function(event) {
                        console.error('Error clearing IndexedDB cache:', event);
                        resolve(false);
                    };
                } else {
                    resolve(false);
                }
            });
            
            // Wait briefly for the cache clearing to complete
            setTimeout(() => {
                console.log('Cache clearing complete');
            }, 500);
            
            return clearPromise;
        } catch (e) {
            console.error('Error during cache clearing:', e);
            return false;
        }
    },
    
    // Clear the current user
    clearCurrentUser: function() {
        try {
            console.log('Clearing current user from DataStore');
            
            // Clear from localStorage
            localStorage.removeItem('currentUser');
            
            // Clear from sessionStorage
            sessionStorage.removeItem('currentUser');
            
            // Clear any other potential storage
            if (window.indexedDB) {
                console.log('Attempting to clear IndexedDB data');
                try {
                    indexedDB.deleteDatabase('firebaseLocalStorageDb');
                } catch (e) {
                    console.warn('Error clearing IndexedDB:', e);
                }
            }
            
            console.log('User data cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing user data:', error);
            // Last resort attempt
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) {
                console.error('Failed to clear storage:', e);
            }
            return false;
        }
    },
    
    isCurrentUserAdmin: function() {
        const currentUser = this.getCurrentUser();
        return currentUser && currentUser.isAdmin;
    },
    
    // Enhanced authenticateUser function to handle user switching
    authenticateUser: async function(username, password) {
        console.log(`Authenticating user: ${username}`);
        
        // Check if we're switching users
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.name !== username) {
            console.log(`Switching users from ${currentUser.name} to ${username}`);
            this._afterUserSwitch = true;
            
            // Force a fresh cache-bust value
            window.CACHE_BUST = Date.now();
            console.log('Updated cache bust parameter for user switch:', window.CACHE_BUST);
            
            // Clear caches preemptively
            await this.clearAllCaches();
        }
        
        try {
            // Force server fetch for the user document
            console.log(`Fetching user document for ${username} from server`);
            const userDoc = await db.collection('users').doc(username).get({
                source: 'server',
                cache_bust: window.CACHE_BUST || Date.now()
            });
            
            if (!userDoc.exists) {
                return { success: false, message: 'User not found' };
            }
            
            const user = userDoc.data();
            
            if (user.password !== password) {
                return { success: false, message: 'Incorrect password' };
            }
            
            // Set current user (without password)
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            this.setCurrentUser(userWithoutPassword);
            
            return { success: true, user: userWithoutPassword };
        } catch (error) {
            console.error("Error authenticating user:", error);
            // Fall back to localStorage if Firebase fails
            return this.authenticateUserLocal(username, password);
        }
    },
    
    // Fallback to localStorage for authentication
    authenticateUserLocal: function(username, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
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
    
    createUser: async function(name, password) {
        try {
            // Check if user already exists
            const userDoc = await db.collection('users').doc(name).get();
            
            if (userDoc.exists) {
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
            
            await db.collection('users').doc(name).set(newUser);
            
            // Add initial balance history entry
            await this.addBalanceHistoryEntry(name, 100, 'Initial balance');
            
            // Return user without password
            const userWithoutPassword = { ...newUser };
            delete userWithoutPassword.password;
            
            return { success: true, user: userWithoutPassword };
        } catch (error) {
            console.error("Error creating user:", error);
            // Fall back to localStorage if Firebase fails
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if user already exists
            if (users.some(user => user.name === name)) {
                return { success: false, message: 'User already exists' };
            }
            
            // Create new user with initial tokens
            const newUser = {
                name: name,
                password: password,
                tokens: 100,
                betsCreated: [],
                betsParticipated: [],
                isAdmin: name === 'admin'
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Return user without password
            const userWithoutPassword = { ...newUser };
            delete userWithoutPassword.password;
            
            return { success: true, user: userWithoutPassword };
        }
    },
    
    updateUser: async function(updatedUser) {
        try {
            // Check if user exists
            const userDoc = await db.collection('users').doc(updatedUser.name).get();
            
            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }
            
            const existingUser = userDoc.data();
            
            // Preserve admin status and password if not provided
            updatedUser.isAdmin = existingUser.isAdmin || updatedUser.name === 'admin';
            if (!updatedUser.password) {
                updatedUser.password = existingUser.password;
            }
            
            // Ensure admin always has infinite tokens
            if (updatedUser.name === 'admin') {
                updatedUser.tokens = Infinity;
            }
            
            await db.collection('users').doc(updatedUser.name).set(updatedUser);
            
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
        } catch (error) {
            console.error("Error updating user:", error);
            // Fall back to localStorage if Firebase fails
            const users = JSON.parse(localStorage.getItem('users') || '[]');
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
            localStorage.setItem('users', JSON.stringify(users));
            
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
        }
    },
    
    deleteUser: async function(username) {
        try {
            // Don't allow deleting the admin user
            if (username === 'admin') {
                return { success: false, message: 'Cannot delete the admin user' };
            }
            
            // Check if user exists
            const userDoc = await db.collection('users').doc(username).get();
            
            if (!userDoc.exists) {
                return { success: false, message: 'User not found' };
            }
            
            await db.collection('users').doc(username).delete();
            
            // If the deleted user was the current user, log out
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.name === username) {
                this.clearCurrentUser();
            }
            
            return { success: true, message: `User ${username} has been deleted` };
        } catch (error) {
            console.error("Error deleting user:", error);
            // Fall back to localStorage if Firebase fails
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const initialCount = users.length;
            const filteredUsers = users.filter(user => user.name !== username);
            
            if (filteredUsers.length === initialCount) {
                return { success: false, message: 'User not found' };
            }
            
            localStorage.setItem('users', JSON.stringify(filteredUsers));
            
            // If the deleted user was the current user, log out
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.name === username) {
                this.clearCurrentUser();
            }
            
            return { success: true, message: `User ${username} has been deleted` };
        }
    },
    
    addTokensToUser: async function(username, amount) {
        try {
            if (username === 'admin') {
                return { success: false, message: 'Cannot modify admin tokens' };
            }
            
            amount = parseInt(amount);
            if (isNaN(amount) || amount <= 0) {
                return { success: false, message: 'Amount must be a positive number' };
            }
            
            // Get the user document
            const userDoc = await db.collection('users').doc(username).get();
            
            if (!userDoc.exists) {
                return { success: false, message: 'User not found' };
            }
            
            const user = userDoc.data();
            const newBalance = user.tokens + amount;
            
            // Update the user's tokens
            await db.collection('users').doc(username).update({ tokens: newBalance });
            
            // Add balance history entry
            await this.addBalanceHistoryEntry(username, amount, 'Admin added tokens');
            
            // Update current user if it's the same user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.name === username) {
                currentUser.tokens = newBalance;
                this.setCurrentUser(currentUser);
            }
            
            return { 
                success: true, 
                message: `Added ${amount} tokens to ${username}`,
                newBalance: newBalance
            };
        } catch (error) {
            console.error("Error adding tokens to user:", error);
            // Fall back to localStorage if Firebase fails
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(user => user.name === username);
            
            if (userIndex === -1) {
                return { success: false, message: 'User not found' };
            }
            
            users[userIndex].tokens += amount;
            localStorage.setItem('users', JSON.stringify(users));
            
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
        }
    },
    
    removeTokensFromUser: async function(username, amount) {
        try {
            // Get the user document
            const userDoc = await db.collection('users').doc(username).get();
            
            if (!userDoc.exists) {
                return { success: false, message: 'User not found' };
            }
            
            const user = userDoc.data();
            
            // Don't modify admin tokens
            if (user.isAdmin) {
                return { success: false, message: 'Cannot modify admin tokens' };
            }
            
            amount = parseInt(amount);
            if (isNaN(amount) || amount <= 0) {
                return { success: false, message: 'Amount must be a positive number' };
            }
            
            if (user.tokens < amount) {
                return { success: false, message: 'User does not have enough tokens' };
            }
            
            const newBalance = user.tokens - amount;
            
            // Update the user's tokens
            await db.collection('users').doc(username).update({ tokens: newBalance });
            
            // Add balance history entry
            await this.addBalanceHistoryEntry(username, -amount, 'Admin removed tokens');
            
            // Update current user if it's the same user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.name === username) {
                currentUser.tokens = newBalance;
                this.setCurrentUser(currentUser);
            }
            
            return { 
                success: true, 
                message: `Removed ${amount} tokens from ${username}`,
                newBalance: newBalance
            };
        } catch (error) {
            console.error("Error removing tokens from user:", error);
            // Fall back to localStorage if Firebase fails
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(user => user.name === username);
            
            if (userIndex === -1) {
                return { success: false, message: 'User not found' };
            }
            
            // Don't modify admin tokens
            if (users[userIndex].isAdmin) {
                return { success: false, message: 'Cannot modify admin tokens' };
            }
            
            amount = parseInt(amount);
            if (isNaN(amount) || amount <= 0) {
                return { success: false, message: 'Amount must be a positive number' };
            }
            
            if (users[userIndex].tokens < amount) {
                return { success: false, message: 'User does not have enough tokens' };
            }
            
            users[userIndex].tokens -= amount;
            localStorage.setItem('users', JSON.stringify(users));
            
            // Add entry to balance history
            this.addBalanceHistoryEntry(username, -amount, 'Admin removed tokens');
            
            // Update current user if it's the same user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.name === username) {
                currentUser.tokens = users[userIndex].tokens;
                this.setCurrentUser(currentUser);
            }
            
            return { 
                success: true, 
                message: `Removed ${amount} tokens from ${username}`,
                newBalance: users[userIndex].tokens
            };
        }
    },
    
    // Bet Management
    getBets: async function() {
        try {
            const snapshot = await db.collection('bets').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error("Error getting bets:", error);
            // Fall back to localStorage if Firebase fails
            return JSON.parse(localStorage.getItem('bets') || '[]');
        }
    },
    
    saveBets: async function(bets) {
        try {
            // Create a batch write
            const batch = db.batch();
            
            // Add each bet to the batch
            for (const bet of bets) {
                const betRef = db.collection('bets').doc(bet.id);
                batch.set(betRef, bet);
            }
            
            // Commit the batch
            await batch.commit();
            
            // Also update localStorage as backup
            localStorage.setItem('bets', JSON.stringify(bets));
        } catch (error) {
            console.error("Error saving bets:", error);
            // Fall back to localStorage if Firebase fails
            localStorage.setItem('bets', JSON.stringify(bets));
        }
    },
    
    getBetById: async function(betId) {
        try {
            const betDoc = await db.collection('bets').doc(betId).get();
            
            if (!betDoc.exists) {
                return null;
            }
            
            return betDoc.data();
        } catch (error) {
            console.error("Error getting bet by ID:", error);
            // Fall back to localStorage if Firebase fails
            const bets = JSON.parse(localStorage.getItem('bets') || '[]');
            return bets.find(bet => bet.id === betId) || null;
        }
    },
    
    getActiveBets: async function() {
        console.log('DataStore: Getting active bets');
        
        try {
            // Add more detailed logging
            console.log('DataStore: Attempting to fetch active bets from Firestore');
            
            // Check if db is defined
            if (!db) {
                console.error('DataStore: Firestore db is not initialized');
                throw new Error('Firestore db is not initialized');
            }
            
            // Try to fetch from server first with a shorter timeout
            const fetchPromise = db.collection('bets')
                .where('status', '==', 'open')
                .get({ source: 'server' });
                
            // Set a timeout to prevent long waits
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore query timeout')), 5000)
            );
            
            // Race the fetch against the timeout
            const snapshot = await Promise.race([fetchPromise, timeoutPromise])
                .catch(async (error) => {
                    console.warn('Server fetch timed out or failed, trying cache:', error);
                    // Fall back to cache if server fetch fails or times out
                    return await db.collection('bets')
                        .where('status', '==', 'open')
                        .get({ source: 'cache' });
                });
            
            console.log('DataStore: Raw Firestore snapshot for active bets received, docs count:', snapshot?.docs?.length);
            
            if (!snapshot || !snapshot.docs || snapshot.docs.length === 0) {
                console.log('DataStore: No active bets found in Firestore');
                // Try to get from localStorage if Firestore returns empty
                const cachedActiveBets = localStorage.getItem('activeBets');
                if (cachedActiveBets) {
                    const parsedBets = JSON.parse(cachedActiveBets);
                    console.log('DataStore: Retrieved', parsedBets.length, 'active bets from localStorage cache');
                    return parsedBets;
                }
                return [];
            }
            
            const bets = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('DataStore: Loaded active bet with ID:', doc.id);
                return data;
            });
            
            console.log('DataStore: Retrieved', bets.length, 'active bets from Firestore');
            
            // Cache the bets in localStorage as backup
            localStorage.setItem('activeBets', JSON.stringify(bets));
            console.log('DataStore: Cached active bets in localStorage');
            
            return bets;
        } catch (error) {
            console.error("Error getting active bets:", error);
            
            // Fall back to localStorage
            console.log('DataStore: Falling back to localStorage for active bets');
            const cachedActiveBets = localStorage.getItem('activeBets');
            if (cachedActiveBets) {
                const parsedBets = JSON.parse(cachedActiveBets);
                console.log('DataStore: Retrieved', parsedBets.length, 'active bets from localStorage cache');
                return parsedBets;
            }
            
            // Return empty array if nothing found
            return [];
        }
    },
    
    getResolvedBets: async function() {
        console.log('DataStore: Getting resolved bets');
        
        try {
            // Add more detailed logging
            console.log('DataStore: Attempting to fetch resolved bets from Firestore');
            
            // Check if db is defined
            if (!db) {
                console.error('DataStore: Firestore db is not initialized');
                throw new Error('Firestore db is not initialized');
            }
            
            // Try to fetch from server first with a shorter timeout
            const fetchPromise = db.collection('bets')
                .where('status', '==', 'resolved')
                .get({ source: 'server' });
                
            // Set a timeout to prevent long waits
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore query timeout')), 5000)
            );
            
            // Race the fetch against the timeout
            const snapshot = await Promise.race([fetchPromise, timeoutPromise])
                .catch(async (error) => {
                    console.warn('Server fetch timed out or failed, trying cache:', error);
                    // Fall back to cache if server fetch fails or times out
                    return await db.collection('bets')
                        .where('status', '==', 'resolved')
                        .get({ source: 'cache' });
                });
            
            console.log('DataStore: Raw Firestore snapshot for resolved bets received, docs count:', snapshot?.docs?.length);
            
            if (!snapshot || !snapshot.docs || snapshot.docs.length === 0) {
                console.log('DataStore: No resolved bets found in Firestore');
                // Try to get from localStorage if Firestore returns empty
                const cachedResolvedBets = localStorage.getItem('resolvedBets');
                if (cachedResolvedBets) {
                    const parsedBets = JSON.parse(cachedResolvedBets);
                    console.log('DataStore: Retrieved', parsedBets.length, 'resolved bets from localStorage cache');
                    return parsedBets;
                }
                return [];
            }
            
            const bets = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('DataStore: Loaded resolved bet with ID:', doc.id);
                return data;
            });
            
            console.log('DataStore: Retrieved', bets.length, 'resolved bets from Firestore');
            
            // Cache the bets in localStorage as backup
            localStorage.setItem('resolvedBets', JSON.stringify(bets));
            console.log('DataStore: Cached resolved bets in localStorage');
            
            return bets;
        } catch (error) {
            console.error("Error getting resolved bets:", error);
            
            // Fall back to localStorage
            console.log('DataStore: Falling back to localStorage for resolved bets');
            const cachedResolvedBets = localStorage.getItem('resolvedBets');
            if (cachedResolvedBets) {
                const parsedBets = JSON.parse(cachedResolvedBets);
                console.log('DataStore: Retrieved', parsedBets.length, 'resolved bets from localStorage cache');
                return parsedBets;
            }
            
            // Return empty array if nothing found
            return [];
        }
    },
    
    saveBet: async function(bet) {
        try {
            await db.collection('bets').doc(bet.id).set(bet);
            return { success: true, bet: bet };
        } catch (error) {
            console.error("Error saving bet:", error);
            // Fall back to localStorage if Firebase fails
            const bets = JSON.parse(localStorage.getItem('bets') || '[]');
            const index = bets.findIndex(b => b.id === bet.id);
            
            if (index !== -1) {
                bets[index] = bet;
            } else {
                bets.push(bet);
            }
            
            localStorage.setItem('bets', JSON.stringify(bets));
            return { success: true, bet: bet };
        }
    },
    
    // Add this function to the DataStore object
    clearAllData: async function() {
        try {
            // Check if current user is admin
            if (!this.isCurrentUserAdmin()) {
                return { success: false, message: 'Only admin can reset all data' };
            }
            
            // Delete all users except admin
            const usersSnapshot = await db.collection('users').get();
            const batch = db.batch();
            
            usersSnapshot.docs.forEach(doc => {
                if (doc.id !== 'admin') {
                    batch.delete(doc.ref);
                }
            });
            
            // Delete all bets
            const betsSnapshot = await db.collection('bets').get();
            betsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Commit the batch
            await batch.commit();
            
            // Create admin user
            const adminUser = {
                name: 'admin',
                password: '1234',
                tokens: Infinity,
                betsCreated: [],
                betsParticipated: [],
                isAdmin: true
            };
            
            // Save admin user
            await db.collection('users').doc('admin').set(adminUser);
            
            // Set current user to admin
            this.setCurrentUser(adminUser);
            
            // Clear localStorage backup
            localStorage.removeItem('users');
            localStorage.removeItem('bets');
            
            console.log('All data has been cleared and reset');
            return { success: true, message: 'All data has been reset' };
        } catch (error) {
            console.error("Error clearing all data:", error);
            // Fall back to localStorage if Firebase fails
            return this.clearAllDataLocal();
        }
    },
    
    // Fallback to localStorage for clearing data
    clearAllDataLocal: function() {
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
        localStorage.setItem('users', JSON.stringify([adminUser]));
        
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
    getBalanceHistory: async function(username) {
        try {
            const snapshot = await db.collection('balanceHistory')
                .where('username', '==', username)
                .orderBy('timestamp', 'desc')
                .get();
            
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error("Error getting balance history:", error);
            // Fall back to localStorage if Firebase fails
            return JSON.parse(localStorage.getItem(`balanceHistory_${username}`) || '[]');
        }
    },
    
    addBalanceHistoryEntry: async function(username, amount, description) {
        try {
            // Get current user's balance
            const userDoc = await db.collection('users').doc(username).get();
            
            if (!userDoc.exists) return;
            
            const user = userDoc.data();
            
            const entry = {
                username: username,
                timestamp: new Date().toISOString(),
                amount: amount,
                description: description,
                balance: user.tokens
            };
            
            // Generate a unique ID for the entry
            const entryId = `${username}_${Date.now()}`;
            
            // Save to Firestore
            await db.collection('balanceHistory').doc(entryId).set(entry);
            
            // Also update localStorage as backup
            const history = JSON.parse(localStorage.getItem(`balanceHistory_${username}`) || '[]');
            history.push(entry);
            localStorage.setItem(`balanceHistory_${username}`, JSON.stringify(history));
        } catch (error) {
            console.error("Error adding balance history entry:", error);
            // Fall back to localStorage if Firebase fails
            const history = JSON.parse(localStorage.getItem(`balanceHistory_${username}`) || '[]');
            const user = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.name === username);
            
            if (!user) return;
            
            const entry = {
                username: username,
                timestamp: new Date().toISOString(),
                amount: amount,
                description: description,
                balance: user.tokens
            };
            
            history.push(entry);
            localStorage.setItem(`balanceHistory_${username}`, JSON.stringify(history));
        }
    },
    
    addTokens: async function(username, amount) {
        try {
            const user = await this.getUser(username);
            if (!user) {
                return { success: false, message: 'User not found' };
            }
            
            // Add tokens
            user.tokens += amount;
            
            // Update user in Firestore
            await db.collection('users').doc(username).update({
                tokens: user.tokens
            });
            
            // Add to balance history
            await this.addBalanceHistoryEntry(username, amount, 'Admin added tokens');
            
            return { 
                success: true, 
                newBalance: user.tokens 
            };
        } catch (error) {
            console.error("Error adding tokens:", error);
            return { success: false, message: 'Error adding tokens: ' + error.message };
        }
    },
    
    removeTokens: async function(username, amount) {
        try {
            const user = await this.getUser(username);
            if (!user) {
                return { success: false, message: 'User not found' };
            }
            
            // Calculate how many tokens to actually remove
            const tokensToRemove = Math.min(user.tokens, amount);
            
            // Remove tokens
            user.tokens -= tokensToRemove;
            
            // Update user in Firestore
            await db.collection('users').doc(username).update({
                tokens: user.tokens
            });
            
            // Add to balance history
            await this.addBalanceHistoryEntry(username, -tokensToRemove, 'Admin removed tokens');
            
            return { 
                success: true, 
                tokensRemoved: tokensToRemove,
                newBalance: user.tokens 
            };
        } catch (error) {
            console.error("Error removing tokens:", error);
            return { success: false, message: 'Error removing tokens: ' + error.message };
        }
    },
    
    clearCacheAndReload: async function() {
        console.log('Clearing all caches and reloading data');
        
        // Clear IndexedDB cache
        if (window.indexedDB) {
            try {
                console.log('Clearing IndexedDB database');
                indexedDB.deleteDatabase('firebaseLocalStorageDb');
            } catch (e) {
                console.error('Error clearing IndexedDB:', e);
            }
        }
        
        // Clear Firestore cache
        try {
            if (db && db.clearPersistence) {
                console.log('Clearing Firestore persistence');
                await db.clearPersistence().catch(err => {
                    console.error('Error clearing Firestore persistence:', err);
                });
            }
        } catch (e) {
            console.error('Error accessing Firestore clearPersistence:', e);
        }
        
        // Clear localStorage cache for bets
        localStorage.removeItem('bets');
        
        // Clear sessionStorage cache
        sessionStorage.clear();
        
        return true;
    },

    // Function to ensure test data exists for development environment
    createTestDataIfNeeded: async function() {
        console.log('Checking if test data needs to be created');
        
        try {
            // Only create test data in development environment
            if (!(location.hostname === "localhost" || 
                  location.hostname === "127.0.0.1" || 
                  location.hostname.includes("web.app"))) {
                console.log('Not in development environment, skipping test data creation');
                return;
            }
            
            console.log('In development environment, checking if we need test data');
            
            // Check if any users besides admin exist
            const users = await this.getUsers();
            const nonAdminUsers = users.filter(user => !user.isAdmin && user.name !== 'admin');
            
            console.log(`Found ${nonAdminUsers.length} non-admin users`);
            
            // If no non-admin users, create test users
            if (nonAdminUsers.length === 0) {
                console.log('Creating test users');
                
                // Create a few test users with some tokens
                const testUsers = [
                    {name: 'user1', password: 'password', tokens: 150, isAdmin: false},
                    {name: 'user2', password: 'password', tokens: 200, isAdmin: false},
                    {name: 'user3', password: 'password', tokens: 100, isAdmin: false}
                ];
                
                for (const user of testUsers) {
                    await this.createUser(user.name, user.password);
                    // Adjust tokens to match our desired values (createUser gives 100 by default)
                    if (user.tokens !== 100) {
                        await this.addTokensToUser(user.name, user.tokens - 100);
                    }
                }
                
                console.log('Test users created');
            }
            
            // Check if any bets exist
            const activeBets = await this.getActiveBets();
            const resolvedBets = await this.getResolvedBets();
            
            console.log(`Found ${activeBets.length} active bets and ${resolvedBets.length} resolved bets`);
            
            // If no bets at all, create some test bets
            if (activeBets.length === 0 && resolvedBets.length === 0) {
                console.log('Creating test bets');
                
                // Get admin user
                const admin = users.find(u => u.name === 'admin' || u.isAdmin);
                
                if (!admin) {
                    console.error('Admin user not found, cannot create test bets');
                    return;
                }
                
                // Create a couple of test bets
                const testBets = [
                    {
                        id: 'test-bet-1',
                        description: 'Will it rain tomorrow?',
                        creator: admin.name,
                        options: ['Yes', 'No'],
                        status: 'open',
                        createdAt: new Date().toISOString(),
                        deadline: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
                        stake: 10,
                        participants: {}
                    },
                    {
                        id: 'test-bet-2',
                        description: 'Who will win the game tonight?',
                        creator: admin.name,
                        options: ['Team A', 'Team B', 'Draw'],
                        status: 'open',
                        createdAt: new Date().toISOString(),
                        deadline: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
                        stake: 20,
                        participants: {}
                    },
                    {
                        id: 'test-bet-3',
                        description: 'What will the high temperature be?',
                        creator: admin.name,
                        options: ['Below 70°F', '70-80°F', 'Above 80°F'],
                        status: 'resolved',
                        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                        deadline: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                        resolvedAt: new Date().toISOString(),
                        stake: 15,
                        participants: {
                            'user1': 'Below 70°F',
                            'user2': 'Above 80°F'
                        },
                        winningOption: 'Above 80°F',
                        winners: ['user2']
                    }
                ];
                
                // Save the test bets
                for (const bet of testBets) {
                    await this.saveBet(bet);
                }
                
                // Update admin user's betsCreated array
                admin.betsCreated = testBets.map(bet => bet.id);
                await this.updateUser(admin);
                
                // Update user2's bets if it exists
                const user2 = users.find(u => u.name === 'user2');
                if (user2) {
                    user2.betsParticipated = ['test-bet-3'];
                    await this.updateUser(user2);
                }
                
                // Update user1's bets if it exists
                const user1 = users.find(u => u.name === 'user1');
                if (user1) {
                    user1.betsParticipated = ['test-bet-3'];
                    await this.updateUser(user1);
                }
                
                console.log('Test bets created');
            }
            
            console.log('Test data check complete');
            return true;
        } catch (error) {
            console.error('Error creating test data:', error);
            return false;
        }
    },

    // Add this at the bottom of the DataStore object before the closing }
    forceFirestoreRefresh: async function() {
        console.log('Forcing a Firestore refresh...');
        
        try {
            // Clear any cached data
            localStorage.removeItem('activeBets');
            localStorage.removeItem('resolvedBets');
            localStorage.removeItem('users');
            
            // Try direct access with no caching
            const betsSnapshot = await db.collection('bets').get({ source: 'server' });
            console.log('Direct Firestore access - bets:', betsSnapshot.size);
            
            const usersSnapshot = await db.collection('users').get({ source: 'server' });
            console.log('Direct Firestore access - users:', usersSnapshot.size);
            
            // Cache the results
            if (betsSnapshot.size > 0) {
                const allBets = betsSnapshot.docs.map(doc => doc.data());
                const activeBets = allBets.filter(bet => bet.status === 'open');
                const resolvedBets = allBets.filter(bet => bet.status === 'resolved');
                
                localStorage.setItem('activeBets', JSON.stringify(activeBets));
                localStorage.setItem('resolvedBets', JSON.stringify(resolvedBets));
                console.log('Cached', activeBets.length, 'active bets and', resolvedBets.length, 'resolved bets');
            }
            
            if (usersSnapshot.size > 0) {
                const allUsers = usersSnapshot.docs.map(doc => doc.data());
                localStorage.setItem('users', JSON.stringify(allUsers));
                console.log('Cached', allUsers.length, 'users');
            }
            
            // Force UI refresh
            if (typeof UI !== 'undefined') {
                UI.updateLeaderboard();
                UI.renderActiveBets();
                UI.renderResolvedBets();
            }
            
            return {
                success: true,
                betsCount: betsSnapshot.size,
                usersCount: usersSnapshot.size
            };
        } catch (error) {
            console.error('Error during force refresh:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
};
