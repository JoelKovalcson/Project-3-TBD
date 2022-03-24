import React, { useEffect, useState } from 'react';
import Lowerscore from '../components/game/yahtzee/Lowerscore';
import Dice from '../components/game/yahtzee/Dice';
import Upperscore from '../components/game/yahtzee/Upperscore';
import { GQL_UPDATE_GAME_STATE } from '../utils/mutations';
import { useMutation, useQuery } from '@apollo/client';
import { GQL_GET_GAME_DETAILS } from '../utils/queries';
import Auth from '../utils/auth';

const Yahtzee = (props) => {
	// State to hold data as it goes to and from the database
	const [gameState, setGameState] = useState({
		players: [], // Filled in from database query
		playerNum: null, // Filled in when we know the participants in the game
		showModal: false, // Use when a message needs to be shown to the player,
		modalString: '' // Message to display to user in modal
	});
	const [updateGame] = useMutation(GQL_UPDATE_GAME_STATE);

	const {loading, data: gameData} = useQuery(GQL_GET_GAME_DETAILS, {
		variables: {
			gameId: props.location?.state?.gameId
		},
		onCompleted: (data) => {
			// If there is no existing game state and the host joined, initialize it and send a update to the server
			if(!data.getGame.gameState && Auth.getProfile().data._id === data.getGame.participants[0]._id) {
				
				const playerArr = [];

				for(let i = 0; i < data.getGame.maxPlayers; i++) {
					playerArr.push({
						name: '',
						upperScore: [0,0,0,0,0,0,0,0,0],
						possibleUpper: [0,0,0,0,0,0,0,0,0],
						lowerScore: [0,0,0,0,0,0,0,0,0],
						possibleLower: [0,0,0,0,0,0,0,0,0],
						rollsLeft: 3,
						score: 0,
						currentDice: [1, 1, 1, 1, 1],
						selectedArr: [false, false, false, false, false],
						rolling: false
					});
				}
				// Send the new game data to the server, where the else below will catch on update and set state
				updateGame({
					variables: {
						gameId: data.getGame._id,
						gameState: JSON.stringify({players: playerArr})
					}
				});
				return;
			}
			// Else we aren't the host, but the game isn't started yet
			else if (!data.getGame.gameState) {
				// Display a modal saying that you're waiting for the host to join
				setGameState({
					...gameState,
					showModal: true,
					modalString: 'Waiting on host to join...'
				})
				return;
			}
			// There is a game state, so set current game state to the one just pulled
			else {
				const newState = JSON.parse(data.getGame.gameState);
				// Then check if the number of participants is maxPlayers to display a modal if the game isn't full yet
				if (data.getGame.participants.length < data.getGame.maxPlayers) {
					setGameState({
						...gameState,
						showModal: true,
						modalString: `Waiting on more players to join... (${data.getGame.participants.length}/${data.getGame.maxPlayers})`
					});
					return;
				}
				
				// Setup names for each player, and get current player index in participants array
				const playerArr = newState.players;
				let playerNum = 0;
				for (let i = 0; i < playerArr.length; i++) {
					
					if(data.getGame.participants[i].username === Auth.getProfile().data.username) {
						playerNum = i+1;
					}
					playerArr[i].name = data.getGame.participants[i].username;
				}
				
				setGameState({
					...gameState,
					...newState,
					playerNum: playerNum
				});
			}
		},
		pollInterval: 5000
	});

	const getPossible = (thisPlayer) => {

		const possibleUpper = thisPlayer.possibleUpper.map((_, index) => {
			let val = 0;
			switch(index) {
				// Aces
				case 0:
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
					val = thisPlayer.currentDice.reduce((prev, cur) => {
						if(cur === index+1) return prev + cur;
						else return prev;
					}, 0);
					break;
			}
			return val;
		});

		const possibleLower = thisPlayer.possibleLower.map((_, index) => {
			let val = 0;
			let counts;
			let straight = 0;
			switch(index) {
				case 0:
					counts = [0,0,0,0,0,0];
					val = thisPlayer.currentDice.reduce((prev, cur) => {
						counts[cur-1]++;
						return prev + cur;
					}, 0);
					// Check if there isn't a value at least 3 (no 3-of-a-kind) to reset score
					if(!counts.some(val => val >= 3)) val = 0;
					break;
				case 1:
					counts = [0,0,0,0,0,0];
					val = thisPlayer.currentDice.reduce((prev, cur) => {
						counts[cur-1]++;
						return prev + cur;
					}, 0);
					// Check if there isn't a value at least 4 (no 4-of-a-kind) to reset score
					if(!counts.some(val => val >= 4)) val = 0;
					break;
				case 2:
					counts = [0,0,0,0,0,0];
					for(let i = 0; i < thisPlayer.currentDice.length; i++) {
						counts[thisPlayer.currentDice[i]-1]++;
					}
					// Check if there is a count of 3 of a number and a count of 2 of another
					if(counts.some(val => val === 3) && counts.some(val => val === 2)) val = 25;
					break;
				case 3:
					counts = [0,0,0,0,0,0];
					for(let i = 0; i < thisPlayer.currentDice.length; i++) {
						counts[thisPlayer.currentDice[i]-1]++;
					}
					
					for(let i = 0; i < counts.length; i++) {
						// Count number of numbers in a row
						if(counts[i]) straight++;
						// Reset if broken sequence
						else straight = 0;
						// if we get 4 in a row, score
						if(straight === 4) {
							val = 30;
							break;
						}
					}
					break;
				case 4:
					counts = [0,0,0,0,0,0];
					for(let i = 0; i < thisPlayer.currentDice.length; i++) {
						counts[thisPlayer.currentDice[i]-1]++;
					}
					
					for(let i = 0; i < counts.length; i++) {
						// Count number of numbers in a row
						if(counts[i]) straight++;
						// Reset if broken sequence
						else straight = 0;
						// if we get 4 in a row, score
						if(straight === 5) {
							val = 40;
							break;
						}
					}
					break;
				case 5:
					counts = [0,0,0,0,0,0];
					for(let i = 0; i < thisPlayer.currentDice.length; i++) {
						counts[thisPlayer.currentDice[i]-1]++;
					}
					if(counts.some(val => val === 5)) val = 50;
					break;
				case 6:
					val = thisPlayer.currentDice.reduce((prev, cur) => prev + cur, 0);
					break;
				case 7:
					if(!thisPlayer.lowerScore[5]) break;
					counts = [0,0,0,0,0,0];
					for(let i = 0; i < thisPlayer.currentDice.length; i++) {
						counts[thisPlayer.currentDice[i]-1]++;
					}
					if(counts.some(val => val === 5)) val = 50;
					break;
			}
			return val
		});

		return [possibleUpper, possibleLower];
	}

	useEffect(() => {
		if(gameState.players.length && gameState.players[gameState.playerNum-1].rolling) {
			let counter = 0;
			const interval = setInterval(() => {
				counter++;
				const playerArr = gameState.players;
				const thisPlayer = playerArr[gameState.playerNum-1];
				if (counter >= 20) {
					// Reset counter and clear interval
					clearInterval(interval);
					counter=0;

					// turn off rolling and decrement number of rolls left
					thisPlayer.rollsLeft--;
					thisPlayer.rolling = false;
					console.log(thisPlayer.possibleUpper, thisPlayer.possibleLower);
					[thisPlayer.possibleUpper, thisPlayer.possibleLower] = getPossible(thisPlayer);
					console.log(thisPlayer.possibleUpper, thisPlayer.possibleLower);

					setGameState((prevState) => {
						return {...prevState, players: playerArr}
					});

					// Push changes to database
					updateGame({
						variables: {
							gameId: gameData.getGame._id,
							gameState: JSON.stringify({...gameState, players: playerArr})
						}
					})

					return;
				}

				const newDice = [...(thisPlayer.currentDice)].map((val, index) => {
					if (!thisPlayer.selectedArr[index]) return Math.floor(Math.random()*5)+1;
					else return val;
				});

				thisPlayer.currentDice = newDice;

				setGameState((prevState) => {
					return {...prevState, players: playerArr}
				});

			}, 100);
			return () => {
				clearInterval(interval);
			}
		}
	}, [gameState.players[gameState.playerNum-1]?.rolling])

	const rollDice = () => {
		if(gameState.players.length && gameState.players[gameState.playerNum-1].rollsLeft <= 0) {
			setGameState({
				...gameState,
				showModal: true,
				modalString: 'You have no rolls left!'
			});
			return;
		}
		const playerArr = gameState.players;
		const thisPlayer = playerArr[gameState.playerNum-1];
		thisPlayer.rolling = true;
		setGameState({
			...gameState, players: playerArr
		});
	}
		
	const calculateScore = (thisPlayer) => {
		
	}
	
	const scoreClickHandler = async (event) => {
		const [section, index] = event.target.name.split('-');
		const playersArr = gameState.players;
		const thisPlayer = playersArr[gameState.playerNum-1];
		if (section === 'upper') {
			// Do a check to make sure value doesn't already exist
			thisPlayer.upperScore[index] = thisPlayer.possibleUpper[index];
		}
		else if (section === 'lower') {
			// Do a check to make sure value doesn't already exist
			thisPlayer.lowerScore[index] = thisPlayer.possibleLower[index];
		}
		else {
			// Should never happen
			console.error('scoreClickHandler called from invalid source');
			return;
		}

		// Calculate scores
		[thisPlayer.upperScore, thisPlayer.lowerScore, thisPlayer.score] = calculateScore(thisPlayer);

		// Aggregate scores to send in update
		const scores = gameState.players.map((player) => player.score);

		await updateGame({
			variables: {
				gameId: gameData.getGame._id,
				gameState: JSON.stringify({...gameState, players: playersArr}),
				nextTurn: true,
				scores: scores
			}
		});

		setGameState({
			...gameState,
			players: playersArr
		});
	}

	const toggleSelect = (index) => {
		const playerArr = gameState.players;
		const thisPlayer = playerArr[gameState.playerNum-1];
		thisPlayer.selectedArr[index] = !thisPlayer.selectedArr[index];
		setGameState({
			...gameState, players: playerArr
		})
	}

	const closeModal = (event) => {
		setGameState({
			...gameState,
			showModal: false,
			modalString: ''
		})
	}

	if(loading || gameState.players.length === 0) {
		return (
			<>
				<div className={`${(gameState.showModal) ? "" : "hidden "}grid z-40 bg-background/[.85] fixed top-0 bottom-0 right-0 left-0 justify-center items-center overflow-y-auto overflow-x-hidden h-modal md:h-full md:inset-0`}>
					<div className='relative z-50 p-5 bg-light-background rounded-lg max-w-sm border-4 border-double border-pastel-purple'>
						<button type='button' className='absolute top-4 right-2 transition ease-in-out duration-150 border border-pastel-purple text-light-blue bg-background hover:bg-dark-blue text-right rounded-lg text-sm p-1.5 items-center' onClick={closeModal}>
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
						</button>
						<div className='pr-10 text-xl text-light-blue'>
							{gameState.modalString}
						</div>
					</div>
				</div>
				<div className='flex justify-center'>
					<div className='relative p-4 text-xl sm:text-3xl text-center rounded border-4 border-double border-light-blue'>
						
						Setting up game...
					</div>
				</div>
			</>
		)
	}
	else {
		const thisPlayer = gameState.players[gameState.playerNum-1];
		return (
			<>
				<div className={`${(gameState.showModal) ? "" : "hidden "}grid z-40 bg-background/[.85] fixed top-0 bottom-0 right-0 left-0 justify-center items-center overflow-y-auto overflow-x-hidden h-modal md:h-full md:inset-0`}>
					<div className='relative z-50 p-5 bg-light-background rounded-lg max-w-sm border-4 border-double border-pastel-purple'>
						<button type='button' className='absolute top-4 right-2 transition ease-in-out duration-150 border border-pastel-purple text-light-blue bg-background hover:bg-dark-blue text-right rounded-lg text-sm p-1.5 items-center' onClick={closeModal}>
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
						</button>
						<div className='pr-10 text-xl text-light-blue'>
							{gameState.modalString}
						</div>
					</div>
				</div>
				{/* Had to include the custom background images to trick tailwind into including them in the page's CSS */}
				<div className='hidden bg-dice1 bg-dice2 bg-dice3 bg-dice4 bg-dice5 bg-dice6'/>
				<div className='flex flex-wrap justify-around text-xl'>
					<div className='flex-row flex-wrap justify-center m-4'>
							<div className='flex flex-wrap justify-center'>
								{thisPlayer.selectedArr.map((value, index) => {
									return (
										<Dice key={`dice-${index}`} toggleSelect={toggleSelect} selected={value} num={thisPlayer.currentDice[index]} index={index}/>
									);
								})}
							</div>
							<div className='mt-2 flex flex-row justify-center'>
								<button disabled={(thisPlayer.rolling) ? true : false} onClick={rollDice} 
									className={`text-light-blue p-2 min-w-60 m-auto rounded border-4 border-double border-pastel-purple ${thisPlayer.rolling ? '' : 'hover:bg-dark-blue'} text-center`}>
										Roll Dice ({thisPlayer.rollsLeft})
								</button>	
							</div>
					</div>
					<table className='rounded border border-light-blue border-separate p-0.5 m-1'>
						<thead>
							<tr className='text-center'>
								<th className='border-b border-light-blue px-1'>
									Player Name
								</th>
								<th className='border-b border-light-blue px-1'>
									Total Score
								</th>
							</tr>
						</thead>
						<tbody>
							{gameState.players.map((player) => {
								return (
									<tr key={`${player.name}-${player.score}`}>
										<td className='border-r border-light-blue'>
											{player.name}
										</td>
										<td className='border-l border-light-blue text-center'>
											{player.score}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
					
				<div className='flex flex-wrap justify-evenly mb-4'>	
					<Upperscore scoreClickHandler={scoreClickHandler} maxPlayers={props.location.state.maxPlayers} players={gameState.players} playerNum={gameState.playerNum}/>
					<Lowerscore scoreClickHandler={scoreClickHandler} maxPlayers={props.location.state.maxPlayers} players={gameState.players} playerNum={gameState.playerNum}/>
				</div>
			</>
		)
	}
}

export default Yahtzee;