var PFCards = [];
var PSCards = [];
var PFPile = [];
var PSPile = [];
var stagePiles = [];
var turn = 1;
var errormessage = "";
firstTurnSelectedCard = -1;

var deck = [];
var tempStage = [];
var topCard = 0;
var lastPickup = 0;

var PFpoints = 0;
var PSpoints = 0;


var cardEle = function(rank, suit, index) {
	return '<div class="card ' + suitName[suit] + '" data-index="'
	+ index + '" onclick="clickCard(event)">' + rankName(rank) + ' '
	+ suitFigure[suit] + '</div>';
}

var pileEle = function(rank, index) {
	var pileCards = "";
	for (var i = 0; i < stagePiles[index].cards.length && i < 3; i++) {
		pileCards += '<div class="card ' + suitName[stagePiles[index].cards[i].suit]
		+ '" data-index="' + index + '" style="transform: rotate(' + Math.floor((Math.random() * 40) - 20)
		+ 'deg);">' + rankName(stagePiles[index].cards[i].rank) + ' '
		+ suitFigure[stagePiles[index].cards[i].suit] + '</div>';
	}
	return '<div class="pile" data-index="' + index
	+ '" onclick="clickPile(event)"><div class="card label">' + rankName(rank)
	+ '<span>+' + calculateScore(stagePiles[index].cards, false) + '</span></div>' + pileCards + '</div>';
}

var suitName = [null, "spades", "hearts", "diamonds", "clubs"];
var suitFigure = [null, "&spades;", "&hearts;", "&diams;", "&clubs;"];

var rankName = function(rankVal) {
	if (rankVal == 1) { return "A"; }
	else if (rankVal == 11) { return "J"; }
	else if (rankVal == 12) { return "Q"; }
	else if (rankVal == 13) { return "K"; }
	else { return rankVal; }
}

function submitMove(pickUpPileBool) {
	// console.log("selected piles: " + selectedPiles());
	// console.log("first selected target index: " + firstTurnSelectedCard);
	if (turn == 1) {
		if (firstTurn($($('#hand .selected')).data().index, firstTurnSelectedCard,
			selectedPiles(), pickUpPileBool)) {
			//nextPlayer();
			return true;
		} else {
			sweetAlert("Oops...", errormessage, "error");
			return false;
		}		
	} else {
		if (anyTurn($($('#hand .selected')).data().index, selectedPiles(), pickUpPileBool)) {
			// if (turn < 49) {
			// 	//nextPlayer();	
			// 	return true;			
			// } else {
			// 	gameOver();
				return true;
		} else {
			sweetAlert("Oops...", errormessage, "error");
			return false;
		}
	}
}

function nextPlayer() {
	// setTimeout(function(){ nextPlayer(); }, 1000);
	console.log("it worked");
	$('.selected').removeClass("selected");
	$('.button').hide();
	//showCards();
}

function clickCard(event) {
    console.log($(event.target).data());
    if($(event.target).parent('#hand').hasClass("unclickable"))
    	return;
    if($(event.target).parent('#stage').hasClass("unclickable"))
    	return;
	if ($(event.target).parent('#hand').length) {
		if (! $(event.target).parent('#hand').hasClass('hidden')) {
			$('#hand .selected').removeClass("selected");
			$(event.target).addClass("selected");
		}
	} else {
		$(event.target).toggleClass("selected");
	}
	if (turn == 1 && firstTurnSelectedCard < 0) {
		if (! $(event.target).parent('#hand').length) {
			$('.selected').removeClass("selected");
		} else if (PFCards[$(event.target).data().index].rank >= 9) {
			$('#selectBtn').show();
		} else {
			$('#selectBtn').hide();
		}
	} else if ($('#hand .selected').length) {
		$('#pileBtn').show();
		if ($('#stage .selected').length) {
			$('#pickBtn').show();
		} else {
			$('#pickBtn').hide();
		}
	}
}

