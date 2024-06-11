let InitModule: nkruntime.InitModule = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer)
{

    logger.warn('Tag::serverMain start Init');
    //<editor-fold desc="Dunes">
    initializer.registerMatch('Dunes', {
        matchInit: Dune_MatchInit,
        matchJoinAttempt: Dunes_MatchJoinAttempted,
        matchJoin: Dunes_MatchJoin,
        matchLeave: Dunes_MatchLeave,
        matchLoop: Dunes_MatchLoop,
        matchSignal: Dunes_MatchSignal,
        matchTerminate: Dunes_MatchTerminate
    });
    initializer.registerRpc('dunes_creatematch',Dunes_CreateMatch);
    //</editor-fold>
    logger.warn('Tag::serverMain start Done');
}



// abstract class Response<T>
// {
//     responseCode: number;
//     message: string;
//     data: T;
//
//     constructor(responseCode: number = 101, message: string = "Success", data: T)
//     {
//         this.responseCode = responseCode;
//         this.message = message;
//         this.data = data;
//     }
// }

  const emptyResponse='{responseCode:501,\nmessage:\"emptyResponse or NotImplemented or improper json received \"}';


  class PlayerDetails
{
    playerName: string="";
    playerAvatarId: string="";
}

  class MatchMakingDetails
{
    roomId: string = "not found";
    minPlayerCount: number = 1;
    maxPlayerCount: number = 1;
    autoDestroyRoom: number = 3600;

    constructor(roomId: string, minPlayerCount: number, maxPlayerCount: number, autoDestroyRoom: number)
    {
        this.roomId = roomId;
        this.minPlayerCount = minPlayerCount;
        this.maxPlayerCount = maxPlayerCount;
        this.autoDestroyRoom = autoDestroyRoom;
    }
    // Method to display student information
    toString(): string
    {
        return `roomId: ${this.roomId}, maxPlayerCount: ${this.maxPlayerCount}, minPlayerCount: ${this.minPlayerCount}, autoDestroyRoom: ${this.autoDestroyRoom}`;
    }


}

class MatchMakingResponseData
{
    roomId: string;
    matchId: string;
    minPlayerCount: number = 1;
    maxPlayerCount: number = 1;
    currentPlayerCount: number = 0;
    playerDetails: PlayerDetails[] | null;

    constructor(roomId: string, matchId: string, minPlayerCount: number,maxPlayerCount: number, playerDetails: PlayerDetails[] | null)
    {
        this.roomId = roomId;
        this.matchId = matchId;
        this.maxPlayerCount = maxPlayerCount;
        this.minPlayerCount = minPlayerCount;
        this.playerDetails = playerDetails;
    }
}

// class MatchMakingResponse extends Response<MatchMakingResponseData>
// {
//
// }

// interface IGameState extends  nkruntime.MatchState
// {
//
// }

  class WaitingMatches
{
    public waitingMatchesByRoomId : Map<string,MatchMakingResponseData>;
    public waitingMatchesByMatchId :Map<string,MatchMakingResponseData>;

    public constructor()
    {
        this.waitingMatchesByRoomId = new Map<string,MatchMakingResponseData>();
        this.waitingMatchesByMatchId = new Map<string,MatchMakingResponseData>();
    }

    public Set(roomId :string ,matchId:string,mmr: MatchMakingResponseData) : void
    {
        this.waitingMatchesByRoomId.set(roomId,mmr);
        this.waitingMatchesByMatchId.set(matchId,mmr);
    }

    public GetMMRByRoomId(roomId:string) : MatchMakingResponseData |null
    {
        if(this.waitingMatchesByRoomId.has(roomId))
        {
            return this.waitingMatchesByRoomId.get(roomId) ||  null;
        }
        else
        {
            return null;
        }
    }

    public GetMMRByMatchId(matchId:string) : MatchMakingResponseData |null
    {
        if(this.waitingMatchesByMatchId.has(matchId))
        {
            return this.waitingMatchesByMatchId.get(matchId) ||  null;
        }
        else
        {
            return null;
        }
    }

    public DeletedByRoomId (matchId:string) : boolean
    {
        this.waitingMatchesByMatchId.delete(matchId)
        return this.waitingMatchesByRoomId.delete(matchId);
    }

    public DeletedByMatchId (matchId:string) : boolean
    {
        this.waitingMatchesByRoomId.delete(matchId)
        return this.waitingMatchesByMatchId.delete(matchId);
    }
}

class ScoreData
{
    public playerId: string;
    public score: number;

    constructor(playerId: string, score: number)
    {
        this.playerId = playerId;
        this.score = score;
    }
}
//================Dunes

