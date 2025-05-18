// Card class definition
class Card {
	constructor(name, pitch, cost, card_keywords, types, defense, power) {
		this.name = name;
		this.pitch = pitch;
		this.cost = cost;
		this.card_keywords = card_keywords || [];
		this.types = types || [];
		this.defense = defense;
		this.power = power;
	}

	checkCondition(condition) {
		// Check card name
		if (condition.name && this.name !== condition.name) {
			return false;
		}

		// Check pitch values
		if (condition.pitches) {
			const pitch_values = parseNumberList(condition.pitches);
			const cardPitch = parseInt(this.pitch);
			if (isNaN(cardPitch) || !pitch_values.includes(cardPitch)) {
				return false;
			}
		}

		// Check cost values
		if (condition.costs) {
			const cost_values = parseNumberList(condition.costs);
			const cardCost = parseInt(this.cost);
			if (isNaN(cardCost) || !cost_values.includes(cardCost)) {
				return false;
			}
		}

		// Check defense values
		if (condition.defenses) {
			defense_values = parseNumberList(condition.defenses);
			const cardDefense = parseInt(this.defense);
			if (isNaN(cardDefense) || !defense_values.includes(cardDefense)) {
				return false;
			}
		}

		// Check power values
		if (condition.powers) {
			const power_values = parseNumberList(condition.powers);
			console.log(power_values)
			const cardPower = parseInt(this.power);
			if (isNaN(cardPower) || !power_values.includes(cardPower)) {
				return false;
			}
		}

		// Check keywords
		if (condition.keywords) {
			const needed_keywords = parseQuotedStrings(condition.keywords);
			for (const neededKeyword of needed_keywords) {
				if (!this.card_keywords.includes(neededKeyword)) {
					return false;
				}
			}
		}

		// Check types
		if (condition.types) {
			const needed_types = parseQuotedStrings(condition.types);
			for (const neededType of needed_types) {
				if (!this.types.includes(neededType)) {
					return false;
				}
			}
		}

		return true;
	}
}

// CardCondition class definition
class CardCondition {
	constructor(name, keywords, types, pitches, costs, powers, defenses) {
		this.name = name || null;
		this.keywords = keywords || null;
		this.types = types || null;
		this.pitches = pitches || null;
		this.costs = costs || null;
		this.powers = powers || null;
		this.defenses = defenses || null;
	}
}

// Helper function to select random items from an array
function selectRandomItems(items, n) {
	// Create a copy of the array to avoid modifying the original
	const shuffled = [...items];

	// Shuffle the array (Fisher-Yates algorithm)
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	// Return the first n items
	return shuffled.slice(0, Math.min(n, items.length));
}

// Function to check if a hand satisfies all conditions
function checkHand(hand, conditions) {
	const markedCards = Array(hand.length).fill(false);

	for (const condition of conditions) {
		let conditionMet = false;

		for (let i = 0; i < hand.length; i++) {
			if (markedCards[i]) {
				continue;
			}

			if (hand[i].checkCondition(condition)) {
				markedCards[i] = true;
				conditionMet = true;
				break;
			}
		}

		if (!conditionMet) {
			return false;
		}
	}

	return true;
}

function parseNumberList(str) {
    // Handle empty or non-string input
    if (!str || typeof str !== 'string') {
        return [];
    }

    // Split by spaces, filter out empty strings, and convert to numbers
    return str.trim().split(/\s+/).filter(Boolean).map(Number);
}

function parseQuotedStrings(str) {
    // Handle empty or non-string input
    if (!str || typeof str !== 'string') {
        return [];
    }

    // Use regex to match all strings enclosed in double quotes
    // This handles escaped quotes \" inside the strings
    const matches = str.match(/"((?:\\"|[^"])*)"/g) || [];

    // Clean up the results by removing the surrounding quotes
    // and unescaping any escaped quotes
    return matches.map(match => {
        // Remove surrounding quotes
        let inner = match.substring(1, match.length - 1);
        // Unescape any quotes
        inner = inner.replace(/\\"/g, '"');
        return inner;
    });
}

// Main function equivalent
async function main(decklist_text, handConditions) {
	try {
		// Load the card data (you'll need to adjust this based on your file structure)
		const cardsResponse = await fetch('card.json');
		const cards = await cardsResponse.json();

		// Load the decklist (you'll need to adjust this)
		const decklist = await loadDecklist(decklist_text);

		// Build the deck
		const deck = [];

		for (const card of cards) {
			let colorString;
			switch (card.pitch) {
				case "1": colorString = "(red)"; break;
				case "2": colorString = "(yellow)"; break;
				case "3": colorString = "(blue)"; break;
				default: colorString = "no pitch";
			}

			const cardNameWithColor = card.name + " " + colorString;

			if (decklist[cardNameWithColor]) {
				for (let i = 0; i < decklist[cardNameWithColor]; i++) {
					deck.push(new Card(
						card.name,
						card.pitch,
						card.cost,
						card.card_keywords,
						card.types,
						card.defense,
						card.power
					));
				}
			}
		}

		// Run simulation
		const numHands = 5000;
		let satisfyingHands = 0;

		for (let i = 0; i < numHands; i++) {
			const hand = selectRandomItems(deck, 4);

			if (checkHand(hand, handConditions)) {
				satisfyingHands++;
			}
		}

		// Display results
		console.log(`Percent of hands satisfying condition: ${satisfyingHands / numHands}`);

		return {
			totalHands: numHands,
			satisfyingHands,
			percentage: satisfyingHands / numHands
		};

	} catch (error) {
		console.error("Error:", error);
		throw error;
	}
}

// Function to load decklist from a file
async function loadDecklist(decklist_text) {
	try {
		const deck = {};
		const lines = decklist_text.split('\n');

		for (const line of lines) {
			if (line.trim() === '') {
				continue;
			}

			const match = line.trim().match(/^(\d+)x\s+(.+)$/);

			if (match != null) {
				const quantity = parseInt(match[1], 10);
				const itemWithColor = match[2].trim();

				deck[itemWithColor] = quantity;
			} else {
				console.log(line)
				console.log(match)
				console.log(/^(\d+)x\s+(.+)$/)
				console.warn(`Warning: Line doesn't match expected format: ${line}`);
			}
		}

		return deck;
	} catch (error) {
		console.error("Error loading decklist:", error);
		throw error;
	}
}

// For browser usage - export functions
export {
	Card,
	CardCondition,
	selectRandomItems,
	checkHand,
	loadDecklist,
	main
};

// If you want to run the main function when the script loads
// main().catch(console.error);