function clickPile(event) {
    console.log($(event.target).closest('.pile').data());
    if($(event.target).parent('#stage').hasClass("unclickable"))
    	return;
	$(event.target).closest('.pile').toggleClass("selected");
	if ($('#hand .selected').length) {
		$('#pileBtn').show();
		if ($('#stage .selected').length) {
			$('#pickBtn').show();
		} else {
			$('#pickBtn').hide();
		}
	}
}

var selectedPiles = function() {
	var arrOfCards = [];
	for (var i = 0; i < $('#stage .selected').length; i++) {
		arrOfCards[i] = $($('#stage .selected')[i]).data().index;
	}
	return arrOfCards;
}

function getStagePiles() {
	return stagePiles;
}

function getDeck() {
	return deck;
}

function getPFCards() {
	return PFCards;
}

function getPSCards() {
	return PSCards;
}

function createDeck() {
	for (i = 1; i <= 4; i++) {
		for (j = 1; j <= 13; j++) {
			var card = {rank: j, suit: i};
			deck[13 * (i - 1) + j - 1] = card;		
		}
	}
}


function deckShuffle()    {             
    for (var i = 0; i < 52; i++)    {
        var randomInt = Math.floor(Math.random() * 52);
        var temp = deck[i];
        deck[i] = deck[randomInt];
        deck[randomInt] = temp;
    }
}

function initialDeal() {
	for (i = 0; i < 4; i++) {
		var cardsInPile = [deck[i]];
		var pile = {locked : deck[i].rank == 13 ? true : false, rankValue: deck[i].rank, cards: cardsInPile};
		stagePiles[i] = pile; 
	}
	topCard = 4;
	for (i = topCard; i < 8; i++) {
		PFCards[i - 4] = deck[i];
	}
	topCard = 8;
	PFCards.sort(sortByRank);
}

function sortByRank(a,b) {
  if (a.rank < b.rank)
     return -1;
  if (a.rank > b.rank)
    return 1;
  return 0;
}

function deal(firstHalf) {
	for (i = topCard; i < (firstHalf ? topCard + 8 : topCard + 12); i++) {
		PFCards.push(deck[i]);
	}
	topCard = i;
	for (i = topCard; i < topCard + 12; i++) {
		PSCards.push(deck[i]);
	}
	topCard = i;
	PFCards.sort(sortByRank);
	PSCards.sort(sortByRank);
}


function makeTempStage(selectedCard, arrayPiles) {
	var numLockedpiles = 0;
	for (var i = 0; i < arrayPiles.length; i++) {
		if (arrayPiles[i].locked == true) {
			numLockedpiles++;
			var lockedPile = arrayPiles[i];
		}
	}
	if (numLockedpiles > 1) {
		return false;
	}
	if (lockedPile == 1) {

	}
}

/*
SelectedCard = index of card selected inside your hand
targetRankIndex = index of card rank needed to reach in terms of first selection (1stTurn)
selectedPiles = array of indices of selected piles from stagePiles[]
pickUp = boolean for whether you're picking up or putting down
*/
function firstTurn(selectedCard, targetRankIndex, selectedPiles, pickUp) {
	//call normal turn method
	//check if pile they made is selectedCard.rank
	var handCard = PFCards[selectedCard];
	var arrayPiles = [];
	var sumOfCards = 0;
	for (i = 0; i < selectedPiles.length; i++){
		arrayPiles[i] = stagePiles[selectedPiles[i]];
		sumOfCards += arrayPiles[i].rankValue;
	}

	sumOfCards += handCard.rank;

	if (sumOfCards % PFCards[targetRankIndex].rank != 0) {
		errormessage = "The selected cards cannot make or pick a pile according to the target chosen";
		return false
	}

	if (!pickUp) {
		makePile(handCard, selectedPiles);
	}
	else if (!pickUpPile(handCard, selectedPiles)) {
		return false;
	}

	turn++;
	PFCards.splice(selectedCard, 1);

	deal(true);
	return true;
}

