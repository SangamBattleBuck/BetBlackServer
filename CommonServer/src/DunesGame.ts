const dune_gameName: string = 'Dunes';
const dunne_Tag:string='TAG::Dunes';

const Dune_CreateMatch: nkruntime.RpcFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string
{
    let responseJson = emptyResponse;
    let matchDetail: MatchMakingDetailsReceived | null = null;
    try
    {
        matchDetail = JSON.parse(payload);
    } catch (error)
    {
        logger.error(`${dunne_Tag} Failed to deserialize JSON: ${error}`);
    }
    if (matchDetail == null)
    {
        return responseJson;
    }
    else
    {
        let matchList=nk.matchList(1,null,matchDetail.roomId);
        if(matchList.length>0)
        {

            let matchId=matchList[0].matchId;
            let mmData = new MatchMakingResponseData(matchDetail.roomId, matchId);
            let mmResponse = new MatchMakingResponse(mmData);
            logger.warn(dunne_Tag,`=========RoomFound=======roomId:${matchDetail.roomId} matchId:${matchId}`);
            return JSON.stringify(mmResponse);
        }
        else
        {
            let matchId = nk.matchCreate(dune_gameName,matchDetail);
            let mmData=new MatchMakingResponseData(matchDetail.roomId,matchId);
            let mmResponse = new MatchMakingResponse(mmData);
            logger.warn(dunne_Tag,`=========RoomCreated=======roomId:${matchDetail.roomId} matchId:${matchId}`);
            return  JSON.stringify(mmResponse);
        }
    }
}

const Dune_MatchInit: nkruntime.MatchInitFunction<nkruntime.MatchState> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [p: string]: any; }): { state: nkruntime.MatchState; tickRate: number; label: string; }
{
    logger.warn(`TAG:MatchInit 1`);
    let matchDetail:MatchMakingDetailsReceived=params as MatchMakingDetailsReceived;
    logger.warn(`TAG:MatchInit 2`);
    let matchMeta= new MatchMakeState(matchDetail.roomId,matchDetail.minPlayerCount,matchDetail.maxPlayerCount,0,matchDetail.matchMakeWaitTime,matchDetail.gamePlayTime);
    // let player=new PlayersStateGame();
    matchMeta.matchState=MatchStateCode.WaitingForMatchMaking;
    logger.warn(`TAG:MatchInit 3 matchMakingEndTime ${matchMeta.matchMakingEndTime}`);
    return {
        state: {
            matchMeta:matchMeta,
            players: {},
        },
        tickRate: 1, // 1 tick per second = 1 MatchLoop func invocations per second
        label: matchMeta.roomId
    };
}

 const Dune_MatchJoinAttempted: nkruntime.MatchJoinAttemptFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {
    [key: string]: any;
}): { state: nkruntime.MatchState; accept: boolean; rejectMessage?: string | undefined; } | null
 {
     logger.warn(`TAG:MatchJoinAttempted 1`);
     let matchMeta: MatchMakeState = state.matchMeta;
     logger.warn(`TAG:MatchJoinAttempted state: ${JSON.stringify(state.toString)}`);
     logger.warn(`TAG:MatchJoinAttempted metadata:${JSON.stringify(metadata)}`);


     if (matchMeta.matchState == MatchStateCode.StartCountDown || matchMeta.matchState == MatchStateCode.MatchStarted)
     {
         //TODO handle Resume case here
         logger.warn(`TAG:MatchJoinAttempted Resume.... ForceStop`);
         return null;
     } else if (matchMeta.currentPlayerCount <= matchMeta.maxPlayerCount)
     {
         try
         {
             logger.warn(`TAG:MatchJoinAttempted 2 ((((((Starting))))))...`);
             let playerDetails: PlayerDetailReceived = JSON.parse(metadata.playerDetails);
             logger.warn(`TAG:MatchJoinAttempted 2.2 ((((((Starting))))))...`);
             let joinedPlayerState = new PlayerStateData(playerDetails,presence.userId);
             logger.warn(`TAG:MatchJoinAttempted 2.3 ((((((Starting)))))) joinPlayerState: ||${JSON.stringify(joinedPlayerState)}||`);
             state.players[presence.userId]=joinedPlayerState;
             presence.username=metadata.playerDetails.playerName;
             presence.status=metadata.playerDetails.toString();
             logger.warn(`TAG:MatchJoinAttempted 2.4 ((((((parse successfully))))))...${presence.status}`);
         } catch (ex)
         {
             logger.warn(`TAG:MatchJoinAttempted 2 parse failed ${ex}`);
         }
        logger.warn(`TAG:MatchJoinAttempted player accepted`);
        return {
            state,
            accept: true,
        };
    }
    else
    {
        logger.warn(`TAG:MatchJoinAttempted player rejected`);
        return {
            state,
            accept: false,
            rejectMessage:'Room is Full'
        };
    }
}

