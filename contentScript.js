// Aria Labels
const SPREAD_BETTING_ARIA = 'div[aria-label*="Spread Betting,"]';
const TEN_POINTS_ARIA = 'div[aria-label*="To Score 10+ Points,"]';
const FIFTEEN_POINTS_ARIA = 'div[aria-label*="To Score 15+ Points,"]';
const FIFTEEN_POINTS_ARIA_EXPAND = 'div[aria-label*="To Score 15+ Points"]';
const ONE_MADE_THREE_ARIA = 'div[aria-label*="1+ Made Threes,"]';
const REBOUNDS_ARIA = 'div[aria-label*="To Record 4+ Rebounds,"]';

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
const GENERAL_STATS_INDEX = 1;
const PPG_NAME = "PPG";
const AVG_THREES_NAME = "A3PM";
const RPG_NAME = "RPG";

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
    processPlayerStats(
      "To Score ",
      "",
      "Points",
      [15, 20, 25, 30, 35, 40, 45],
      TEN_POINTS_ARIA,
      PPG_NAME,
      OFFENSE_STATS_INDEX,
    );
  } else if (obj == "PLAYERTHREES") {
    processPlayerStats(
      "",
      "Made ",
      "Threes",
      [2, 3, 4, 5, 6, 7, 8],
      ONE_MADE_THREE_ARIA,
      AVG_THREES_NAME,
      OFFENSE_STATS_INDEX,
    );
  } else if (obj == "PLAYERREBOUNDS") {
    processPlayerStats(
      "To Record ",
      "",
      "Rebounds",
      [4, 6, 8, 10, 12, 14, 16],
      REBOUNDS_ARIA,
      RPG_NAME,
      GENERAL_STATS_INDEX,
    );
  }
});

function processPlayerStats(
  firstVerb,
  secondVerb,
  METRIC,
  metricLevels,
  INITIAL_LOAD_ARIA,
  ESPN_STAT_IDENTIFIER,
  STATS_INDEX,
) {
  var counter = 0;
  const intervalId = setInterval(async () => {
    // Set up onClick events for point sections
    const restOfPage = document.querySelectorAll(INITIAL_LOAD_ARIA);
    // If page finished loading (point expanders loaded)
    if (restOfPage.length > 0) {
      clearInterval(intervalId);
      metricLevels.forEach((metricNumber) => {
        aria = `div[aria-label*="${firstVerb}${metricNumber}+ ${secondVerb}${METRIC},"]`;
        aria_expand = `div[aria-label*="${firstVerb}${metricNumber}+ ${secondVerb}${METRIC}"]`;
        pointDiv = document.querySelectorAll(aria_expand)[0];
        if (pointDiv) {
          pointDiv.addEventListener("click", function () {
            updatePageWithPlayerInfo(
              `div[aria-label*="${firstVerb}${metricNumber}+ ${secondVerb}${METRIC},"]`,
              METRIC,
              ESPN_STAT_IDENTIFIER,
              STATS_INDEX,
            );
          });
        }
      });
      updatePageWithPlayerInfo(
        INITIAL_LOAD_ARIA,
        METRIC,
        ESPN_STAT_IDENTIFIER,
        STATS_INDEX,
      );
    }

    counter += 1;
    if (counter > MAX_RETRIES) {
      console.log("couldn't find div");
      clearInterval(intervalId);
    }
  }, REFRESH_INTERVAL);
}

function processOdds(oddsElement) {
  // To add
  console.log(oddsElement.innerHTML);
}

async function updatePageWithPlayerInfo(
  ariaLabel,
  metricName,
  ESPN_STAT_IDENTIFIER,
  STATS_INDEX,
) {
  var counter = 0;
  const intervalId = setInterval(async () => {
    const playerElements = document.querySelectorAll(ariaLabel);
    if (playerElements.length > 0) {
      clearInterval(intervalId);
      [...playerElements].forEach(async (div) => {
        const playerName = div.ariaLabel.split(", ")[1];
        const metricAmount = await getPlayerStat(
          playerName,
          ESPN_STAT_IDENTIFIER,
          STATS_INDEX,
        );
        var playerNameDivParent = div.parentElement.parentElement.parentElement;
        var playerNameDiv =
          playerNameDivParent.children[0].children[1].children[0].children[0];
        playerNameDiv.innerText =
          playerName + `: Average ${metricName} ` + metricAmount;
      });
    }
    counter += 1;
    if (counter > MAX_RETRIES) {
      console.log("couldn't find div");
      clearInterval(intervalId);
    }
  }, REFRESH_INTERVAL);
}

async function getPlayerStat(playerName, ESPN_STAT_IDENTIFIER, STATS_INDEX) {
  playerName = playerName.split(" ");
  // Once scraped player, find ESPN id from name and then stats from ID
  var id = await GetESPNIdFromPlayerName(playerName[0], playerName[1]);
  var statsJson = await getStatsFromESPNPlayerID(id);
  var statSplits = statsJson["splits"]["categories"][STATS_INDEX]["stats"];
  var specificStats = statSplits.filter(
    (stats) => stats["shortDisplayName"] == ESPN_STAT_IDENTIFIER,
  );
  return specificStats[0]["displayValue"];
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
