
const emptyResponse = '{responseCode:501,\nmessage:\"emptyResponse or NotImplemented or improper json received \"}';
const const_Str_Success = 'Success';

//<editor-fold desc="gameState Data class">

class PlayerDetailState {
    name: string;
    avatarId: string;
    deviceId: string;
    score: number;
    constructor(name: string, avatarId: string, score: number, deviceId: string) {
        this.name = name;
        this.avatarId = avatarId;
        this.score = score;
        this.deviceId = deviceId;
    }
    toString(): string {
        return `{playerName:${this.name},avatarId:${this.avatarId}, score:${this.score}`;
    }
}

class MatchMateState {
    roomId: string;
    minPlayerCount: number;
    maxPlayerCount: number;
    currentPlayerCount: number;
    matchMakeWaitTime: number;
    matchStated = false;
    gamePlayTime: number
    matchMakingStartTime: number;
    matchMakingEndTime: number;
    gamePlayStartTime: number;
    gamePlayEndTime: number;

    constructor(roomId: string, minPlayerCount: number, maxPlayerCount: number, currentPlayerCount: number, matchMakeWaitTime: number, gamePlayTime: number, matchStated: boolean = false) {
        this.roomId = roomId;
        this.minPlayerCount = minPlayerCount;
        this.maxPlayerCount = maxPlayerCount;
        this.currentPlayerCount = currentPlayerCount;
        this.matchMakeWaitTime = matchMakeWaitTime;
        this.matchStated = matchStated;
        this.gamePlayTime = gamePlayTime;
        this.matchMakingStartTime = 0;
        this.gamePlayStartTime = 0;
        this.matchMakingEndTime = 0;
        this.gamePlayEndTime = 0;
    }

    toString(): string {
        return `{roomId:${this.roomId},minPlayerCount:${this.minPlayerCount},
            maxPlayerCount:${this.maxPlayerCount},currentPlayerCount:${this.currentPlayerCount}, 
            matchMakeWaitTime:${this.matchMakeWaitTime},matchStated:${this.matchStated},
            gamePlayTime${this.gamePlayTime}`;
    }


}
//</editor-fold>

//<editor-fold desc="receiving Data class">

class MatchMakingDetailsReceived {
    roomId: string;
    minPlayerCount: number;
    maxPlayerCount: number;
    matchMakeWaitTime: number;
    gamePlayTime: number

    constructor(roomId: string, minPlayerCount: number, maxPlayerCount: number, matchMakeWaitTime: number, gamePlayTime: number) {
        this.roomId = roomId;
        this.minPlayerCount = minPlayerCount;
        this.maxPlayerCount = maxPlayerCount;
        this.matchMakeWaitTime = matchMakeWaitTime;
        this.gamePlayTime = gamePlayTime;
    }

    // Method to display student information
    toString(): string {
        return `{roomId: ${this.roomId},minPlayerCount: ${this.minPlayerCount},
            maxPlayerCount: ${this.maxPlayerCount},matchMakeWaitTime: ${this.matchMakeWaitTime}}
            ,gamePlayTime:${this.gamePlayTime}`;
    }


}
//</editor-fold>

//<editor-fold desc="Response Data class">

abstract class ApiResponse<T> {
    responseCode: ResponseCode;
    message: string;
    data: T;

    constructor(data: T, responseCode: ResponseCode = ResponseCode.OK, message: string = const_Str_Success) {
        this.responseCode = responseCode;
        this.message = message;
        this.data = data;
    }
}

class MatchMakingResponseData {
    roomId: string;
    matchId: string;
    constructor(roomId: string, matchId: string) {
        this.roomId = roomId;
        this.matchId = matchId;
    }
}

class MatchMakingResponse extends ApiResponse<MatchMakingResponseData> {

}
//</editor-fold>

//<editor-fold desc="supporting Functional Data class">

class WaitingMatches<T> {
    public waitingMatchesByRoomId: Map<string, T>;
    public waitingMatchesByMatchId: Map<string, T>;

    public constructor() {
        this.waitingMatchesByRoomId = new Map<string, T>();
        this.waitingMatchesByMatchId = new Map<string, T>();
    }

    public Set(roomId: string, matchId: string, mmr: T): void {
        this.waitingMatchesByRoomId.set(roomId, mmr);
        this.waitingMatchesByMatchId.set(matchId, mmr);
    }

    public GetMMRByRoomId(roomId: string): T | undefined {
        if (this.waitingMatchesByRoomId.has(roomId)) {
            return this.waitingMatchesByRoomId.get(roomId);
        }
        return undefined;
    }

    public GetMMRByMatchId(matchId: string): T | undefined {
        if (this.waitingMatchesByMatchId.has(matchId)) {
            return this.waitingMatchesByMatchId.get(matchId);
        }
        return undefined;
    }

    public DeletedByRoomId(matchId: string): boolean {
        this.waitingMatchesByMatchId.delete(matchId)
        return this.waitingMatchesByRoomId.delete(matchId);
    }

    public DeletedByMatchId(matchId: string): boolean {
        this.waitingMatchesByRoomId.delete(matchId)
        return this.waitingMatchesByMatchId.delete(matchId);
    }
}
//</editor-fold>