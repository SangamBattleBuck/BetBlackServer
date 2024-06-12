
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
    let matchMeta= new MatchMateState(matchDetail.roomId,matchDetail.minPlayerCount,matchDetail.maxPlayerCount,0,matchDetail.matchMakeWaitTime,matchDetail.gamePlayTime);
    let currentTime = Date.now();
    matchMeta.matchMakingStartTime=currentTime;
    matchMeta.matchMakingEndTime=currentTime + matchMeta.matchMakeWaitTime * 1000;
    return {
        state: {
            matchMeta:matchMeta,
            players:{}
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
    let matchMeta:MatchMateState=state.matchMeta;
    logger.warn(`TAG:MatchJoinAttempted state: ${state.toString()}`);
    logger.warn(`TAG:MatchJoinAttempted metadata:${metadata.toString()}`);
    if(matchMeta.currentPlayerCount<matchMeta.maxPlayerCount)
    {
        return {
            state,
            accept: true
        };
    }
    else
    {
        return {
            state,
            accept: false,
            rejectMessage:'room is full'
        };
    }
}

const Dune_MatchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {
    state: nkruntime.MatchState
} | null
{
    let matchMeta:MatchMateState=state.matchMeta;
    matchMeta.currentPlayerCount+=1;
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
    let matchMeta:MatchMateState=state.matchMeta;
    matchMeta.currentPlayerCount-=1;
    return {state};
}

 const Dune_MatchLoop: nkruntime.MatchLoopFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): {
    state: nkruntime.MatchState;
} | null
{
    let matchMeta:MatchMateState=state.matchMeta;
    let currentTime=Date.now();
    if(matchMeta.matchStated == false)
    {
        if(currentTime > matchMeta.matchMakingEndTime)
        {
            //Match make waiting time is over
            if (matchMeta.currentPlayerCount >= matchMeta.minPlayerCount)
            {
                // has found minimum required player so starting the match
                matchMeta.matchStated = true;
                matchMeta.gamePlayStartTime = currentTime;
                matchMeta.matchMakingEndTime = currentTime+ matchMeta.gamePlayTime * 1000;
                logger.warn("TAG::Match Started min player found");
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
            logger.warn(`TAG::Match waiting........${currentTime.toString()}>${matchMeta.matchMakingEndTime.toString()} || ${currentTime>matchMeta.matchMakingEndTime}`);
            return {
                state
            }
        }

    }
    else
    {
        if(currentTime > matchMeta.gamePlayEndTime)
        {
            //Game over due to time out
            logger.warn("TAG::Match over due to time out");
            //TODO write dispatcher message here and conclude game
            return null;
        }
        else
        {
            //TODO Write Game logic here
            logger.warn("TAG::Match GameLogic");
            return {
                state
            }
        }
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
