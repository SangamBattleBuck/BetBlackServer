const Get_Ping: nkruntime.RpcFunction = (ctx, logger, nk, payload) => {
    return JSON.stringify({ message: "pong" });
};


let InitModule: nkruntime.InitModule = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {

    logger.warn('Tag::serverMain start Init===V003');
    //<editor-fold desc="Dunes">
    initializer.registerMatch(dune_gameName, {
        matchInit: Dune_MatchInit,
        matchJoinAttempt: Dune_MatchJoinAttempted,
        matchJoin: Dune_MatchJoin,
        matchLeave: Dune_MatchLeave,
        matchLoop: Dune_MatchLoop,
        matchSignal: Dune_MatchSignal,
        matchTerminate: Dune_MatchTerminate,
    });
    initializer.registerRpc('Dunes_CreateMatch', Dune_CreateMatch);
    initializer.registerRpc("Get_Ping", Get_Ping);
    //</editor-fold>
    logger.warn('Tag::serverMain start Done===v003');
}