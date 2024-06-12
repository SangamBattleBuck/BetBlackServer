
    const emptyResponse = '{responseCode:501,\nmessage:\"emptyResponse or NotImplemented or improper json received \"}';
    const const_Str_Success='Success'
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

    class PlayerDetails
    {
        playerName: string = "";
        playerAvatarId: string = "";
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

        constructor(roomId: string, matchId: string, minPlayerCount: number, maxPlayerCount: number, playerDetails: PlayerDetails[] | null)
        {
            this.roomId = roomId;
            this.matchId = matchId;
            this.maxPlayerCount = maxPlayerCount;
            this.minPlayerCount = minPlayerCount;
            this.playerDetails = playerDetails;
        }
    }

    class MatchMakingResponse extends ApiResponse<MatchMakingResponseData>
    {

    }

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