const SPREAD_BETTING_ARIA = 'div[aria-label*="Spread Betting,"]';
const REFRESH_INTERVAL = 2000;
const MAX_RETRIES = 30;
const CURRENT_SEASON = 2025;

// API Endpoint
const ESPN_GET_ALL_PLAYERS_URL = "https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?limit=20000"
const ESPN_GET_STATS_FROM_ID_URL = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${CURRENT_SEASON}/types/2/athletes/`

chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
    // Needed because FanDuel does not load the odds instantly
    // Check if the spread element has been populated before proceeding
    var counter = 0;
    const intervalId = setInterval(async () => {
        const spreadElements = document.querySelectorAll(SPREAD_BETTING_ARIA);
        if (spreadElements.length > 0) {
            // Scrape spread from page
            processOdds(spreadElements[0].children[0]);
            clearInterval(intervalId);

            // Once scraped player, find ESPN id from name and then stats from ID
            var id = await GetESPNIdFromPlayerName("LeBron", "James");
            console.log(id);
            await getStatsFromESPNPlayerID(id);
        }
        counter += 1;
        if (counter > MAX_RETRIES) {
            console.log("couldn't find div");
            clearInterval(intervalId);
        }
    }, REFRESH_INTERVAL);
});

function processOdds(oddsElement) {
    // To add
    console.log(oddsElement.innerHTML);
}

async function GetESPNIdFromPlayerName(playerFirstName, playerLastName) {
    const options = {
        method: "GET",
    };
    const resp = await fetch(ESPN_GET_ALL_PLAYERS_URL, options);
    const json = await resp.json();
    filtered = json.items.filter(
        (x) => x.firstName === playerFirstName && x.lastName === playerLastName,
    );
    return filtered[0].id;
}

async function getStatsFromESPNPlayerID(id) {
    const options = {
        method: "GET",
    };
    const resp = await fetch(ESPN_GET_STATS_FROM_ID_URL + `${id}/statistics/`, options);
    const json = await resp.json();
    console.log(json);
    return json;
}
