const BetManager = {
    createBet: function(creator, description, options, stake, deadline, creatorOption) {
        // Get current user
        const users = DataStore.getUsers();
        const userIndex = users.findIndex(u => u.name === creator);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        const user = users[userIndex];
        const isAdmin = user.isAdmin;
        
        // Validate user has enough tokens (admin has infinite tokens)
        if (!isAdmin && user.tokens < stake) {
            return { success: false, message: 'Not enough tokens' };
        }
        
        // Validate options
        if (!options || options.length < 2) {
            return { success: false, message: 'At least two options are required' };
        }
        
        // Validate creator option (skip for admin if not provided)
        if (!isAdmin && (!creatorOption || !options.includes(creatorOption))) {
            return { success: false, message: 'Invalid creator option selected' };
        }
        
        // Validate stake for all users
        if (stake <= 0) {
            return { success: false, message: 'Stake must be greater than 0' };
        }
        
        // Create bet object
        const bet = {
            id: Date.now().toString(),
            creator,
            description,
            options,
            creatorStake: stake,
            deadline: new Date(deadline),
            participants: [],
            status: 'open',
            winner: null,
            createdAt: new Date()
        };
        
        // Only add creator as participant if they selected an option
        if (creatorOption && options.includes(creatorOption)) {
            bet.participants.push({
                name: creator,
                option: creatorOption,
                stake: stake,
                timestamp: new Date()
            });
        }
        
        // Update user tokens and bets created (skip token deduction for admin)
        if (!isAdmin && stake > 0) {
            user.tokens -= stake;
        }
        user.betsCreated.push(bet.id);
        
        // Save data
        users[userIndex] = user;
        DataStore.saveUsers(users);
        DataStore.updateUser(user);
        
        // Save bet and return result
        DataStore.saveBet(bet);
        return { success: true, message: 'Bet created successfully', bet: bet };
    },
    
    placeBet: function(betId, option, stake) {
        // Get current user
        const currentUser = DataStore.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'You must be logged in to place a bet' };
        }
        
        // Validate stake
        stake = parseInt(stake);
        if (isNaN(stake) || stake < 1) {
            return { success: false, message: 'Stake must be at least 1 token' };
        }
        
        // Get bet
        const bets = DataStore.getBets();
        const betIndex = bets.findIndex(b => b.id === betId);
        
        if (betIndex === -1) {
            return { success: false, message: 'Bet not found' };
        }
        
        const bet = bets[betIndex];
        
        // Check if bet is still open
        if (bet.status !== 'open') {
            return { success: false, message: 'This bet is no longer open' };
        }
        
        // Check if deadline has passed
        const now = new Date();
        const deadline = new Date(bet.deadline);
        if (now > deadline) {
            return { success: false, message: 'The deadline for this bet has passed' };
        }
        
        // Check if user has already placed a bet
        if (bet.participants.some(p => p.name === currentUser.name)) {
            return { success: false, message: 'You have already placed a bet on this bet' };
        }
        
        // Check if option is valid
        if (!bet.options.includes(option)) {
            return { success: false, message: 'Invalid option' };
        }
        
        // Check if user has enough tokens (admin has infinite tokens)
        if (!currentUser.isAdmin && currentUser.tokens < stake) {
            return { success: false, message: 'You do not have enough tokens' };
        }
        
        // Determine the correct stake amount
        let finalStake = stake;
        
        // Find the creator's stake from participants
        const creatorParticipant = bet.participants.find(p => p.name === bet.creator);
        if (creatorParticipant) {
            // Ensure the stake matches the creator's stake
            if (stake !== creatorParticipant.stake) {
                return { 
                    success: false, 
                    message: `Your stake must be ${creatorParticipant.stake} tokens to match the bet creator's stake` 
                };
            }
        } 
        // If no creator participant, check the creatorStake property
        else if (bet.creatorStake > 0) {
            // Ensure the stake matches the creator's stake
            if (stake !== bet.creatorStake) {
                return { 
                    success: false, 
                    message: `Your stake must be ${bet.creatorStake} tokens to match the bet creator's stake` 
                };
            }
        }
        // If there are other participants, ensure stake matches the first participant
        else if (bet.participants.length > 0) {
            // Sort participants by timestamp to find the first one
            const sortedParticipants = [...bet.participants].sort((a, b) => {
                const timeA = new Date(a.timestamp || 0);
                const timeB = new Date(b.timestamp || 0);
                return timeA - timeB; // Ascending order (oldest first)
            });
            
            // Use the first participant's stake if available
            if (sortedParticipants[0] && sortedParticipants[0].stake > 0) {
                if (stake !== sortedParticipants[0].stake) {
                    return { 
                        success: false, 
                        message: `Your stake must be ${sortedParticipants[0].stake} tokens to match the first participant's stake` 
                    };
                }
            }
        }
        
        // Add participant to bet
        bet.participants.push({
            name: currentUser.name,
            option: option,
            stake: finalStake,
            timestamp: new Date().toISOString()
        });
        
        // Update bet
        bets[betIndex] = bet;
        DataStore.saveBets(bets);
        
        // Deduct tokens from user (unless admin)
        if (!currentUser.isAdmin) {
            const users = DataStore.getUsers();
            const userIndex = users.findIndex(u => u.name === currentUser.name);
            
            if (userIndex !== -1) {
                users[userIndex].tokens -= finalStake;
                DataStore.saveUsers(users);
                DataStore.setCurrentUser(users[userIndex]);
                
                // Add to balance history
                DataStore.addBalanceHistoryEntry(
                    currentUser.name, 
                    -finalStake, 
                    `Placed bet on "${bet.description}" (Option: ${option})`
                );
            }
        }
        
        return { success: true, message: `Bet placed on "${option}" for ${finalStake} tokens` };
    },
    
    resolveBet: function(betId, winningOption) {
        const currentUser = DataStore.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'You must be logged in to resolve a bet' };
        }
        
        // Check if user is admin
        if (!DataStore.isCurrentUserAdmin()) {
            return { success: false, message: 'Only admin can resolve bets' };
        }
        
        const bets = DataStore.getBets();
        const betIndex = bets.findIndex(b => b.id === betId);
        
        if (betIndex === -1) {
            return { success: false, message: 'Bet not found' };
        }
        
        const bet = bets[betIndex];
        
        if (bet.status === 'resolved') {
            return { success: false, message: 'This bet has already been resolved' };
        }
        
        if (!bet.options.includes(winningOption)) {
            return { success: false, message: 'Invalid winning option' };
        }
        
        // Calculate total pot
        const totalPot = bet.participants.reduce((sum, p) => sum + p.stake, 0);
        
        // Update bet status
        bet.status = 'resolved';
        bet.winner = winningOption;
        bet.resolvedBy = currentUser.name;
        bet.resolvedAt = new Date().toISOString();
        bet.totalPot = totalPot; // Store total pot for display
        
        // Calculate winnings
        const winners = bet.participants.filter(p => p.option === winningOption);
        
        // Store pot split information
        bet.potSplit = {
            totalPot: totalPot,
            winnerCount: winners.length,
            winningOption: winningOption,
            houseCollected: 0,
            winnerNames: winners.map(w => w.name)
        };
        
        if (winners.length > 0) {
            // Distribute winnings equally among winners
            const winningsPerWinner = Math.floor(totalPot / winners.length);
            bet.potSplit.winningsPerWinner = winningsPerWinner;
            
            // Calculate any remainder that goes to "the house" due to rounding
            const remainder = totalPot - (winningsPerWinner * winners.length);
            bet.potSplit.houseCollected = remainder;
            
            // Update user tokens
            const users = DataStore.getUsers();
            
            winners.forEach(winner => {
                const userIndex = users.findIndex(u => u.name === winner.name);
                if (userIndex !== -1) {
                    users[userIndex].tokens += winningsPerWinner;
                    
                    // Add to balance history
                    DataStore.addBalanceHistoryEntry(
                        winner.name,
                        winningsPerWinner,
                        `Won bet "${bet.description}" (Option: ${winningOption})`
                    );
                }
            });
            
            // Save updated users
            DataStore.saveUsers(users);
        } else {
            // If no winners, all tokens go to "the house"
            bet.potSplit.houseCollected = totalPot;
            bet.potSplit.winningsPerWinner = 0;
        }
        
        // Save updated bets
        bets[betIndex] = bet;
        DataStore.saveBets(bets);
        
        // Create detailed message about pot distribution
        let resultMessage = 'Bet resolved successfully. ';
        
        if (winners.length > 0) {
            resultMessage += `${winners.length} winner${winners.length > 1 ? 's' : ''} `;
            resultMessage += `received ${bet.potSplit.winningsPerWinner} tokens each from a total pot of ${totalPot} tokens.`;
            
            if (bet.potSplit.houseCollected > 0) {
                resultMessage += ` ${bet.potSplit.houseCollected} token${bet.potSplit.houseCollected > 1 ? 's were' : ' was'} collected by the house due to rounding.`;
            }
        } else {
            resultMessage += `No winners for this bet. All ${totalPot} tokens went to the house.`;
        }
        
        return { 
            success: true, 
            message: resultMessage
        };
    }
};