let waitingMap= new WaitingMatches();
const gameName: string = 'Dunes';
const Dunes_CreateMatch:nkruntime.RpcFunction=function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string
{
    logger.warn(`TAG::PayLoad ${payload}`);
    let responseJson = emptyResponse;
    let matchDetail: MatchMakingDetails | null = null;
    try
    {
        matchDetail= JSON.parse(payload);
    } catch (error)
    {
        logger.error(`TAG::PayLoad Failed to deserialize JSON: ${error}`);
    }
    logger.warn(`TAG::PayLoad successfully parsed`);
    if (matchDetail == null)
    {
        logger.error(`TAG::PayLoad responseJson is null`);
        return responseJson;
    } else
    {
        logger.error(`TAG::PayLoad responseJson is not null`);
        let mmResponseData = waitingMap.GetMMRByRoomId(matchDetail.roomId);
        logger.error(`TAG::PayLoad waitingMap 1`);
        if (mmResponseData == null)
        {
            logger.error(`TAG::PayLoad waitingMap 2`);
            let matchId = '';
            try
            {
                 matchId = nk.matchCreate('Dunes');
            }
            catch (ex)
            {
                logger.error(`TAG::PayLoad waitingMap 2.2 failed ${ex}`);
            }

            logger.error(`TAG::PayLoad waitingMap 3`);
            mmResponseData = new MatchMakingResponseData(matchDetail.roomId, matchId, matchDetail.minPlayerCount, matchDetail.maxPlayerCount, null);
            logger.error(`TAG::PayLoad waitingMap 4`);
            try
            {
                waitingMap.Set(matchDetail?.roomId, matchId, mmResponseData);
            }
            catch (error)
            {
                logger.error(`TAG::PayLoad failed waitingMap: ${error}`);
            }
        }
        logger.error(`TAG::PayLoad waitingMap 5`);
        let json='';
        try
        {
             json = JSON.stringify(mmResponseData);
        }
        catch (error)
        {
            logger.error(`TAG::PayLoad failed JSON.stringify: ${error}`);
        }
        return json;
    }
}
  const Dune_MatchInit: nkruntime.MatchInitFunction<nkruntime.MatchState> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [p: string]: any; }): { state: nkruntime.MatchState; tickRate: number; label: string; }
{
    let mmr = waitingMap.GetMMRByMatchId(ctx.matchId);

    if (mmr == null)
    {
        let mmd = new MatchMakingDetails('Not_Found', 1, 1, 3600);
        logger.error('Tag::Dunes error MMR is null')
        return {
            state: {
                matchData: mmd,
                scores: Array.from({length: 1}, () => new ScoreData("", 0))
            },
            tickRate: 60, // 1 tick per second = 1 MatchLoop func invocations per second
            label: gameName
        };
    }
    let mmd = new MatchMakingDetails(mmr.roomId, mmr.minPlayerCount, mmr.maxPlayerCount, 3600);
    return {
        state: {
            matchData: mmd,
            scores: Array.from({length: mmr.maxPlayerCount}, () => new ScoreData("", 0))
        },
        tickRate: 1, // 1 tick per second = 1 MatchLoop func invocations per second
        label: gameName
    };
}

  const Dunes_MatchJoinAttempted: nkruntime.MatchJoinAttemptFunction = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: { [key: string]: any; }): { state: nkruntime.MatchState; accept: boolean; rejectMessage?: string | undefined; } | null
{
    return {
        state,
        accept: true
    };
}

  const Dunes_MatchJoin:nkruntime.MatchJoinFunction=function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): { state: nkruntime.MatchState } | null
{
    let mmr= waitingMap.GetMMRByMatchId(ctx.matchId);
    if(mmr != null)
    {
        mmr.currentPlayerCount+=1;
    }
    else
    {
        logger.error('Tag::serverBase MatchJoin mmr is null');
    }
    return {state};
}

  const Dunes_MatchLeave:nkruntime.MatchLeaveFunction=function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): { state: nkruntime.MatchState } | null
{
    let mmr=waitingMap.GetMMRByMatchId(ctx.matchId);
    if(mmr != null)
    {
        mmr.currentPlayerCount-=1;
    }
    else
    {
        logger.error('Tag::serverBase MatchJoin mmr is null');
    }
    return { state};
}

  const Dunes_MatchLoop: nkruntime.MatchLoopFunction = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): { state: nkruntime.MatchState; } | null
{

    return {
        state
    }
}

  const Dunes_MatchSignal: nkruntime.MatchSignalFunction= function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string): { state: nkruntime.MatchState; data?: string | undefined; } | null
{
    return {
        state
    }
}

  const Dunes_MatchTerminate:nkruntime.MatchTerminateFunction=function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number): {
    state: nkruntime.MatchState
} | null
{
    waitingMap.DeletedByMatchId(ctx.matchId);
    logger.warn(`Tag::serverBase MatchTerminate mmr is ${ctx.matchId}`);
    return {state};
}


