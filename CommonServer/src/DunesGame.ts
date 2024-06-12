
let dune_waitingMap= new WaitingMatches<MatchMakingResponse>();
const dune_gameName: string = 'Dunes';
const dunne_Tag:string='TAG::Dunes';

const Dune_CreateMatch: nkruntime.RpcFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string
{
    let responseJson = emptyResponse;
    let matchDetail: MatchMakingDetails | null = null;
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
    } else
    {
        let mmResponse = dune_waitingMap.GetMMRByRoomId(matchDetail.roomId);
        if (mmResponse == undefined)
        {
            let matchId = '';
            matchId = nk.matchCreate(dune_gameName,{roomName:matchDetail.roomId,minPlayerCount: matchDetail.minPlayerCount, maxPlayerCount: matchDetail.maxPlayerCount, autoDestroyRoom:matchDetail.autoDestroyRoom});
            let mmData=new MatchMakingResponseData(matchDetail.roomId,matchId,matchDetail.minPlayerCount,matchDetail.maxPlayerCount,null);
            mmResponse = new MatchMakingResponse(mmData);
            dune_waitingMap.Set(matchDetail.roomId, matchId, mmResponse);
        }
        return  JSON.stringify(mmResponse);
    }
}

const Dune_MatchInit: nkruntime.MatchInitFunction<nkruntime.MatchState> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [p: string]: any; }): { state: nkruntime.MatchState; tickRate: number; label: string; }
{
    logger.warn(`${dunne_Tag} Dune_MatchInit 1`)
    let mmd = new MatchMakingDetails(params.roomName, params.minPlayerCount, params.maxPlayerCount, params.autoDestroyRoom);
    logger.warn(`${dunne_Tag} Dune_MatchInit 2 ${mmd}`)
    return {
        state: {
            presences: {},
            score: {},
            match:mmd
        },
        tickRate: 1, // 1 tick per second = 1 MatchLoop func invocations per second
        label: dune_gameName
    };
}

 const Dune_MatchJoinAttempted: nkruntime.MatchJoinAttemptFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {
    [key: string]: any;
}): { state: nkruntime.MatchState; accept: boolean; rejectMessage?: string | undefined; } | null
{
    var curentPlayerCount:number=state.presences.length;
    var mmd:MatchMakingDetails=state.match;
    if(curentPlayerCount<mmd.maxPlayerCount)
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
            accept: true,
            rejectMessage:'room is full'
        };
    }
}

const Dune_MatchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {
    state: nkruntime.MatchState
} | null
{
    presences.forEach(function (p) {
        state.presences[p.userId] = p;
    });
    let mmr = dune_waitingMap.GetMMRByMatchId(ctx.matchId);
    if (mmr != undefined)
    {
        mmr.data.currentPlayerCount += 1;
    }
    else
    {
        logger.error('Tag::serverBase MatchJoin mmr is null');
    }
    return {state};
}

const Dune_MatchLeave: nkruntime.MatchLeaveFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {
    state: nkruntime.MatchState
} | null
{
    let mmr = dune_waitingMap.GetMMRByMatchId(ctx.matchId);
    if (mmr != null)
    {
        mmr.data.currentPlayerCount -= 1;
    } else
    {
        logger.error('Tag::serverBase MatchJoin mmr is null');
    }
    return {state};
}

 const Dune_MatchLoop: nkruntime.MatchLoopFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): {
    state: nkruntime.MatchState;
} | null
{
    logger.warn(`${dunne_Tag} message length ${messages.length}`);
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
