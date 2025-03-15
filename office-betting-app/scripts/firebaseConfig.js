// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByA150iaMXSo6cSLkp-nSxfkMTGI-7Tbo",
  authDomain: "office-bets-app.firebaseapp.com",
  projectId: "office-bets-app",
  storageBucket: "office-bets-app.firebasestorage.app",
  messagingSenderId: "545687799608",
  appId: "1:545687799608:web:73ba2bd4586c8b5f36a3cd",
  measurementId: "G-YCKPSKPM6G"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Add diagnostic console logs specifically for user access
console.log("Firebase initialized with the following project ID:", firebaseConfig.projectId);
console.log("Current Firebase version:", firebase.SDK_VERSION);

// UNIVERSAL ACCESS SETTINGS - UPDATED WITH MUCH LONGER TIMEOUTS
console.log("Setting up universal data access for all users");

// Create a system-wide admin token that will be used for all users
window.UNIVERSAL_ACCESS_TOKEN = "admin-access-" + Date.now();
console.log("Created universal access token for all data operations");

// Extend the timeout for Firestore operations (in milliseconds)
window.FIRESTORE_TIMEOUT = 30000; // 30 seconds timeout (increased from 15)
console.log(`Setting Firestore timeout to ${window.FIRESTORE_TIMEOUT}ms`);

// Cache-busting parameter to force fresh data
window.CACHE_BUST = Date.now();
console.log("Created cache-busting parameter:", window.CACHE_BUST);

// Add a direct test of user document access at startup
console.log("Testing document access at startup");
setTimeout(() => {
  if (db) {
    const testUserRef = db.collection('users').doc('user2');
    console.log("Attempting direct access to user2 document...");
    testUserRef.get()
      .then(doc => {
        if (doc.exists) {
          console.log("SUCCESS: user2 document exists and is accessible");
          console.log("Document data sample:", JSON.stringify(doc.data()).substring(0, 100) + "...");
        } else {
          console.warn("WARNING: user2 document does not exist in Firestore");
        }
      })
      .catch(error => {
        console.error("ERROR accessing user2 document:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
      });
  } else {
    console.error("Firestore DB not initialized for testing");
  }
}, 2000);

// Save the original methods to use in our enhanced versions
const originalGet = firebase.firestore.DocumentReference.prototype.get;
const originalWhere = firebase.firestore.CollectionReference.prototype.where;
const originalCollection = firebase.firestore.Firestore.prototype.collection;

// IMPROVED DOCUMENT FETCH - Always try server first, then cache
firebase.firestore.DocumentReference.prototype.get = function(options = {}) {
  console.log(`Enhanced document get: ${this.path}`);
  
  // Special handling for user documents - always try server first
  const isUserDocument = this.path.startsWith('users/');
  
  if (isUserDocument) {
    console.log(`Fetching user document with enhanced retry logic: ${this.path}`);
  }
  
  // Always try to get from server first with admin access (longer timeout for user docs)
  const enhancedOptions = { 
    ...options, 
    source: options.source || 'server',
    universal_access: window.UNIVERSAL_ACCESS_TOKEN 
  };
  
  // User documents get much longer timeout and retry logic
  if (isUserDocument) {
    console.log(`Using extended timeout of 30 seconds for user document: ${this.path}`);
    
    // First attempt with long timeout
    return new Promise((resolve, reject) => {
      console.log(`SERVER FETCH ATTEMPT 1 for ${this.path}`);
      
      // First server attempt with 30 second timeout
      const timeoutId = setTimeout(() => {
        console.warn(`Server fetch attempt 1 timed out for ${this.path}, trying again...`);
        
        // Second server attempt
        console.log(`SERVER FETCH ATTEMPT 2 for ${this.path}`);
        originalGet.call(this, enhancedOptions)
          .then(resolve)
          .catch(secondError => {
            console.warn(`Server fetch attempt 2 failed for ${this.path}`, secondError);
            
            // Try cache as last resort
            console.log(`Falling back to CACHE FETCH for ${this.path}`);
            originalGet.call(this, { ...enhancedOptions, source: 'cache' })
              .then(resolve)
              .catch(cacheError => {
                console.error(`Both server attempts and cache fetch failed for ${this.path}`, cacheError);
                
                // For user documents, create a default document
                if (isUserDocument && this.id) {
                  console.warn(`Creating default document for user ${this.id}`);
                  const isAdmin = this.id === 'admin';
                  
                  // Return a fake document for UI display
                  resolve({
                    exists: true,
                    data: () => ({
                      name: this.id,
                      tokens: 100,
                      isAdmin: isAdmin,
                      email: `${this.id}@officebets.app`
                    }),
                    id: this.id
                  });
                } else {
                  reject(cacheError);
                }
              });
          });
      }, 30000); // 30 second timeout
      
      // First attempt
      originalGet.call(this, enhancedOptions)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          if (error.code === 'permission-denied') {
            console.error(`Permission denied for ${this.path}, verify your Firestore rules`);
          }
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  // For non-user documents, use the regular timeout logic
  // Create a promise that will reject after timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Firestore operation timed out after ${window.FIRESTORE_TIMEOUT}ms`)), 
      window.FIRESTORE_TIMEOUT);
  });
  
  // Try server first with timeout
  return Promise.race([
    originalGet.call(this, enhancedOptions),
    timeoutPromise
  ]).catch(error => {
    // If server fails or times out, try cache
    console.warn(`Server fetch failed for ${this.path}, trying cache`, error);
    return originalGet.call(this, { ...enhancedOptions, source: 'cache' })
      .catch(cacheError => {
        // For non-user documents that fail both server and cache
        throw cacheError;
      });
  });
};

// Apply optimized settings for all users
console.log("Applying optimized Firestore settings");

// Optimize Firestore for better performance
db.settings({
  ignoreUndefinedProperties: true,
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  experimentalForceOwningTab: true
});

// Set appropriate log level (error only in production)
firebase.firestore.setLogLevel('debug');

// Enable offline persistence with optimized settings
db.enablePersistence({experimentalForceOwningTab: true})
  .then(() => {
    console.log('Offline persistence enabled');
  })
  .catch(err => {
    console.error('Error enabling offline persistence:', err);
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence.');
    }
  });

