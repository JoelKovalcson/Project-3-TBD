import {useParams} from 'react-router-dom';
import { useQuery } from '@apollo/client';
import React from 'react';
import Stats from '../components/Stats'
import Chat from '../components/Chat'
import { GQL_GET_PROFILE } from '../utils/queries';
import Auth from '../utils/auth';
import Joingame from '../components/Joingame';

const Profile = () => {

	const {username: userId} = useParams();
	
	const {loading, data} = useQuery(GQL_GET_PROFILE, {
		variables: {userId: (userId) ? userId : Auth.getProfile().data._id}
	});

	// console.log(data.getProfile.scores.tetris.playedGames);
	if(loading) {
		return<div>loading</div>
	}
	else {
		return (
			<>
				<div className='flex flex-row flex-wrap justify-evenly m-4'>
					<div className='flex flex-col justify-center border-4 border-double border-light-blue p-2 rounded'>
						<h1 className='self-center text-xl font-bold'>{data.getProfile.username}</h1>
						<h3 className='self-center'>Total games played:{data.getProfile.scores.totalGames}</h3>
						<Stats
						username={data.getProfile.username}
						tetrisgames={data.getProfile.scores.tetris.playedGames}
						tetrisrows={data.getProfile.scores.tetris.rowsCleared}
						tetrishighscore={data.getProfile.scores.tetris.bestScore}
						/>
					</div>
					<div className='flex flex-col border-4 border-double border-light-blue rounded p-2'>
						<Joingame/>
					</div>
					<div className='flex flex-col justify-between border-4 border-double border-light-blue rounded'>
						<Chat/>
					</div>
				</div>	
			</>
		)
	}
}

export default Profile;