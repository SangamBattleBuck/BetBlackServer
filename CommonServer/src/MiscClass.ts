const emptyResponse = '{responseCode:501,\nmessage:\"emptyResponse or NotImplemented or improper json received \"}';
const playerReadyResponse = '{responseCode:200,\nmessage:\"Server is ready waiting for you to send player ready (opcode =2)\"}';
const const_Str_Success='Success';
const const_PlayerReadyWaitTime=100;

//<editor-fold desc="gameState Data class">

class PlayerStateData
{
    userId:string;
    playerDetails: PlayerDetailReceived;
    score: number;
    playerReady:boolean;
    public constructor(playerDetails: PlayerDetailReceived,userId :string)
    {
        this.playerDetails = playerDetails;
        this.score = 0;
        this.playerReady=false;
        this.userId=userId;
    }
}

// class PlayersStateGame
// {
//     players: Map<string,PlayerStateData>;
//
//     constructor()
//     {
//         this.players = new Map<string,PlayerStateData>();
//     }
//
//     AddPlayer(playerData: PlayerStateData):void
//     {
//         this.players.set(playerData.nakamaPresence.userId,playerData);
//     }
//
//     Remove(playerData: PlayerStateData):boolean
//     {
//         return this.players.delete(playerData.nakamaPresence.userId);
//     }
//
//     IsAllPlayerReady() :boolean
//     {
//         let allReady=true;
//         this.players.forEach((v)=>{
//             allReady=allReady&& v.playerReady;
//         })
//         return allReady;
//     }
// }

class MatchMakeState
{
    roomId: string;
    minPlayerCount: number;
    maxPlayerCount: number;
    currentPlayerCount: number;
    matchMakeWaitTime: number;
    _matchState: MatchStateCode;
    gamePlayTime: number
    matchMakingStartTime: number;
    matchMakingEndTime: number;
    gamePlayStartTime: number;
    gamePlayEndTime: number;
    waitingPlayReadyStartTime: number;
    waitingPlayReadyEndTime: number;
    countDown: number;
    lastCountTime: number;

    constructor(roomId: string, minPlayerCount: number, maxPlayerCount: number, currentPlayerCount: number, matchMakeWaitTime: number, gamePlayTime: number, matchStated = MatchStateCode.MatchCreated)
    {
        this.roomId = roomId;
        this.minPlayerCount = minPlayerCount;
        this.maxPlayerCount = maxPlayerCount;
        this.currentPlayerCount = currentPlayerCount;
        this.matchMakeWaitTime = matchMakeWaitTime;
        this._matchState = matchStated;
        this.gamePlayTime = gamePlayTime;
        this.matchMakingStartTime = 0;
        this.gamePlayStartTime = 0;
        this.matchMakingEndTime = 0;
        this.gamePlayEndTime = 0;
        this.waitingPlayReadyStartTime = 0;
        this.waitingPlayReadyEndTime = 0;
        this.countDown = 5;
        this.lastCountTime = 0;
    }

    get matchState(): MatchStateCode
    {
        return this._matchState;
    }

    set matchState(value: MatchStateCode)
    {
        if (value != this._matchState)
        {
            let currentTime = Date.now();
            switch (value)
            {
                case MatchStateCode.MatchCreated:
                    break;
                case MatchStateCode.WaitingForMatchMaking:
                    this.matchMakingStartTime = currentTime;
                    this.matchMakingEndTime = currentTime + this.matchMakeWaitTime * 1000;
                    break;
                case MatchStateCode.WaitingForPlayerReady:
                    this.waitingPlayReadyStartTime = currentTime;
                    this.waitingPlayReadyEndTime = currentTime + const_PlayerReadyWaitTime * 1000;
                    break;
                case MatchStateCode.MatchStarted:
                    this.gamePlayStartTime = currentTime;
                    this.gamePlayEndTime = currentTime + this.gamePlayTime * 1000;
                    break;

            }
            this._matchState = value;
        }
    }

