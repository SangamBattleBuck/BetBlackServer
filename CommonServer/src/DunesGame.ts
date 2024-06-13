
let dune_waitingMap= new WaitingMatches<MatchMakingResponse>();
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
        let mmResponse = dune_waitingMap.GetMMRByRoomId(matchDetail.roomId);
        if (mmResponse == undefined)
        {
            //let param={roomName:matchDetail.roomId,minPlayerCount: matchDetail.minPlayerCount, maxPlayerCount: matchDetail.maxPlayerCount, autoDestroyRoom:matchDetail.autoDestroyRoom}
            let matchId = nk.matchCreate(dune_gameName,matchDetail);
            let mmData=new MatchMakingResponseData(matchDetail.roomId,matchId);
            mmResponse = new MatchMakingResponse(mmData);
            dune_waitingMap.Set(matchDetail.roomId, matchId, mmResponse);
        }
        return  JSON.stringify(mmResponse);
    }
}

const Dune_MatchInit: nkruntime.MatchInitFunction<nkruntime.MatchState> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [p: string]: any; }): { state: nkruntime.MatchState; tickRate: number; label: string; }
{
    logger.warn(`TAG:MatchInit 1`);
    let matchDetail:MatchMakingDetailsReceived=params as MatchMakingDetailsReceived;
    logger.warn(`TAG:MatchInit 2`);
    let matchMeta= new MatchMakeState(matchDetail.roomId,matchDetail.minPlayerCount,matchDetail.maxPlayerCount,0,matchDetail.matchMakeWaitTime,matchDetail.gamePlayTime);
    let player=new PlayersState();
    matchMeta.matchState=MatchStateCode.MatchInitialized;
    return {
        state: {
            matchMeta:matchMeta,
            players: player,
        },
        tickRate: 1, // 1 tick per second = 1 MatchLoop func invocations per second
        label: dune_gameName
    };
}

 const Dune_MatchJoinAttempted: nkruntime.MatchJoinAttemptFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {
    [key: string]: any;
}): { state: nkruntime.MatchState; accept: boolean; rejectMessage?: string | undefined; } | null
{
    logger.warn(`TAG:MatchJoinAttempted 1`);
    let matchMeta:MatchMakeState=state.matchMeta;
    logger.warn(`TAG:MatchJoinAttempted state: ${JSON.stringify(state.toString)}`);
    logger.warn(`TAG:MatchJoinAttempted metadata:${JSON.stringify(metadata)}`);
    let playerState: PlayersState=state.players;
    //Resume case need to handled
    if(matchMeta.currentPlayerCount<matchMeta.maxPlayerCount)
    {
        try
        {
            let playerDetails:PlayerDetailReceived= JSON.parse(metadata.playerDetails);
            let joinPlayerState:PlayerStateData= new PlayerStateData(playerDetails,presence);
            playerState.Add(joinPlayerState);
        }
        catch (ex)
        {
            logger.warn(`TAG:MatchJoinAttempted parse failed `);
        }

        return {
            state,
            accept: true,
        };
    }
    else
    {
        return {
            state,
            accept: false,
            rejectMessage:''
        };
    }
}

const Dune_MatchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {
    state: nkruntime.MatchState
} | null
{
    let matchMeta:MatchMakeState=state.matchMeta;
    matchMeta.currentPlayerCount+=1;
    if(matchMeta.currentPlayerCount == matchMeta.maxPlayerCount)
    {
        // Max player found so starting the match
        matchMeta.matchState=MatchStateCode.WaitingForPlayerReady;
        dispatcher.broadcastMessage(1,playerReadyResponse,null,null,true);
    }
    logger.warn(`TAG:MatchJoin ${matchMeta}`);
    logger.warn(`TAG:MatchJoin ${state.toString()}`);

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
    let playersState:PlayersState=state.players;
    switch (matchMeta.matchState)
    {
        case MatchStateCode.MatchInitialized:
            break;
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
                        logger.warn("TAG::Match not found force stop");
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
                        let uId=msg.sender.userId;
                        let t=playersState.player.get(uId);
                        if(t != undefined)
                        {
                            t.playerReady = true;
                        }
                    }
                }
                if(playersState.IsAllPlayerReady())
                {
                    logger.warn(`TAG::Match ####All playerReady received........####`);
                    matchMeta.matchState=MatchStateCode.StartCountDown;
                }
                return {
                    state
                }
            } else
            {
                logger.warn("TAG::Match found by player took too long to get ready forceStop");
                return null;
            }
        }
        case MatchStateCode.StartCountDown:
        {
            if(matchMeta.countDown>=0 && currentTime>matchMeta.lastCountTime)
            {
                logger.warn(`TAG::Match ####Count Down ${matchMeta.countDown}........####`);
                dispatcher.broadcastMessage(PacketCode.CountDown, matchMeta.countDown.toString(),null,null,true);
                matchMeta.countDown-=1;
                matchMeta.lastCountTime=currentTime+1000;//added sec
            }
            else
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
            logger.warn(`TAG::Match *****GameLogic running........***`);
            if (matchMeta.currentPlayerCount >= matchMeta.minPlayerCount)
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
    dune_waitingMap.DeletedByMatchId(ctx.matchId);
    logger.warn(`Tag::serverBase MatchTerminate mmr is ${ctx.matchId}`);
    return {state};
}
