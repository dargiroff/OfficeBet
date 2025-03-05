// Define updateCreatorOptions in the global scope
function updateCreatorOptions() {
    console.log('Updating creator options');
    const optionInputs = document.querySelectorAll('.bet-option');
    const creatorOptionSelect = document.getElementById('creator-option');
    
    if (!creatorOptionSelect) {
        console.error('Creator option select not found');
        return;
    }
    
    // Store the currently selected value to preserve it if possible
    const currentValue = creatorOptionSelect.value;
    
    // Clear existing options
    creatorOptionSelect.innerHTML = '<option value="">-- Select your option --</option>';
    
    // Add new options
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(option => option !== '');
    
    console.log('Available options:', options);
    
    // If no valid options, just return
    if (options.length === 0) {
        console.log('No valid options found');
        return;
    }
    
    // Add options to the select dropdown
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        creatorOptionSelect.appendChild(optionElement);
        
        // If this was the previously selected option, select it again
        if (option === currentValue) {
            optionElement.selected = true;
        }
    });
    
    // If the previously selected option is no longer available, select the first option
    if (currentValue && !options.includes(currentValue) && options.length > 0) {
        creatorOptionSelect.value = options[0];
    }
    
    console.log('Creator options updated, select now has', creatorOptionSelect.options.length, 'options');
}

