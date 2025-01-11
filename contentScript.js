// Aria Labels
const SPREAD_BETTING_ARIA = 'div[aria-label*="Spread Betting,"]';
const TEN_POINTS_ARIA = 'div[aria-label*="To Score 10+ Points,"]';

// Numberic Constants
const REFRESH_INTERVAL = 2000;
const MAX_RETRIES = 30;
const CURRENT_SEASON = 2025;

// API Endpoint
const ESPN_GET_ALL_PLAYERS_URL =
  "https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?limit=20000";
const ESPN_GET_STATS_FROM_ID_URL = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${CURRENT_SEASON}/types/2/athletes/`;

// ESPN API Constants
const OFFENSE_STATS_INDEX = 2;
const PPG_STATS_INDEX = 30;

// Need to use intervals because FanDuel does not load information instantly
// Use interval to check if info is loaded periodically
chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
  if (obj == "MAIN") {
    var counter = 0;
    const intervalId = setInterval(async () => {
      const spreadElements = document.querySelectorAll(SPREAD_BETTING_ARIA);
      if (spreadElements.length > 0) {
        // Scrape spread from page
        processOdds(spreadElements[0].children[0]);
        clearInterval(intervalId);
      }
      counter += 1;
      if (counter > MAX_RETRIES) {
        console.log("couldn't find div");
        clearInterval(intervalId);
      }
    }, REFRESH_INTERVAL);
  } else if (obj == "PLAYERPOINTS") {
    var counter = 0;
    const intervalId = setInterval(async () => {
      const playerElements = document.querySelectorAll(TEN_POINTS_ARIA);
      if (playerElements.length > 0) {
        clearInterval(intervalId);
        [...playerElements].forEach(async (div) => {
          const playerName = div.ariaLabel.split(", ")[1];
          const ppg = await getPlayerPPG(playerName);
          var playerNameDivParent =
            div.parentElement.parentElement.parentElement;
          var playerNameDiv =
            playerNameDivParent.children[0].children[1].children[0].children[0];
          playerNameDiv.innerText = playerName + ": Average ppg " + ppg;
        });
      }
      counter += 1;
      if (counter > MAX_RETRIES) {
        console.log("couldn't find div");
        clearInterval(intervalId);
      }
    }, REFRESH_INTERVAL);
  }
});

function processOdds(oddsElement) {
  // To add
  console.log(oddsElement.innerHTML);
}

async function getPlayerPPG(playerName) {
  playerName = playerName.split(" ");
  // Once scraped player, find ESPN id from name and then stats from ID
  var id = await GetESPNIdFromPlayerName(playerName[0], playerName[1]);
  var statsJson = await getStatsFromESPNPlayerID(id);
  return statsJson["splits"]["categories"][OFFENSE_STATS_INDEX]["stats"][
    PPG_STATS_INDEX
  ]["displayValue"];
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
  const resp = await fetch(
    ESPN_GET_STATS_FROM_ID_URL + `${id}/statistics/`,
    options,
  );
  const json = await resp.json();
  return json;
}
