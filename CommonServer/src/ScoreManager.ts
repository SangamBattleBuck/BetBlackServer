
const minCheckHeight = 7;

enum LandingType {
    Perfect = 4,
    Good = 2,
    Normal = 1,
    Fail = 0

}


function CalculateHeightScore(playerHeight: number, lastLanding: LandingType): number {
    // Perform some calculations on the parameters
    var score = ((playerHeight - minCheckHeight) / 3) * lastLanding;

    // Return the calculated score
    return score;
}

function CalculateLandingScore(playerLandingAngle: number, playerVelocity: number): number {
    // Perform some calculations on the parameters

    let landingType = LandingType.Fail;

    playerScoreSettings.forEach(item => {
        if (playerLandingAngle <= item.angle && playerVelocity >= item.velocity) {
            landingType = item.type;
        }
    });

    // Return the calculated score
    return landingType;
}



const playerScoreSettings = [
    {
        type: LandingType.Perfect,
        angle: 20,
        velocity: 35,
    },
    {
        type: LandingType.Good,
        angle: 30,
        velocity: 30,
    },
    {
        type: LandingType.Normal,
        angle: 45,
        velocity: 0,
    },
    {
        type: LandingType.Fail,
        angle: 90,
        velocity: 30,
    },
]

function SetPlayerScore(messages: nkruntime.MatchMessage[], state: any) {


    messages.forEach(function (message) {

        let messageType = message.opCode;
        let messagepayload = JSON.parse(JSON.stringify(message.data));

        let player = state.players[message.sender.userId];


        if (messageType == 1) {
            let score = CalculateHeightScore(messagepayload.playerHeight, player.lastLanding);
            player.score += score;
        }
        else if (messageType == 2) {
            let score = CalculateLandingScore(messagepayload.playerLandingAngle, messagepayload.playerVelocity);
            player.lastLanding = score;
        }
        // dispatcher.broadcastMessage(1, player, null, null);
    });

}