// Define the create bet function
function handleCreateBet(e) {
    console.log('Create bet handler called');
    // Prevent the default form submission which would refresh the page
    if (e) e.preventDefault();
    
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) {
        UI.showError('You must be logged in to create a bet');
        return;
    }
    
    const description = document.getElementById('bet-description').value.trim();
    const stakeInput = document.getElementById('bet-stake');
    const stake = parseInt(stakeInput.value);
    const deadline = document.getElementById('bet-deadline').value;
    const creatorOption = document.getElementById('creator-option').value;
    
    console.log('Form values:', {
        description,
        stake,
        deadline,
        creatorOption
    });
    
    // Validate description
    if (!description) {
        UI.showError('Please enter a bet description');
        return;
    }
    
    // Get all options
    const optionInputs = document.querySelectorAll('.bet-option');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(option => option !== '');
    
    console.log('Options:', options);
    
    if (options.length < 2) {
        UI.showError('You need at least two options');
        return;
    }
    
    // Skip creator option validation for admin users
    const isAdmin = DataStore.isCurrentUserAdmin();
    if (!isAdmin && !creatorOption) {
        UI.showError('Please select your bet option');
        return;
    }
    
    // Stake validation for all users (including admins)
    if (isNaN(stake) || stake <= 0) {
        UI.showError('Stake must be greater than 0');
        return;
    }
    
    if (!deadline) {
        UI.showError('Please set a deadline');
        return;
    }
    
    // For admin users, if no option is selected, pass null or empty string
    const finalCreatorOption = isAdmin && !creatorOption ? null : creatorOption;
    
    console.log('Creating bet with:', {
        creator: currentUser.name,
        description,
        options,
        stake,
        deadline,
        finalCreatorOption
    });
    
    try {
        const result = BetManager.createBet(
            currentUser.name,
            description,
            options,
            stake, // Use the actual stake value for all users
            deadline,
            finalCreatorOption  // Pass the creator's selected option or null for admin
        );
        
        console.log('Create bet result:', result);
        
        if (result.success) {
            UI.showSuccess('Bet created successfully');
            UI.renderActiveBets();
            UI.renderResolvedBets();
            UI.updateLeaderboard();
            UI.checkUserLoggedIn(); // Update token display
            
            // Reset form
            document.getElementById('bet-description').value = '';
            document.getElementById('bet-stake').value = '';
            document.getElementById('bet-deadline').value = '';
            document.getElementById('creator-option').innerHTML = '<option value="">-- Select your option --</option>';
            document.getElementById('options-container').innerHTML = `
                <div class="option-input">
                    <input type="text" class="bet-option" placeholder="Option 1" required oninput="updateCreatorOptions()">
                    <button type="button" class="remove-option-btn" onclick="removeOption(this)"><i class="fas fa-times"></i></button>
                </div>
                <div class="option-input">
                    <input type="text" class="bet-option" placeholder="Option 2" required oninput="updateCreatorOptions()">
                    <button type="button" class="remove-option-btn" onclick="removeOption(this)"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            // Update creator options
            updateCreatorOptions();
        } else {
            UI.showError(result.message || 'Failed to create bet');
        }
    } catch (error) {
        console.error('Error creating bet:', error);
        UI.showError('An error occurred while creating the bet: ' + error.message);
    }
}

// Function to add a new option
function addOption() {
    console.log('Add option function called');
    const optionsContainer = document.getElementById('options-container');
    const optionCount = optionsContainer.querySelectorAll('.option-input').length;
    
    const optionInput = document.createElement('div');
    optionInput.className = 'option-input';
    optionInput.innerHTML = `
        <input type="text" class="bet-option" placeholder="Option ${optionCount + 1}" required oninput="updateCreatorOptions()">
        <button type="button" class="remove-option-btn" onclick="removeOption(this)"><i class="fas fa-times"></i></button>
    `;
    
    optionsContainer.appendChild(optionInput);
    
    // Update creator options after adding a new option
    updateCreatorOptions();
}

// Function to remove an option
function removeOption(button) {
    console.log('Remove option function called');
    const optionsContainer = document.getElementById('options-container');
    const optionInputs = optionsContainer.querySelectorAll('.option-input');
    
    // Don't allow removing if there are only 2 options
    if (optionInputs.length <= 2) {
        console.log('Cannot remove option: minimum of 2 options required');
        return;
    }
    
    const optionInput = button.closest('.option-input');
    if (optionInput) {
        optionInput.remove();
        
        // Renumber the remaining options
        const options = document.querySelectorAll('.bet-option');
        options.forEach((option, index) => {
            option.placeholder = `Option ${index + 1}`;
        });
        
        // Update creator options after removing an option
        updateCreatorOptions();
    }
}

// Function to resolve a bet
function resolveBet(button) {
    console.log('Resolve bet function called');
    const betId = button.dataset.betId;
    const betCard = button.closest('.bet-card');
    const winningOptionSelect = betCard.querySelector('.winning-option-select');
    const winningOption = winningOptionSelect.value;
    
    if (!winningOption) {
        UI.showError('Please select a winning option');
        return;
    }
    
    console.log('Resolving bet:', betId, 'with winner:', winningOption);
    
    const result = BetManager.resolveBet(betId, winningOption);
    
    if (result.success) {
        UI.showSuccess(result.message || 'Bet resolved successfully!');
        UI.renderActiveBets();
        UI.renderResolvedBets();
        UI.updateLeaderboard();
        UI.checkUserLoggedIn(); // Update token display
    } else {
        UI.showError(result.message || 'Failed to resolve bet');
    }
}

function placeBet(buttonElement) {
    console.log('Place Bet function called');
    const betId = buttonElement.dataset.betId;
    const betCard = buttonElement.closest('.bet-card');
    const optionSelect = betCard.querySelector('.bet-option-select');
    const amountInput = betCard.querySelector('.bet-amount-input');
    
    const selectedOption = optionSelect.value;
    const amount = parseInt(amountInput.value);
    
    if (!selectedOption) {
        UI.showError('Please select an option');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        UI.showError('Please enter a valid amount');
        return;
    }
    
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) {
        UI.showError('You must be logged in to place a bet');
        return;
    }
    
    // Check if user has enough tokens
    if (!currentUser.isAdmin && currentUser.tokens < amount) {
        UI.showError('You do not have enough tokens');
        return;
    }
    
    console.log(`Placing bet: ${betId}, ${selectedOption}, ${amount}`);
    const result = BetManager.placeBet(betId, selectedOption, amount);
    
    if (result.success) {
        UI.showSuccess(result.message || 'Bet placed successfully!');
        UI.renderActiveBets();
        UI.updateLeaderboard();
        UI.checkUserLoggedIn(); // Update token display
    } else {
        UI.showError(result.message || result.error || 'Failed to place bet');
    }
}

// Balance History Modal Functions
function showBalanceHistory() {
    console.log('Showing balance history');
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) {
        UI.showError('You must be logged in to view balance history');
        return;
    }
    
    // Get balance history for the current user
    const history = DataStore.getBalanceHistory(currentUser.name);
    
    // Sort history in reverse chronological order (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Populate the table
    const tableBody = document.getElementById('balance-history-body');
    tableBody.innerHTML = '';
    
    if (history && history.length > 0) {
        // Calculate total transactions
        let totalPositive = 0;
        let totalNegative = 0;
        
        history.forEach(entry => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            // Track totals
            if (entry.amount > 0) {
                totalPositive += entry.amount;
            } else if (entry.amount < 0) {
                totalNegative += Math.abs(entry.amount);
            }
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${entry.description}</td>
                <td class="${entry.amount >= 0 ? 'positive' : 'negative'}">${entry.amount >= 0 ? '+' : ''}${entry.amount}</td>
                <td>${entry.balance}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add a summary row
        const summaryRow = document.createElement('tr');
        summaryRow.classList.add('summary-row');
        summaryRow.innerHTML = `
            <td colspan="2"><strong>Total</strong></td>
            <td>
                <div class="positive">+${totalPositive}</div>
                <div class="negative">-${totalNegative}</div>
                <div class="${totalPositive - totalNegative >= 0 ? 'positive' : 'negative'}">
                    Net: ${totalPositive - totalNegative >= 0 ? '+' : ''}${totalPositive - totalNegative}
                </div>
            </td>
            <td><strong>${currentUser.tokens}</strong></td>
        `;
        tableBody.appendChild(summaryRow);
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No balance history available</td>';
        tableBody.appendChild(row);
    }
    
    // Show the modal
    const modal = document.getElementById('balance-history-modal');
    modal.classList.remove('hidden');
}

function closeBalanceHistoryModal() {
    const modal = document.getElementById('balance-history-modal');
    modal.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    // Check if user is logged in
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) {
        // Redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Check if required objects are available
    if (!DataStore) {
        console.error('DataStore not found');
        return;
    }
    
    if (!BetManager) {
        console.error('BetManager not found');
        return;
    }
    
    if (!UI) {
        console.error('UI not found');
        return;
    }
    
    console.log('All required objects are available');
    
    // Debug function to help diagnose issues
    window.debugApp = function() {
        console.log('=== DEBUG INFO ===');
        console.log('Current User:', DataStore.getCurrentUser());
        console.log('All Users:', DataStore.getUsers());
        console.log('All Bets:', DataStore.getBets());
        console.log('Active Bets:', DataStore.getActiveBets());
        console.log('Resolved Bets:', DataStore.getResolvedBets());
        console.log('Is Admin:', DataStore.isCurrentUserAdmin());
        
        // Debug create bet section
        const createBetSection = document.getElementById('create-bet-section');
        console.log('Create Bet Section:', createBetSection);
        console.log('Create Bet Section Hidden:', createBetSection ? createBetSection.classList.contains('hidden') : 'Not found');
        
        // Debug buttons
        const addOptionBtn = document.getElementById('add-option-btn');
        console.log('Add Option Button:', addOptionBtn);
        
        const createBetBtn = document.getElementById('create-bet-btn');
        console.log('Create Bet Button:', createBetBtn);
        
        console.log('=== END DEBUG INFO ===');
    };
    
    // Call debug function on load
    window.debugApp();
    
    // Initialize UI
    UI.init();
    
    // Call debug function again after UI init
    setTimeout(function() {
        console.log('=== DEBUG INFO AFTER UI INIT ===');
        const createBetSection = document.getElementById('create-bet-section');
        console.log('Create Bet Section Hidden After UI Init:', createBetSection ? createBetSection.classList.contains('hidden') : 'Not found');
        console.log('=== END DEBUG INFO AFTER UI INIT ===');
        
        // Initialize the creator options
        updateCreatorOptions();
        
        // Initialize options - hide remove buttons for first two options
        initializeOptions();
        
        // Log that initialization is complete
        console.log('Form initialization complete');
    }, 500);
    
    // Immediately try to update creator options
    try {
        console.log('Attempting immediate update of creator options');
        updateCreatorOptions();
    } catch (e) {
        console.error('Error during immediate update:', e);
    }
    
    // Logout button event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('Logout button clicked');
            DataStore.clearCurrentUser();
            window.location.href = 'login.html';
        });
    } else {
        console.error('Logout button not found');
    }
    
    // User Management Event Listeners
    document.getElementById('user-select').addEventListener('change', function() {
        const selectedUsername = this.value;
        if (selectedUsername) {
            const users = DataStore.getUsers();
            const selectedUser = users.find(user => user.name === selectedUsername);
            
            if (selectedUser) {
                DataStore.setCurrentUser(selectedUser);
                UI.checkUserLoggedIn();
                
                // Clear and re-render the bets to ensure proper display of betting options
                document.getElementById('active-bets-container').innerHTML = '';
                document.getElementById('resolved-bets-container').innerHTML = '';
                
                UI.renderActiveBets();
                UI.renderResolvedBets();
            }
        }
    });
    
    document.getElementById('create-user-btn').addEventListener('click', function() {
        const nameInput = document.getElementById('new-user-name');
        const username = nameInput.value.trim();
        
        if (username) {
            const result = DataStore.createUser(username);
            
            if (result.success) {
                UI.updateUserSelect();
                UI.updateLeaderboard();
                nameInput.value = '';
                
                // Auto-login the new user
                DataStore.setCurrentUser(result.user);
                UI.checkUserLoggedIn();
                
                // Clear and re-render the bets to ensure proper display of betting options
                document.getElementById('active-bets-container').innerHTML = '';
                document.getElementById('resolved-bets-container').innerHTML = '';
                
                UI.renderActiveBets();
                UI.renderResolvedBets();
            } else {
                UI.showError(result.message || 'Failed to create user');
            }
        } else {
            UI.showError('Please enter a username');
        }
    });
    
    // Make the functions globally accessible
    window.updateCreatorOptions = updateCreatorOptions;
    window.handleCreateBet = handleCreateBet;
    window.addOption = addOption;
    window.removeOption = removeOption;
    window.resolveBet = resolveBet;
    window.placeBet = placeBet;
    window.showBalanceHistory = showBalanceHistory;
    window.closeBalanceHistoryModal = closeBalanceHistoryModal;
    
    // Add event listeners to update creator options when bet options change
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('bet-option')) {
            console.log('Bet option input changed');
            updateCreatorOptions();
        }
    });
    
    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(event) {
        // Handle notification close button clicks
        if (event.target.classList.contains('notification-close')) {
            const notification = event.target.closest('.notification');
            if (notification) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }
        
        // Note: Admin button handlers are now directly attached in UI.updateAdminControls
        // The event delegation below is kept for backward compatibility
        // but with a check to avoid duplicate handling
        
        // Handle admin user management buttons - only if not handled by direct listeners
        if ((event.target.id === 'add-tokens-btn' || event.target.closest('#add-tokens-btn')) && 
            !event.target.hasAttribute('data-event-handled')) {
            
            // Mark as handled to prevent duplicate handling
            event.target.setAttribute('data-event-handled', 'true');
            console.log('Add tokens button clicked via delegation');
            
            const userSelect = document.getElementById('admin-user-select');
            const amountInput = document.getElementById('token-amount');
            const username = userSelect.value;
            const amount = parseInt(amountInput.value);
            
            if (!username) {
                UI.showError('Please select a user');
                return;
            }
            
            if (isNaN(amount) || amount <= 0) {
                UI.showError('Please enter a valid amount');
                return;
            }
            
            const result = DataStore.addTokensToUser(username, amount);
            
            if (result.success) {
                UI.showSuccess(`Added ${amount} tokens to ${username}. New balance: ${result.newBalance} tokens`);
                UI.updateAdminUserSelect();
                UI.updateLeaderboard();
                
                // Update current user display if it's the same user
                const currentUser = DataStore.getCurrentUser();
                if (currentUser && currentUser.name === username) {
                    UI.checkUserLoggedIn();
                }
            } else {
                UI.showError(result.message);
            }
            
            // Clear the amount input
            amountInput.value = '';
        }
        
        if ((event.target.id === 'remove-tokens-btn' || event.target.closest('#remove-tokens-btn')) && 
            !event.target.hasAttribute('data-event-handled')) {
            
            // Mark as handled to prevent duplicate handling
            event.target.setAttribute('data-event-handled', 'true');
            console.log('Remove tokens button clicked via delegation');
            
            const userSelect = document.getElementById('admin-user-select');
            const amountInput = document.getElementById('token-amount');
            const username = userSelect.value;
            const amount = parseInt(amountInput.value);
            
            if (!username) {
                UI.showError('Please select a user');
                return;
            }
            
            if (isNaN(amount) || amount <= 0) {
                UI.showError('Please enter a valid amount');
                return;
            }
            
            const result = DataStore.removeTokensFromUser(username, amount);
            
            if (result.success) {
                // Check if we removed fewer tokens than requested
                if (result.tokensRemoved < amount) {
                    UI.showSuccess(`Removed ${result.tokensRemoved} tokens from ${username} (user only had ${result.tokensRemoved} tokens). New balance: 0 tokens`);
                } else {
                    UI.showSuccess(`Removed ${result.tokensRemoved} tokens from ${username}. New balance: ${result.newBalance} tokens`);
                }
                
                UI.updateAdminUserSelect();
                UI.updateLeaderboard();
                
                // Update current user display if it's the same user
                const currentUser = DataStore.getCurrentUser();
                if (currentUser && currentUser.name === username) {
                    UI.checkUserLoggedIn();
                }
            } else {
                UI.showError(result.message);
            }
            
            // Clear the amount input
            amountInput.value = '';
        }
        
        if ((event.target.id === 'delete-user-btn' || event.target.closest('#delete-user-btn')) && 
            !event.target.hasAttribute('data-event-handled')) {
            
            // Mark as handled to prevent duplicate handling
            event.target.setAttribute('data-event-handled', 'true');
            console.log('Delete user button clicked via delegation');
            
            const userSelect = document.getElementById('admin-user-select');
            const username = userSelect.value;
            
            if (!username) {
                UI.showError('Please select a user');
                return;
            }
            
            // Show confirmation dialog
            if (confirm(`Are you sure you want to delete the user "${username}"? This action cannot be undone.`)) {
                const result = DataStore.deleteUser(username);
                
                if (result.success) {
                    UI.showSuccess(result.message);
                    UI.updateAdminUserSelect();
                    UI.updateLeaderboard();
                    
                    // If the deleted user was the current user, update UI
                    const currentUser = DataStore.getCurrentUser();
                    if (!currentUser) {
                        UI.checkUserLoggedIn();
                    }
                } else {
                    UI.showError(result.message);
                }
            }
        }
        
        // Handle reset data button
        if ((event.target.id === 'reset-data-btn' || event.target.closest('#reset-data-btn')) && 
            !event.target.hasAttribute('data-event-handled')) {
            
            // Mark as handled to prevent duplicate handling
            event.target.setAttribute('data-event-handled', 'true');
            console.log('Reset data button clicked via delegation');
            
            // Check if user is admin
            if (!DataStore.isCurrentUserAdmin()) {
                UI.showError('Only admin can reset all data');
                return;
            }
            
            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                const result = DataStore.resetAllData();
                
                if (result.success) {
                    UI.showSuccess(result.message || 'All data has been reset');
                    
                    // Refresh the UI
                    UI.updateLeaderboard();
                    UI.renderActiveBets();
                    UI.renderResolvedBets();
                    UI.checkUserLoggedIn();
                    UI.updateAdminControls();
                } else {
                    UI.showError(result.message || 'Failed to reset data');
                }
            }
        }
        
        // Handle delete current user button for non-admin users
        if ((event.target.id === 'delete-current-user-btn' || event.target.closest('#delete-current-user-btn')) && 
            !event.target.hasAttribute('data-event-handled')) {
            
            // Mark as handled to prevent duplicate handling
            event.target.setAttribute('data-event-handled', 'true');
            console.log('Delete current user button clicked via delegation');
            
            const currentUser = DataStore.getCurrentUser();
            if (!currentUser) {
                UI.showError('No user is currently logged in');
                return;
            }
            
            // Show confirmation dialog
            if (confirm(`Are you sure you want to delete your account? This action cannot be undone.`)) {
                const result = DataStore.deleteUser(currentUser.name);
                
                if (result.success) {
                    UI.showSuccess(result.message);
                    // Redirect to login page since user is now deleted
                    window.location.href = 'login.html';
                } else {
                    UI.showError(result.message);
                }
            }
        }
    });
    
    // Balance history button
    const balanceHistoryBtn = document.getElementById('balance-history-btn');
    if (balanceHistoryBtn) {
        balanceHistoryBtn.addEventListener('click', showBalanceHistory);
    }
    
    // Close modal button
    const closeModalBtn = document.querySelector('.close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeBalanceHistoryModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('balance-history-modal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeBalanceHistoryModal();
            }
        });
    }
});

// Function to initialize options
function initializeOptions() {
    console.log('Initializing options');
    const optionsContainer = document.getElementById('options-container');
    const optionInputs = optionsContainer.querySelectorAll('.option-input');
    
    // Hide remove buttons for the first two options
    if (optionInputs.length >= 1) {
        const firstRemoveBtn = optionInputs[0].querySelector('.remove-option-btn');
        if (firstRemoveBtn) {
            firstRemoveBtn.classList.add('hidden');
        }
    }
    
    if (optionInputs.length >= 2) {
        const secondRemoveBtn = optionInputs[1].querySelector('.remove-option-btn');
        if (secondRemoveBtn) {
            secondRemoveBtn.classList.add('hidden');
        }
    }
    
    // Make sure any additional options have visible remove buttons
    for (let i = 2; i < optionInputs.length; i++) {
        const removeBtn = optionInputs[i].querySelector('.remove-option-btn');
        if (removeBtn) {
            removeBtn.classList.remove('hidden');
        }
    }
}