function anyTurn(selectedCard, selectedPiles, pickUp) {
	var player1turn = turn%2 == 1;
	var handCard = player1turn ? PFCards[selectedCard] : PSCards[selectedCard];
	/*var sumOfCards = 0;
	for (i = 0; i < selectedPiles.length; i++){
		sumOfCards += stagePiles[selectedPiles[i]].rankValue;
	}

	sumOfCards += handCard.rank;*/
	if (!pickUp) {
		//if (sumOfCards != PFCards[targetRankIndex].rank)
			//return false
		if (!makePile(handCard, selectedPiles))
			return false;
	}
	else if (!pickUpPile(handCard, selectedPiles)) {
		return false;
	}

	turn++;
	player1turn ? PFCards.splice(selectedCard, 1) : PSCards.splice(selectedCard, 1);

	

	return true;
}

function makePile(handCard, selectedPiles) {
	//Case for when you're throwing down a single card for a new pile
	if (selectedPiles.length == 0) {
		var newPile = {locked : handCard.rank == 13 ? true : false, rankValue: handCard.rank, cards: [handCard]};
		stagePiles.push(newPile);
		return true;
	}

	var pileRank = 0;
	var unlockedPiles = {locked : false, rankValue : 0, cards: []};
	var lockedPiles = {locked: true, rankValue: 0, cards: []};
	for (i=0; i < selectedPiles.length; i++) {
		var currentPile = stagePiles[selectedPiles[i]];

		if (!currentPile.locked) {		//Add all unlocked piles into one
			unlockedPiles.rankValue += currentPile.rankValue;
			unlockedPiles.cards = unlockedPiles.cards.concat(currentPile.cards);
		} else {
			if (lockedPiles.cards.length == 0) {
				lockedPiles = currentPile;
			} else {
				if (lockedPiles.rankValue != currentPile.rankValue) {
					errormessage = "Cannot combine a locked pile with another pile which is not the same";
					return false;
				}
				lockedPiles.cards = lockedPiles.cards.concat(currentPile.cards);
			}
		}
	}

	unlockedPiles.cards.push(handCard);
	unlockedPiles.rankValue += handCard.rank;

	var highestCardRank = 0;
	for (i=0; i < unlockedPiles.length; i++) {
		if (unlockedPiles.cards[i].rank > highestCardRank)
			highestCardRank = unlockedPiles.cards[i].rank;
	}

	if (lockedPiles.cards.length != 0)
		pileRank = lockedPiles.rankValue;

	for (i=9; i<=13; i++) {
		if (unlockedPiles.rankValue % i == 0 && i>=highestCardRank && i>=pileRank) {
			if (unlockedPiles.rankValue > 13)
				unlockedPiles.locked = true;
			unlockedPiles.rankValue = i;
			break;
		}
		if (i==13) {
			errormessage = "Cannot make a pile out of the bounds from 9 to King";
			return false;
		}
	}

	console.log("1unlocked piles rank value : " + unlockedPiles.rankValue);
	if (pileRank == 0) {
		pileRank = unlockedPiles.rankValue;
	} else if (pileRank != unlockedPiles.rankValue) {
		errormessage = "Cannot combine a locked pile with another pile which is not the same";
		return false;
	}

	console.log("2unlocked piles rank value : " + unlockedPiles.rankValue);
	console.log("2pile rank value : " + pileRank);

	var playerCards = turn % 2 == 1? PFCards : PSCards;
	var count = 0;
	for (i=0; i < playerCards.length; i++) {
		if (playerCards[i].rank == pileRank)
			count++;
	}

	if (pileRank == handCard.rank && count < 2) {
		errormessage = "Cannot make a pile of this rank without at least one of such card in hand";
		return false;
	}

	if (pileRank != handCard.rank && count < 1) {
		errormessage = "Cannot make a pile of this rank without at least one of such card in hand";
		return false;
	}


	var finalPile = lockedPiles;
	if (lockedPiles.cards.length != 0) {
		finalPile = lockedPiles;
		lockedPiles.cards = lockedPiles.cards.concat(unlockedPiles.cards);
	} else {
		finalPile = unlockedPiles;
		console.log("THIS HAPPENED");
	}

	console.log("3unlocked piles rank value : " + unlockedPiles.rankValue);
	console.log("3final piles rank value : " + finalPile.rankValue);
	console.log("3pile rank value : " + pileRank);


	var destinationPile = selectedPiles[0];
	for (i=selectedPiles.length - 1; i > 0; i--) {
		stagePiles.splice(selectedPiles[i], 1);
	}
	stagePiles[destinationPile] = finalPile;


	//Combines piles on the stage which have the same rank and have multiple cards.
	for (i=0; i<stagePiles.length; i++) {
		var toCombinePiles = [];
		if (stagePiles[i].cards.length > 1) {
			for (var j=i+1; j< stagePiles.length; j++) {
				if (stagePiles[j].rankValue == stagePiles[i].rankValue /*&& stagePiles[j].cards.length > 1*/) {
					toCombinePiles.push(j);
				}
			}
			if (toCombinePiles.length > 0) {
				toCombinePiles.push(i);
				break;
			}
		}		
	}
	if (toCombinePiles.length > 0) {
		for (i=0; i<toCombinePiles.length - 1; i++) {
			stagePiles[toCombinePiles[toCombinePiles.length - 1]].cards
			= stagePiles[toCombinePiles[toCombinePiles.length - 1]].cards.concat(stagePiles[toCombinePiles[i]].cards);
			stagePiles.splice(toCombinePiles[i], 1);
		}
	}

	return true;
}

