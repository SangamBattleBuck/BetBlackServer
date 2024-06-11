
let dune_waitingMap= new WaitingMatches();
const dune_gameName: string = 'Dunes';

const Dune_CreateMatch: nkruntime.RpcFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string
{
    let responseJson = emptyResponse;
    let matchDetail: MatchMakingDetails | null = null;
    try
    {
        matchDetail = JSON.parse(payload);
    } catch (error)
    {
        logger.error(`TAG::PayLoad Failed to deserialize JSON: ${error}`);
    }
    if (matchDetail == null)
    {
        return responseJson;
    } else
    {
        let mmResponseData = dune_waitingMap.GetMMRByRoomId(matchDetail.roomId);
        if (mmResponseData == null)
        {
            let matchId = '';
            matchId = nk.matchCreate(dune_gameName);
            mmResponseData = new MatchMakingResponseData(matchDetail.roomId, matchId, matchDetail.minPlayerCount, matchDetail.maxPlayerCount, null);
            try
            {
                dune_waitingMap.Set(matchDetail?.roomId, matchId, mmResponseData);
            } catch (error)
            {
                logger.error(`TAG::PayLoad failed waitingMap: ${error}`);
            }
        }
        return  JSON.stringify(mmResponseData);
    }
}

const Dune_MatchInit: nkruntime.MatchInitFunction<nkruntime.MatchState> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [p: string]: any; }): { state: nkruntime.MatchState; tickRate: number; label: string; }
{
    let mmr = dune_waitingMap.GetMMRByMatchId(ctx.matchId);

    if (mmr == null)
    {
        let mmd = new MatchMakingDetails('Not_Found', 1, 1, 3600);
        logger.error('Tag::Dunes error MMR is null')
        return {
            state: {
                matchData: mmd,
                scores: Array.from({length: 1}, () => new ScoreData("", 0))
            },
            tickRate: 1, // 1 tick per second = 1 MatchLoop func invocations per second
            label: dune_gameName
        };
    }
    let mmd = new MatchMakingDetails(mmr.roomId, mmr.minPlayerCount, mmr.maxPlayerCount, 3600);
    return {
        state: {
            matchData: mmd,
            scores: Array.from({length: mmr.maxPlayerCount}, () => new ScoreData("", 0))
        },
        tickRate: 1, // 1 tick per second = 1 MatchLoop func invocations per second
        label: dune_gameName
    };
}

 const Dune_MatchJoinAttempted: nkruntime.MatchJoinAttemptFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {
    [key: string]: any;
}): { state: nkruntime.MatchState; accept: boolean; rejectMessage?: string | undefined; } | null
{
    return {
        state,
        accept: true
    };
}

const Dune_MatchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {
    state: nkruntime.MatchState
} | null
{
    let mmr = dune_waitingMap.GetMMRByMatchId(ctx.matchId);
    if (mmr != null)
    {
        mmr.currentPlayerCount += 1;
    } else
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
        mmr.currentPlayerCount -= 1;
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
    messages.forEach((x, y) =>
    {
        switch (y)
        {
            case 1:
                //dispatcher.broadcastMessage()
                break;
        }
    })
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