    toString(): string
    {
        return `{roomId:${this.roomId},minPlayerCount:${this.minPlayerCount},
        maxPlayerCount:${this.maxPlayerCount},currentPlayerCount:${this.currentPlayerCount}, 
        matchMakeWaitTime:${this.matchMakeWaitTime},matchStated:${this.matchState},
        gamePlayTime${this.gamePlayTime}`;
    }
}
//</editor-fold>

//<editor-fold desc="receiving Data class">

class MatchMakingDetailsReceived
{
    roomId: string ;
    minPlayerCount: number;
    maxPlayerCount: number;
    matchMakeWaitTime: number;
    gamePlayTime: number

    constructor(roomId: string, minPlayerCount: number, maxPlayerCount: number, matchMakeWaitTime: number, gamePlayTime: number)
    {
        this.roomId = roomId;
        this.minPlayerCount = minPlayerCount;
        this.maxPlayerCount = maxPlayerCount;
        this.matchMakeWaitTime = matchMakeWaitTime;
        this.gamePlayTime = gamePlayTime;
    }

    // Method to display student information
    toString(): string
    {
        return `{roomId: ${this.roomId},minPlayerCount: ${this.minPlayerCount},
        maxPlayerCount: ${this.maxPlayerCount},matchMakeWaitTime: ${this.matchMakeWaitTime}}
        ,gamePlayTime:${this.gamePlayTime}`;
    }


}

class PlayerDetailReceived
{
    playerName: string;
    playerAvatarId: string;
    playerGameId: string;
    playerDeviceId: string;

    constructor(playerName: string, playerAvatarId: string, playerGameId: string, playerDeviceId: string)
    {
        this.playerName = playerName;
        this.playerAvatarId = playerAvatarId;
        this.playerGameId = playerGameId;
        this.playerDeviceId = playerDeviceId;
    }
}
//</editor-fold>

//<editor-fold desc="Response Data class">

abstract class ApiResponse<T>
{
    responseCode: ResponseCode;
    message: string;
    data: T;

    constructor(data: T,responseCode: ResponseCode = ResponseCode.OK, message: string = const_Str_Success)
    {
        this.responseCode = responseCode;
        this.message = message;
        this.data = data;
    }
}

class MatchMakingResponseData
{
    roomId: string;
    matchId: string;
    constructor(roomId: string, matchId: string)
    {
        this.roomId = roomId;
        this.matchId = matchId;
    }
}

class MatchMakingResponse extends ApiResponse<MatchMakingResponseData>
{

}
//</editor-fold>

//<editor-fold desc="supporting Functional Data class">

class WaitingMatches<T>
{
    public waitingMatchesByRoomId: Map<string, T>;
    public waitingMatchesByMatchId: Map<string, T>;

    public constructor()
    {
        this.waitingMatchesByRoomId = new Map<string, T>();
        this.waitingMatchesByMatchId = new Map<string, T>();
    }

    public Set(roomId: string, matchId: string, mmr: T): void
    {
        this.waitingMatchesByRoomId.set(roomId, mmr);
        this.waitingMatchesByMatchId.set(matchId, mmr);
    }

    public GetMMRByRoomId(roomId: string): T | undefined
    {
        if (this.waitingMatchesByRoomId.has(roomId))
        {
            return this.waitingMatchesByRoomId.get(roomId);
        }
        return undefined;
    }

    public GetMMRByMatchId(matchId: string): T | undefined
    {
        if (this.waitingMatchesByMatchId.has(matchId))
        {
            return this.waitingMatchesByMatchId.get(matchId);
        }
        return undefined;
    }

    public DeletedByRoomId(matchId: string): boolean
    {
        this.waitingMatchesByMatchId.delete(matchId)
        return this.waitingMatchesByRoomId.delete(matchId);
    }

    public DeletedByMatchId(matchId: string): boolean
    {
        this.waitingMatchesByRoomId.delete(matchId)
        return this.waitingMatchesByMatchId.delete(matchId);
    }
}
//</editor-fold>