const Dune_MatchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {
    state: nkruntime.MatchState
} | null
{
    let matchMeta:MatchMakeState=state.matchMeta;

    matchMeta.currentPlayerCount+=1;
    let playerDetail:{[key: string]: any;}={};
    for (const p in state.players) {
        let t=state.players[p].playerDetails;
        playerDetail[p]=t;
    }
    dispatcher.broadcastMessage(PacketCode.PlayerJoin, JSON.stringify(playerDetail),null,null,true);
    if(matchMeta.currentPlayerCount == matchMeta.maxPlayerCount)
    {
        // Max player found so starting the match
        matchMeta.matchState=MatchStateCode.WaitingForPlayerReady;
        dispatcher.broadcastMessage(PacketCode.ServerReady, JSON.stringify(playerDetail),null,null,true);
    }
    logger.warn(`TAG:MatchJoin ${JSON.stringify(state)}`);
    return {
        state
    }
}

const Dune_MatchLeave: nkruntime.MatchLeaveFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {
    state: nkruntime.MatchState
} | null
{
    let matchMeta:MatchMakeState=state.matchMeta;
    matchMeta.currentPlayerCount-=1;
    return {state};
}

 const Dune_MatchLoop: nkruntime.MatchLoopFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): {
    state: nkruntime.MatchState;
} | null
{
    let matchMeta:MatchMakeState=state.matchMeta;
    let currentTime=Date.now();
    let currentMatchState=matchMeta._matchState;
    logger.warn(`TAG::RRRR tick${tick} ${JSON.stringify(matchMeta)}|| matchMeta.matchState :${currentMatchState} RoomID${matchMeta.roomId}`);
    switch (currentMatchState)
    {
        case MatchStateCode.WaitingForMatchMaking:
            {
                if(currentTime > matchMeta.matchMakingEndTime)
                {
                    //Match make waiting time is over
                    if (matchMeta.currentPlayerCount >= matchMeta.minPlayerCount)
                    {
                        // has found minimum required player so starting the match
                        matchMeta.matchState = MatchStateCode.WaitingForPlayerReady;
                        dispatcher.broadcastMessage(PacketCode.ServerReady,playerReadyResponse,null,null,true);
                        logger.warn("TAG::Match min player found now waiting for gameReady Packet");
                        return {
                            state
                        }
                    }
                    else
                    {
                        //TODO write dispatcher message here
                        logger.warn("TAG::Match min player not found match force stop");
                        return null;
                    }
                }
                else
                {
                    //Waiting for match making
                    let remainingSec=(matchMeta.matchMakingEndTime-currentTime)/1000;
                    logger.warn(`TAG::Match MatchMaking waiting ........$ time left:${remainingSec}`);
                    return {
                        state
                    }
                }

            }
        case MatchStateCode.WaitingForPlayerReady:
        {
            if (currentTime > matchMeta.waitingPlayReadyEndTime)
            {
                let remainingSec=(matchMeta.waitingPlayReadyEndTime-currentTime)/1000;
                logger.warn(`TAG::Match playerReady waiting........$ time left:${remainingSec}`);
                for (const msg of messages)
                {
                    if(msg.opCode == PacketCode.PlayerReady)
                    {
                        let t:PlayerStateData=state.players[msg.sender.userId]
                        t.playerReady = true;
                    }
                }
                //Checking all Player ready ?
                let allPlayerReady =true;
                for (const p in state.players) {
                    if(state.players[p].playerReady == false)
                    {
                        allPlayerReady=false;
                        break;
                    }
                     // logger.warn(`UserId: ${p}, Score: ${state.players[p].playerReady}`);
                }
                if(allPlayerReady)
                {
                    logger.warn(`TAG::Match ####All playerReady received........####`);
                    matchMeta.matchState=MatchStateCode.StartCountDown;
                }
                return {
                    state
                }
            } else
            {
                logger.warn("TAG::Match found but player took too long to get ready so forceStop");
                return null;
            }
        }
        case MatchStateCode.StartCountDown:
        {
            if(matchMeta.countDown>0 && currentTime>matchMeta.lastCountTime)
            {
                logger.warn(`TAG::Match ####Count Down ${matchMeta.countDown}........####`);
                dispatcher.broadcastMessage(PacketCode.CountDown, matchMeta.countDown.toString(),null,null,true);
                matchMeta.countDown-=1;
                matchMeta.lastCountTime=currentTime+1000;//added sec
            }
            else if(matchMeta.countDown<=0)
            {
                matchMeta.matchState=MatchStateCode.MatchStarted;
                logger.warn(`TAG::Match ####Count Down Over Start Game ${matchMeta.countDown}........####`);
                dispatcher.broadcastMessage(PacketCode.StartGame, matchMeta.countDown.toString(),null,null,true);
            }
            return {
                state
            }
        }
        case MatchStateCode.MatchStarted:
        {
            //check all player ready is received
            let remainingSec=(matchMeta.gamePlayEndTime-currentTime)/1000;
            for(const msg of messages)
            {
                const code:PacketCode=msg.opCode
                switch (code)
                {
                    case PacketCode.PlayerJoin:
                        break;
                    case PacketCode.ServerReady:
                        break;
                    case PacketCode.PlayerReady:
                        break;
                    case PacketCode.CountDown:
                        break;
                    case PacketCode.StartGame:
                        break;
                    case PacketCode.GameOverTime:
                        break;
                    case PacketCode.GameFailedMinPlayerReq:
                        break;
                    case PacketCode.GameFailedMinPlayerReqPlayerReady:
                        break;
                    case PacketCode.GameOverPlayerLeft:
                        break;
                    case PacketCode.BroadCast:
                        dispatcher.broadcastMessage(PacketCode.BroadCast,msg.data,null,null,true);
                        break;

                }
            }

            logger.warn(`TAG::Match *****GameLogic running........remainingSec:${remainingSec}***`);
            if (currentTime>matchMeta.gamePlayEndTime)
            {
                logger.warn(`TAG::Match !!!!!!Game Over time out........!!!!!!`);
                dispatcher.broadcastMessage(PacketCode.GameOverTime, matchMeta.countDown.toString(),null,null,true);
            }

            return {
                state
            }
        }
    }
    return {
        state
    }
}

const Dune_MatchSignal: nkruntime.MatchSignalFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string): {
    state: nkruntime.MatchState;
    data?: string | undefined;
} | null
{
    return {
        state
    }
}

const Dune_MatchTerminate: nkruntime.MatchTerminateFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number): {
    state: nkruntime.MatchState
} | null
{
    logger.warn(`TAG::Match !!!!!!^^^^^Dune_MatchTerminate time out........^^^^^!!!!!! is ${ctx.matchId}`);
    return {state};
}
