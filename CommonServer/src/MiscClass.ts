const emptyResponse = '{responseCode:501,\nmessage:\"emptyResponse or NotImplemented or improper json received \"}';
const playerReadyResponse = '{responseCode:200,\nmessage:\"Server is ready waiting for you to send player ready (opcode =2)\"}';
const const_Str_Success='Success';
const const_PlayerReadyWaitTime=100;

//<editor-fold desc="gameState Data class">

class PlayerStateData
{
    userId: string;
    playerDetails: PlayerDetailReceived;
    score: number;
    playerReady: boolean;

    public constructor(playerDetails: PlayerDetailReceived, userId: string)
    {
        this.playerDetails = playerDetails;
        this.score = 0;
        this.playerReady = false;
        this.userId = userId;
    }
}

class MatchMakingDetailsReceived
{
    roomId: string ;
    minPlayerCount: number;
    maxPlayerCount: number;
    matchMakeWaitTime: number;
    gamePlayTime: number
    countDown:number;
    gameOverCondition :GameOverConditionCode;
    gameOverConditionWaitTime: number;

    constructor(roomId: string, minPlayerCount: number, maxPlayerCount: number, matchMakeWaitTime: number, gamePlayTime: number, countDown:number,gameOverCondition :GameOverConditionCode, gameOverConditionWaitTime: number)
    {
        this.roomId = roomId;
        this.minPlayerCount = minPlayerCount;
        this.maxPlayerCount = maxPlayerCount;
        this.matchMakeWaitTime = matchMakeWaitTime;
        this.gamePlayTime = gamePlayTime;
        this.gameOverCondition = gameOverCondition;
        this.gameOverConditionWaitTime = gameOverConditionWaitTime
        this.countDown=countDown;
    }

    // Method to display student information
    toString(): string
    {
        return `{roomId: ${this.roomId},minPlayerCount: ${this.minPlayerCount},
        maxPlayerCount: ${this.maxPlayerCount},matchMakeWaitTime: ${this.matchMakeWaitTime}}
        ,gamePlayTime:${this.gamePlayTime}`;
    }

}

class MatchMakeState
{
    roomId: string;
    minPlayerCount: number;
    maxPlayerCount: number;
    gamePlayTime: number
    //<editor-fold desc="MatchState and Times Data class">
    matchState: MatchStateCode;
    currentPlayerCount: number;
    matchMakeWaitTime: number;
    matchMakingStartTime: number;
    matchMakingEndTime: number;
    gamePlayStartTime: number;
    gamePlayEndTime: number;
    waitingPlayReadyStartTime: number;
    waitingPlayReadyEndTime: number;
    countDown: number;
    lastCountTime: number;
    //</editor-fold>
    //<editor-fold desc="MatchState and Times Data class">
    gameOverCondition :GameOverConditionCode;
    gameOverConditionWaitTime: number;
    currentCountDown: number;
    gamePausedStartTime: number;
    gamePausedEndTime: number;

    //</editor-fold>

    constructor(mmdr:MatchMakingDetailsReceived)
    {
        this.roomId = mmdr.roomId;
        this.minPlayerCount = mmdr.minPlayerCount;
        this.maxPlayerCount = mmdr.maxPlayerCount;
        this.currentPlayerCount = 0;
        this.matchMakeWaitTime = mmdr.matchMakeWaitTime;
        this.matchState = MatchStateCode.MatchCreated;
        this.gamePlayTime = mmdr.gamePlayTime;
        this.gameOverCondition = mmdr.gameOverCondition;
        this.gameOverConditionWaitTime = mmdr.gameOverConditionWaitTime
        this.matchMakingStartTime = 0;
        this.gamePlayStartTime = 0;
        this.matchMakingEndTime = 0;
        this.gamePlayEndTime = 0;
        this.waitingPlayReadyStartTime = 0;
        this.waitingPlayReadyEndTime = 0;
        this.countDown = mmdr.countDown;
        this.lastCountTime = 0;
        this.currentCountDown=mmdr.countDown;
        this.gamePausedStartTime=0;
        this.gamePausedEndTime=0;
    }

    // constructor(roomId: string, minPlayerCount: number, maxPlayerCount: number, currentPlayerCount: number, matchMakeWaitTime: number, gamePlayTime: number,gameOverCondition:GameOverConditionCode,gameOverConditionWaitTime:number, matchStated = MatchStateCode.MatchCreated)
    // {
    //     this.roomId = roomId;
    //     this.minPlayerCount = minPlayerCount;
    //     this.maxPlayerCount = maxPlayerCount;
    //     this.currentPlayerCount = currentPlayerCount;
    //     this.matchMakeWaitTime = matchMakeWaitTime;
    //     this.matchState = matchStated;
    //     this.gamePlayTime = gamePlayTime;
    //     this.gameOverCondition = gameOverCondition;
    //     this.gameOverConditionWaitTime = gameOverConditionWaitTime
    //     this.matchMakingStartTime = 0;
    //     this.gamePlayStartTime = 0;
    //     this.matchMakingEndTime = 0;
    //     this.gamePlayEndTime = 0;
    //     this.waitingPlayReadyStartTime = 0;
    //     this.waitingPlayReadyEndTime = 0;
    //     this.countDown = 5;
    //     this.lastCountTime = 0;
    // }
}
//</editor-fold>

//<editor-fold desc="receiving Data class">



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