function pickUpPile(handCard, selectedPiles) {
	var sumOfCards = 0;
	for (i = 0; i < selectedPiles.length; i++){
		sumOfCards += stagePiles[selectedPiles[i]].rankValue;
	}
	var sum = 0;
	var flag = false;
	var sweep = false;
	for (i = 0; i < selectedPiles.length; i++){
		sum = stagePiles[selectedPiles[0]].rankValue;

	}

	if (sumOfCards > handCard.rank) {
		if (handCard.rank <=8) {
			errormessage = "Cannot pickup selected cards with the card selected";
			return false;
		}
		if (sumOfCards % handCard.rank != 0) {
			errormessage = "The selected cards cannot make a pile according to the hand card selected";
			return false;
		}
	} else if (sumOfCards < handCard.rank) {
		errormessage = "The selected cards do not add up to the card selected.";
		return false;
	}


	for (i=selectedPiles.length - 1; i>=0; i--) {
		if (turn %2 == 1) {
			PFPile = PFPile.concat(stagePiles[selectedPiles[i]].cards);
		} else {
			PSPile = PSPile.concat(stagePiles[selectedPiles[i]].cards);
		}
		stagePiles.splice(selectedPiles[i], 1);
	}

	if (stagePiles.length == 0 && turn < 49)
		sweep = true;

	if (turn %2 == 1) {
		if (sweep)
			PFPile.push({rank: 50, suit: 1});
		PFPile.push(handCard);
	} else {
		if (sweep)
			PSPile.push({rank: 50, suit: 1});
		PSPile.push(handCard);
	}

	return true;
}

function containsHighCard(cards) {
	for (var i = 0; i < cards.length; i++) {
		if (cards[i].rank >= 9) {
			return true;
		}
	}
	return false;
}

function calculateScore(cards, endgame) {
	if (!cards)
		return 0;
	var score = 0;
	console.log(cards);
	for (i=0; i < cards.length; i++) {
		if (cards[i].suit == 1) {
			score += cards[i].rank;
		} else if (cards[i].suit == 3) {
			if (cards[i].rank == 10)
				score += 2;
			score += cards[i].rank == 1 ? cards[i].rank : 0;
		} else if (cards[i].rank == 1) {
			score++;
		}
	}
	if (endgame) {
		score += cards.length > 26 ? 4 : cards.length == 26 ? 2 : 0;
	}
	return score;
}


function endgame() {
	if (lastPickup == 1) {
		while (stagePiles.length != 0) {
			PFPile = PFPile.concat(stagePiles[0].cards);
			stagePiles.splice(0, 1);
		}
	} else while (stagePiles.length != 0) {
		PSPile = PSPile.concat(stagePiles[0].cards);
		stagePiles.splice(0, 1);
	}
}