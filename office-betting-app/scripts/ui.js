const UI = {
    init: function() {
        console.log('Initializing UI');
        this.updateLeaderboard();
        this.renderActiveBets();
        this.renderResolvedBets();
        this.checkUserLoggedIn();
        
        // Make sure admin controls are properly initialized
        const currentUser = DataStore.getCurrentUser();
        if (currentUser && currentUser.isAdmin) {
            console.log('Admin user detected, initializing admin controls');
            this.updateAdminControls();
        }
        
        // Initialize creator options for the create bet form
        if (typeof updateCreatorOptions === 'function') {
            updateCreatorOptions();
        }
        
        // Start timer updates for active bets
        this.startTimerUpdates();
    },
    
    // Format time remaining in a smart way
    formatTimeRemaining: function(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const timeDiff = deadlineDate - now;
        
        // If deadline has passed
        if (timeDiff <= 0) {
            return "Deadline passed";
        }
        
        // Calculate time units
        const seconds = Math.floor(timeDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        
        // Format based on time remaining
        if (years > 0) {
            return `${years} year${years > 1 ? 's' : ''} ${months % 12} month${months % 12 !== 1 ? 's' : ''}`;
        } else if (months > 0) {
            return `${months} month${months > 1 ? 's' : ''} ${days % 30} day${days % 30 !== 1 ? 's' : ''}`;
        } else if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hr${hours > 1 ? 's' : ''} ${minutes % 60} min${minutes % 60 !== 1 ? 's' : ''}`;
        } else {
            return `${minutes} min${minutes > 1 ? 's' : ''} ${seconds % 60} sec${seconds % 60 !== 1 ? 's' : ''}`;
        }
    },
    
    // Start timer updates for active bets
    startTimerUpdates: function() {
        // Update timers every minute
        setInterval(() => {
            const timerElements = document.querySelectorAll('.bet-timer span');
            timerElements.forEach(timerElement => {
                const deadline = timerElement.getAttribute('data-deadline');
                if (deadline) {
                    timerElement.textContent = this.formatTimeRemaining(deadline);
                }
            });
        }, 60000); // Update every minute
    },
    
    checkUserLoggedIn: function() {
        const currentUser = DataStore.getCurrentUser();
        const userInfo = document.getElementById('user-info');
        const createBetSection = document.getElementById('create-bet-section');
        const adminControlsSection = document.getElementById('admin-controls');
        
        console.log('Checking if user is logged in:', currentUser);
        
        if (!userInfo) {
            console.error('User info element not found');
        }
        
        if (!createBetSection) {
            console.error('Create bet section not found');
        }
        
        if (!adminControlsSection) {
            console.error('Admin controls section not found');
        }
        
        if (currentUser) {
            console.log('User is logged in:', currentUser.name);
            
            if (userInfo) {
                userInfo.classList.remove('hidden');
            }
            
            if (createBetSection) {
                createBetSection.classList.remove('hidden');
                console.log('Create bet section is now visible');
            }
            
            const userNameElement = document.getElementById('current-user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.name;
                
                // Add admin badge if user is admin
                const existingBadge = userNameElement.querySelector('.admin-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }
                
                if (currentUser.isAdmin) {
                    const adminBadge = document.createElement('span');
                    adminBadge.className = 'admin-badge';
                    adminBadge.textContent = ' (Admin)';
                    adminBadge.style.color = '#ff9500';
                    userNameElement.appendChild(adminBadge);
                }
                
                // Make sure admin controls are updated for all users
                this.updateAdminControls();
            }
            
            const userTokensElement = document.getElementById('current-user-tokens');
            if (userTokensElement) {
                userTokensElement.textContent = currentUser.isAdmin ? '∞' : currentUser.tokens;
            }
            
            // Update stake input for admin users
            this.updateStakeInput(currentUser.isAdmin);
        } else {
            console.log('User is not logged in, redirecting to login page');
            // Redirect to login page if not logged in
            window.location.href = 'login.html';
        }
    },
    
    updateAdminControls: function() {
        const adminControls = document.getElementById('admin-controls');
        const isAdmin = DataStore.isCurrentUserAdmin();
        const currentUser = DataStore.getCurrentUser();
        
        if (currentUser) {
            adminControls.classList.remove('hidden');
            
            if (isAdmin) {
                // Admin user controls
                adminControls.innerHTML = `
                    <h3 class="admin-title"><i class="fas fa-shield-alt icon"></i>Admin Controls</h3>
                    
                    <div class="admin-section">
                        <h4><i class="fas fa-user-plus icon"></i>Create User</h4>
                        <div class="admin-user-creation">
                            <div class="input-group">
                                <input type="text" id="admin-new-username" placeholder="Username">
                                <input type="password" id="admin-new-password" placeholder="Password">
                                <button id="admin-create-user-btn" class="btn btn-primary" data-admin-button="true"><i class="fas fa-plus icon"></i>Create User</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h4><i class="fas fa-users icon"></i>User Management</h4>
                        
                        <div class="admin-user-management">
                            <select id="admin-user-select" class="admin-select">
                                <option value="">-- Select User --</option>
                            </select>
                            
                            <div class="admin-user-actions">
                                <div class="input-group">
                                    <input type="number" id="token-amount" min="1" placeholder="Amount">
                                    <button id="add-tokens-btn" class="btn btn-success" data-admin-button="true"><i class="fas fa-plus icon"></i>Add Tokens</button>
                                    <button id="remove-tokens-btn" class="btn btn-warning" data-admin-button="true"><i class="fas fa-minus icon"></i>Remove Tokens</button>
                                </div>
                                <button id="delete-user-btn" class="btn btn-danger" data-admin-button="true"><i class="fas fa-user-slash icon"></i>Delete User</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h4><i class="fas fa-database icon"></i>System Management</h4>
                        <div class="admin-actions">
                            <button id="reset-data-btn" class="btn btn-danger" data-admin-button="true"><i class="fas fa-trash icon"></i>Reset All Data</button>
                        </div>
                    </div>
                    
                    <p class="admin-note">As admin, you can manage users, resolve any bet regardless of deadline, and reset all app data.</p>
                `;
                
                console.log('Admin controls updated, attaching event listeners');
                
                // Populate the admin user select
                this.updateAdminUserSelect();
                
                // Add event listener for admin create user button
                document.getElementById('admin-create-user-btn').addEventListener('click', function() {
                    const username = document.getElementById('admin-new-username').value.trim();
                    const password = document.getElementById('admin-new-password').value;
                    
                    if (!username || !password) {
                        UI.showError('Please enter both username and password');
                        return;
                    }
                    
                    const result = DataStore.createUser(username, password);
                    
                    if (result.success) {
                        UI.showSuccess(`User ${username} created successfully`);
                        UI.updateAdminUserSelect();
                        UI.updateLeaderboard();
                        
                        // Clear inputs
                        document.getElementById('admin-new-username').value = '';
                        document.getElementById('admin-new-password').value = '';
                    } else {
                        UI.showError(result.message);
                    }
                });
                
                // Add direct event listeners for admin buttons
                const addTokensBtn = document.getElementById('add-tokens-btn');
                if (addTokensBtn) {
                    // Add data-event-handled attribute to prevent duplicate handling
                    addTokensBtn.setAttribute('data-event-handled', 'true');
                    addTokensBtn.addEventListener('click', function() {
                        console.log('Add tokens button clicked directly');
                        const userSelect = document.getElementById('admin-user-select');
                        const username = userSelect.value;
                        const amountInput = document.getElementById('token-amount');
                        const amount = parseInt(amountInput.value);
                        
                        if (!username) {
                            UI.showError('Please select a user');
                            return;
                        }
                        
                        if (isNaN(amount) || amount <= 0) {
                            UI.showError('Please enter a valid positive amount');
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
                    });
                }
                
                const removeTokensBtn = document.getElementById('remove-tokens-btn');
                if (removeTokensBtn) {
                    // Add data-event-handled attribute to prevent duplicate handling
                    removeTokensBtn.setAttribute('data-event-handled', 'true');
                    removeTokensBtn.addEventListener('click', function() {
                        console.log('Remove tokens button clicked directly');
                        const userSelect = document.getElementById('admin-user-select');
                        const username = userSelect.value;
                        const amountInput = document.getElementById('token-amount');
                        const amount = parseInt(amountInput.value);
                        
                        if (!username) {
                            UI.showError('Please select a user');
                            return;
                        }
                        
                        if (isNaN(amount) || amount <= 0) {
                            UI.showError('Please enter a valid positive amount');
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
                    });
                }
                
                const deleteUserBtn = document.getElementById('delete-user-btn');
                if (deleteUserBtn) {
                    // Add data-event-handled attribute to prevent duplicate handling
                    deleteUserBtn.setAttribute('data-event-handled', 'true');
                    deleteUserBtn.addEventListener('click', function() {
                        console.log('Delete user button clicked directly');
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
                    });
                }
                
                const resetDataBtn = document.getElementById('reset-data-btn');
                if (resetDataBtn) {
                    // Add data-event-handled attribute to prevent duplicate handling
                    resetDataBtn.setAttribute('data-event-handled', 'true');
                    resetDataBtn.addEventListener('click', function() {
                        console.log('Reset data button clicked directly');
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
                    });
                }
            } else {
                // Non-admin user controls - show only delete user option
                adminControls.innerHTML = `
                    <div class="admin-section">
                        <h4><i class="fas fa-user-cog icon"></i>Account Management</h4>
                        <div class="admin-actions">
                            <button id="delete-current-user-btn" class="btn btn-danger" data-admin-button="true"><i class="fas fa-user-slash icon"></i>Delete User</button>
                        </div>
                        <p class="admin-note">Warning: Deleting your account will permanently remove all your data and cannot be undone.</p>
                    </div>
                `;
                
                // Add event listener for delete current user button
                const deleteCurrentUserBtn = document.getElementById('delete-current-user-btn');
                if (deleteCurrentUserBtn) {
                    // Add data-event-handled attribute to prevent duplicate handling
                    deleteCurrentUserBtn.setAttribute('data-event-handled', 'true');
                    deleteCurrentUserBtn.addEventListener('click', function() {
                        console.log('Delete current user button clicked directly');
                        
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
                    });
                }
            }
        } else {
            adminControls.classList.add('hidden');
        }
    },
    
    updateAdminUserSelect: function() {
        const adminUserSelect = document.getElementById('admin-user-select');
        if (!adminUserSelect) {
            console.error('Admin user select not found');
            return;
        }
        
        console.log('Updating admin user select');
        const users = DataStore.getUsers();
        
        // Clear existing options except the first one
        while (adminUserSelect.options.length > 1) {
            adminUserSelect.remove(1);
        }
        
        // Add non-admin users to select
        users.filter(user => !user.isAdmin).forEach(user => {
            const option = document.createElement('option');
            option.value = user.name;
            option.textContent = `${user.name} (${user.tokens} tokens)`;
            adminUserSelect.appendChild(option);
        });
        
        console.log('Admin user select updated with', adminUserSelect.options.length - 1, 'users');
    },
    
    updateLeaderboard: function() {
        const leaderboardBody = document.getElementById('leaderboard-body');
        const users = DataStore.getUsers();
        const activeBets = DataStore.getActiveBets();
        
        // Skip if leaderboard doesn't exist
        if (!leaderboardBody) return;
        
        // Track staked tokens for each user
        const userStakes = {};
        
        // Calculate stakes from active bets
        activeBets.forEach(bet => {
            // Add creator stake
            if (bet.status === 'open') {
                userStakes[bet.creator] = (userStakes[bet.creator] || 0) + bet.creatorStake;
            }
            
            // Add participant stakes
            if (bet.participants) {
                bet.participants.forEach(participant => {
                    if (bet.status === 'open') {
                        userStakes[participant.name] = (userStakes[participant.name] || 0) + (participant.stake || 0);
                    }
                });
            }
        });
        
        // Filter out admin user and sort users by available tokens (non-staked tokens) descending
        const sortedUsers = [...users]
            .filter(user => !user.isAdmin) // Exclude admin from leaderboard
            .sort((a, b) => b.tokens - a.tokens);
        
        // Clear existing rows
        leaderboardBody.innerHTML = '';
        
        // Add rows for each user
        sortedUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            
            // Add first-place class to the top user
            if (index === 0) {
                row.classList.add('first-place');
            }
            
            const rankCell = document.createElement('td');
            rankCell.className = 'rank';
            rankCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.className = 'username';
            nameCell.textContent = user.name;
            
            const tokensCell = document.createElement('td');
            tokensCell.className = 'tokens';
            const stakedTokens = userStakes[user.name] || 0;
            tokensCell.textContent = `${user.tokens} (${stakedTokens} staked)`;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(tokensCell);
            
            leaderboardBody.appendChild(row);
        });
    },
    
    renderActiveBets: function() {
        const activeBetsContainer = document.getElementById('active-bets-container');
        const bets = DataStore.getBets();
        const activeBets = bets.filter(bet => bet.status === 'open');
        const currentUser = DataStore.getCurrentUser();
        
        // Clear container
        activeBetsContainer.innerHTML = '';
        
        if (activeBets.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = '<i class="fas fa-info-circle icon"></i>No active bets available.';
            activeBetsContainer.appendChild(emptyMessage);
            return;
        }
        
        // Sort bets by deadline (soonest first)
        const sortedBets = [...activeBets].sort((a, b) => {
            return new Date(a.deadline) - new Date(b.deadline);
        });
        
        // Render each bet
        sortedBets.forEach(bet => {
            const betCard = this.createBetCard(bet, currentUser);
            activeBetsContainer.appendChild(betCard);
        });
        
        // Immediately update all timers
        const timerElements = activeBetsContainer.querySelectorAll('.bet-timer span');
        timerElements.forEach(timerElement => {
            const deadline = timerElement.getAttribute('data-deadline');
            if (deadline) {
                timerElement.textContent = this.formatTimeRemaining(deadline);
            }
        });
    },
    
    renderResolvedBets: function() {
        const container = document.getElementById('resolved-bets-container');
        const resolvedBets = DataStore.getResolvedBets();
        const currentUser = DataStore.getCurrentUser();
        
        // Clear container
        container.innerHTML = '';
        
        if (resolvedBets.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No resolved bets available.';
            container.appendChild(emptyMessage);
            return;
        }
        
        // Render each bet
        resolvedBets.forEach(bet => {
            const betCard = this.createBetCard(bet, currentUser);
            container.appendChild(betCard);
        });
    },
    
    createBetCard: function(bet, currentUser) {
        const template = document.getElementById('bet-card-template');
        const betCard = document.importNode(template.content, true).querySelector('.bet-card');
        
        // If currentUser is not provided, try to get it
        if (!currentUser) {
            currentUser = DataStore.getCurrentUser();
        }
        
        // Set data-bet-id attribute for easier access
        betCard.setAttribute('data-bet-id', bet.id);
        
        // Add resolved class if bet is resolved
        if (bet.status === 'resolved') {
            betCard.classList.add('resolved-bet');
        }
        
        // Fill in bet details
        betCard.querySelector('.bet-description').textContent = bet.description;
        betCard.querySelector('.bet-creator span').textContent = bet.creator;
        betCard.querySelector('.bet-stake span').textContent = bet.creatorStake;
        
        const now = new Date();
        let deadlineDate;

        // Ensure proper date parsing
        if (typeof bet.deadline === 'string') {
            deadlineDate = new Date(bet.deadline);
        } else if (bet.deadline instanceof Date) {
            deadlineDate = bet.deadline;
        } else {
            // Fallback if deadline is in an unexpected format
            console.error('Invalid deadline format:', bet.deadline);
            deadlineDate = new Date(0); // Set to epoch time to ensure deadline is considered passed
        }

        const deadlinePassed = now > deadlineDate;
        const isAdmin = DataStore.isCurrentUserAdmin();
        
        // Add status badge
        const betDescriptionElement = betCard.querySelector('.bet-description');
        const statusBadge = document.createElement('span');
        
        if (bet.status === 'resolved') {
            statusBadge.className = 'badge resolved';
            statusBadge.textContent = 'Resolved';
        } else if (deadlinePassed) {
            statusBadge.className = 'badge pending';
            statusBadge.textContent = 'Pending Resolution';
        } else {
            statusBadge.className = 'badge active';
            statusBadge.textContent = 'Active';
        }
        
        betDescriptionElement.appendChild(statusBadge);
        
        betCard.querySelector('.bet-deadline span').textContent = deadlineDate.toLocaleString();
        
        // Add time remaining timer for active bets
        if (bet.status === 'open' && !deadlinePassed) {
            const deadlineElement = betCard.querySelector('.bet-deadline');
            const timerElement = document.createElement('div');
            timerElement.className = 'bet-timer';
            timerElement.innerHTML = `<i class="fas fa-hourglass-half icon"></i>Time remaining: <span data-deadline="${bet.deadline}">${this.formatTimeRemaining(bet.deadline)}</span>`;
            deadlineElement.parentNode.insertBefore(timerElement, deadlineElement.nextSibling);
        }
        
        // Add options
        const optionsList = betCard.querySelector('.options-list');
        bet.options.forEach(option => {
            const li = document.createElement('li');
            
            // Highlight winner if bet is resolved
            if (bet.status === 'resolved' && bet.winner === option) {
                li.classList.add('winner');
                li.textContent = `${option} (WINNER)`;
            } else {
                li.textContent = option;
            }
            
            optionsList.appendChild(li);
        });
        
        // Remove any existing participants section that might be in the template
        const existingParticipantsSection = betCard.querySelector('.bet-participants');
        if (existingParticipantsSection) {
            existingParticipantsSection.remove();
        }
        
        // Add participants
        if (bet.participants && bet.participants.length > 0) {
            const participantsList = document.createElement('ul');
            participantsList.className = 'participants-list';
            
            // Sort participants by timestamp (most recent first)
            const sortedParticipants = [...bet.participants].sort((a, b) => {
                const timeA = new Date(a.timestamp || 0);
                const timeB = new Date(b.timestamp || 0);
                return timeB - timeA; // Descending order (newest first)
            });
            
            // Determine how many participants to show
            const maxVisibleParticipants = 3;
            const participantsToShow = sortedParticipants.slice(0, maxVisibleParticipants);
            const remainingCount = sortedParticipants.length - maxVisibleParticipants;
            
            // Add visible participants
            participantsToShow.forEach(participant => {
                const participantItem = document.createElement('li');
                // Format the timestamp
                const timestamp = participant.timestamp ? new Date(participant.timestamp).toLocaleString() : 'unknown time';
                // Use stake property consistently (or amount if stake is not available)
                const betAmount = participant.stake || participant.amount || 0;
                participantItem.textContent = `${participant.name} bet ${betAmount} tokens on "${participant.option}" on ${timestamp}`;
                participantsList.appendChild(participantItem);
            });
            
            // Add summary for remaining participants if needed
            if (remainingCount > 0) {
                const summaryItem = document.createElement('li');
                summaryItem.className = 'participants-summary';
                summaryItem.textContent = `and ${remainingCount} other bet${remainingCount === 1 ? '' : 's'}`;
                participantsList.appendChild(summaryItem);
            }
            
            const participantsSection = document.createElement('div');
            participantsSection.className = 'bet-participants';
            participantsSection.innerHTML = '<h4>Participants:</h4>';
            participantsSection.appendChild(participantsList);
            betCard.appendChild(participantsSection);
        }
        
        // Add resolved by info if bet is resolved
        if (bet.status === 'resolved' && bet.resolvedBy) {
            const resolvedByInfo = document.createElement('div');
            resolvedByInfo.className = 'bet-resolved-by';
            resolvedByInfo.innerHTML = `<p>Resolved by: <span>${bet.resolvedBy}</span> on ${new Date(bet.resolvedAt).toLocaleString()}</p>`;
            betCard.appendChild(resolvedByInfo);
            
            // Add pot split information
            if (bet.potSplit) {
                const potSplitInfo = document.createElement('div');
                potSplitInfo.className = 'bet-pot-split';
                
                let potSplitHTML = `<h4>Pot Distribution:</h4>`;
                potSplitHTML += `<p>Total pot: <span>${bet.potSplit.totalPot}</span> tokens</p>`;
                
                if (bet.potSplit.winnerCount > 0) {
                    potSplitHTML += `<p>Winning option: "${bet.potSplit.winningOption}"</p>`;
                    
                    // Display winner names with tokens won in a more concise format
                    if (bet.potSplit.winnerNames && bet.potSplit.winnerNames.length > 0) {
                        if (bet.potSplit.winnerNames.length === 1) {
                            // Single winner format: "X won Y tokens"
                            potSplitHTML += `<p><span>${bet.potSplit.winnerNames[0]}</span> won <span>${bet.potSplit.winningsPerWinner}</span> tokens</p>`;
                        } else {
                            // Multiple winners format: "X, Y, Z won N tokens each"
                            potSplitHTML += `<p><span>${bet.potSplit.winnerNames.join(', ')}</span> won <span>${bet.potSplit.winningsPerWinner}</span> tokens each</p>`;
                        }
                    }
                    
                    if (bet.potSplit.houseCollected > 0) {
                        potSplitHTML += `<p>House collected: <span>${bet.potSplit.houseCollected}</span> token${bet.potSplit.houseCollected > 1 ? 's' : ''} (from rounding)</p>`;
                    }
                } else {
                    potSplitHTML += `<p>No winners for this bet. All <span>${bet.potSplit.houseCollected}</span> tokens went to the house.</p>`;
                }
                
                potSplitInfo.innerHTML = potSplitHTML;
                betCard.appendChild(potSplitInfo);
            }
        }
        
        // Add actions based on bet status and user
        const actionsDiv = betCard.querySelector('.bet-actions');
        
        if (bet.status === 'open' && currentUser) {
            // If user is admin, always show resolve button
            if (isAdmin) {
                const resolveForm = document.createElement('div');
                resolveForm.innerHTML = `
                    <h4>Admin: Resolve Bet</h4>
                    <select class="winning-option-select">
                        <option value="">-- Select Winner --</option>
                        ${bet.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                    <button class="resolve-bet-btn" data-bet-id="${bet.id}" onclick="resolveBet(this)">Resolve as Admin</button>
                `;
                actionsDiv.appendChild(resolveForm);
            }
            // If user is not creator and deadline not passed, show place bet form
            else if (currentUser.name !== bet.creator && !deadlinePassed && 
                    !bet.participants.some(p => p.name === currentUser.name)) {
                // Determine the stake amount to use
                let defaultStake = 1;
                
                // Find the creator's stake from participants
                const creatorParticipant = bet.participants.find(p => p.name === bet.creator);
                if (creatorParticipant && creatorParticipant.stake > 0) {
                    defaultStake = creatorParticipant.stake;
                } 
                // If no creator participant found, use the creatorStake property directly
                else if (bet.creatorStake > 0) {
                    defaultStake = bet.creatorStake;
                }
                // If creator's stake is 0 (admin created with no stake), use the first participant's stake
                else if (bet.participants.length > 0) {
                    // Sort participants by timestamp to find the first one
                    const sortedParticipants = [...bet.participants].sort((a, b) => {
                        const timeA = new Date(a.timestamp || 0);
                        const timeB = new Date(b.timestamp || 0);
                        return timeA - timeB; // Ascending order (oldest first)
                    });
                    
                    // Use the first participant's stake if available
                    if (sortedParticipants[0] && sortedParticipants[0].stake > 0) {
                        defaultStake = sortedParticipants[0].stake;
                    }
                }
                
                // Ensure the stake doesn't exceed user's tokens
                defaultStake = Math.min(defaultStake, currentUser.tokens);
                
                const betForm = document.createElement('div');
                betForm.innerHTML = `
                    <h4>Place Your Bet</h4>
                    <select class="bet-option-select">
                        <option value="">-- Select Option --</option>
                        ${bet.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                    <div class="input-group">
                        <input type="number" class="bet-amount-input" min="1" max="${currentUser.tokens}" value="${defaultStake}" readonly>
                        <button class="place-bet-btn" data-bet-id="${bet.id}" onclick="placeBet(this)">Place Bet</button>
                    </div>
                    <small class="auto-stake-note">Stake is fixed at ${defaultStake} tokens to match the bet${creatorParticipant && creatorParticipant.stake > 0 ? ' creator' : bet.creatorStake > 0 ? ' creator\'s stake' : ' first participant'}.</small>
                `;
                actionsDiv.appendChild(betForm);
            }
            // If user already participated
            else if (bet.participants.some(p => p.name === currentUser.name)) {
                const message = document.createElement('p');
                message.textContent = 'You have already placed a bet on this.';
                actionsDiv.appendChild(message);
            }
            // If deadline passed
            else if (deadlinePassed) {
                const message = document.createElement('p');
                message.textContent = 'Betting period has ended. Waiting for admin to resolve.';
                actionsDiv.appendChild(message);
            }
        }
        
        return betCard;
    },
    
    showError: function(message) {
        this.showNotification(message, 'error');
    },
    
    showSuccess: function(message) {
        this.showNotification(message, 'success');
    },
    
    showNotification: function(message, type) {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            console.error('Notification container not found');
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    },
    
    showConfirmation: function(title, message, onConfirm, onCancel) {
        // Create confirmation dialog
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        
        dialog.innerHTML = `
            <div class="confirmation-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirmation-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn btn-danger">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners
        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            dialog.remove();
            if (onCancel) onCancel();
        });
        
        dialog.querySelector('.confirm-btn').addEventListener('click', () => {
            dialog.remove();
            if (onConfirm) onConfirm();
        });
        
        // Close on click outside
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
                if (onCancel) onCancel();
            }
        });
    },
    
    updateStakeInput: function(isAdmin) {
        const stakeInput = document.getElementById('bet-stake');
        const stakeNote = document.getElementById('stake-note');
        const creatorOptionSelect = document.getElementById('creator-option');
        const creatorOptionNote = document.getElementById('creator-option-note');
        
        if (isAdmin) {
            // For admin users, stake is required but creator option is optional
            stakeInput.setAttribute('required', 'required');
            stakeInput.min = '1';
            
            if (stakeNote) {
                stakeNote.classList.add('hidden');
            }
            
            // For admin users, creator option is optional
            creatorOptionSelect.removeAttribute('required');
            
            if (creatorOptionNote) {
                creatorOptionNote.classList.remove('hidden');
            }
        } else {
            // For regular users, stake is required
            stakeInput.setAttribute('required', 'required');
            stakeInput.min = '1';
            
            if (stakeNote) {
                stakeNote.classList.add('hidden');
            }
            
            // For regular users, creator option is required
            creatorOptionSelect.setAttribute('required', 'required');
            
            if (creatorOptionNote) {
                creatorOptionNote.classList.add('hidden');
            }
        }
    }
};