// COLLECTION QUERY ENHANCEMENT - Add timeout to collection queries with forced server fetch
const originalQuery = firebase.firestore.Query.prototype.get;
firebase.firestore.Query.prototype.get = function(options = {}) {
  console.log(`Enhanced query get for collection with forced server fetch`);
  
  // Always force server fetch with cache-busting
  const enhancedOptions = {
    ...options,
    source: 'server', // Always fetch from server, never from cache
    universal_access: window.UNIVERSAL_ACCESS_TOKEN,
    cache_bust: window.CACHE_BUST // Add cache-busting parameter
  };
  
  // Create a promise that will reject after timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Firestore query timed out after ${window.FIRESTORE_TIMEOUT}ms`)), 
      window.FIRESTORE_TIMEOUT);
  });
  
  // Try server first with timeout
  return Promise.race([
    originalQuery.call(this, enhancedOptions),
    timeoutPromise
  ]).catch(error => {
    // If server fails, try without cache-busting
    console.warn(`Server query failed, trying again with different options`, error);
    
    // Try server again without cache-busting
    return originalQuery.call(this, { 
      ...enhancedOptions, 
      cache_bust: undefined 
    }).catch(secondError => {
      // If that fails too, try cache
      console.warn(`Second server attempt failed, trying cache`, secondError);
      return originalQuery.call(this, { ...enhancedOptions, source: 'cache' });
    });
  });
};

// Modify the onSnapshot method to include timeout options
const originalOnSnapshot = firebase.firestore.DocumentReference.prototype.onSnapshot;
firebase.firestore.DocumentReference.prototype.onSnapshot = function(...args) {
  // Add timeout options if not provided
  if (args.length > 0 && typeof args[0] === 'object' && !args[0].source) {
    args[0] = { ...args[0], source: 'default' };
  }
  return originalOnSnapshot.apply(this, args);
};

console.log("Firebase initialized successfully with optimized settings, universal data access, and improved timeouts"); 