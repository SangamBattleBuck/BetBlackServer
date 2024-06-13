let InitModule: nkruntime.InitModule = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer)
{

    logger.warn('Tag::serverMain start Init===V001');
    //<editor-fold desc="Dunes">
    initializer.registerMatch(dune_gameName, {
        matchInit: Dune_MatchInit,
        matchJoinAttempt: Dune_MatchJoinAttempted,
        matchJoin: Dune_MatchJoin,
        matchLeave: Dune_MatchLeave,
        matchLoop: Dune_MatchLoop,
        matchSignal: Dune_MatchSignal,
        matchTerminate: Dune_MatchTerminate
    });
    initializer.registerRpc('Dunes_CreateMatch',Dune_CreateMatch);
    //</editor-fold>
    logger.warn('Tag::serverMain start Done===v001');
}



