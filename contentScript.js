// Aria Labels
const SPREAD_BETTING_ARIA = 'div[aria-label*="Spread Betting,"]';
const TEN_POINTS_ARIA = createAriaLabelExpand("To Score ", "20", "Points");
const ONE_MADE_THREE_ARIA = createAriaLabelExpand("", "4", "Made Threes");
const REBOUNDS_ARIA = createAriaLabelExpand("To Record ", "6", "Rebounds");
const ASSISTS_ARIA = createAriaLabelExpand("To Record ", "4", "Assists");

// Numberic Constants
const REFRESH_INTERVAL = 2000;
const MAX_RETRIES = 30;
const CURRENT_SEASON = 2025;

// API Endpoint
const ESPN_GET_ALL_PLAYERS_URL =
  "https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?limit=20000";
const ESPN_GET_STATS_FROM_ID_URL = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${CURRENT_SEASON}/types/2/athletes/`;
const ESPN_GET_PLAYER_FROM_ID_URL = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2025/athletes/`;
const ESPN_GET_TEAM_INFO_URL = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/teams/`;

// ESPN API Constants
const OFFENSE_STATS_INDEX = 2;
const GENERAL_STATS_INDEX = 1;

const STAT_MAPPING = {
  PLAYERPOINTS: {
    verb1: "To Score ",
    verb2: "",
    name: "Points",
    ariaLabel: TEN_POINTS_ARIA,
    espnStatName: "PPG",
    index: OFFENSE_STATS_INDEX,
    levels: [10, 15, 20, 25, 30, 35, 40, 45],
  },
  PLAYERTHREES: {
    verb1: "",
    verb2: "Made ",
    name: "Threes",
    ariaLabel: ONE_MADE_THREE_ARIA,
    espnStatName: "A3PM",
    index: OFFENSE_STATS_INDEX,
    levels: [2, 3, 4, 5, 6, 7, 8],
  },
  PLAYERREBOUNDS: {
    verb1: "To Record ",
    verb2: "",
    name: "Rebounds",
    ariaLabel: REBOUNDS_ARIA,
    espnStatName: "RPG",
    index: GENERAL_STATS_INDEX,
    levels: [4, 6, 8, 10, 12, 14, 16],
  },
  PLAYERASSISTS: {
    verb1: "To Record ",
    verb2: "",
    name: "Assists",
    ariaLabel: ASSISTS_ARIA,
    espnStatName: "APG",
    index: OFFENSE_STATS_INDEX,
    levels: [2, 4, 6, 8, 10],
  },
};

// Need to use intervals because FanDuel does not load information instantly
// Use interval to check if info is loaded periodically
chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
  // Get injury report
  /*
  const re = /(?<team1slug>[a-z\-]+)-@-(?<team2slug>[a-z\-]+[a-z])/;
  const found = window.location.toString().match(re);
  getInjuryReport(found["groups"]["team1slug"]);
  getInjuryReport(found["groups"]["team2slug"]);
  */

  if (obj == "MAIN") {
    waitForElements(SPREAD_BETTING_ARIA, (element) => {
      processOdds(element[0].children[0]);
    });
  } else if (obj == "PLAYERPOINTS") {
    processPlayerStats(STAT_MAPPING.PLAYERPOINTS);
  } else if (obj == "PLAYERTHREES") {
    processPlayerStats(STAT_MAPPING.PLAYERTHREES);
  } else if (obj == "PLAYERREBOUNDS") {
    processPlayerStats(STAT_MAPPING.PLAYERREBOUNDS);
  } else if (obj == "PLAYERASSISTS") {
    processPlayerStats(STAT_MAPPING.PLAYERASSISTS);
  }
});

function processPlayerStats(statMapping) {
  waitForElements(statMapping.ariaLabel, () => {
    haveEncounteredFirstDiv = false;
    statMapping.levels.forEach((metricNumber) => {
      aria = createAriaLabel(
        statMapping.verb1,
        metricNumber,
        statMapping.verb2 + statMapping.name,
      );
      aria_expand = createAriaLabelExpand(
        statMapping.verb1,
        metricNumber,
        statMapping.verb2 + statMapping.name,
      );
      pointDiv = document.querySelectorAll(aria_expand)[0];
      if (pointDiv) {
        if (!haveEncounteredFirstDiv) {
          updatePageWithPlayerInfo(
            createAriaLabel(
              statMapping.verb1,
              metricNumber,
              statMapping.verb2 + statMapping.name,
            ),
            statMapping,
          );
          haveEncounteredFirstDiv = true;
        } else {
          pointDiv.addEventListener("click", function () {
            updatePageWithPlayerInfo(
              createAriaLabel(
                statMapping.verb1,
                metricNumber,
                statMapping.verb2 + statMapping.name,
              ),
              statMapping,
            );
          });
        }
      }
    });
  });
}

function processOdds(oddsElement) {
  // To add
  console.log(oddsElement.innerHTML);
}

async function getInjuryReport(teamSlug) {
  for (var i = 1; i <= 30; i += 1) {
    const retrievedTeamSlug = await getTeamSlugFromTeamID(i);
    if (retrievedTeamSlug == teamSlug) {
      getTeamInjuriesFromTeamID(i);
      break;
    }
  }
}

async function updatePageWithPlayerInfo(ariaLabel, statMapping) {
  waitForElements(ariaLabel, (playerElements) => {
    [...playerElements].forEach(async (div) => {
      const playerName = div.ariaLabel.split(", ")[1];
      const metricAmount = await getPlayerStat(
        playerName,
        statMapping.espnStatName,
        statMapping.index,
      );
      var playerNameDivParent = div.parentElement.parentElement.parentElement;
      var playerNameDiv =
        playerNameDivParent.children[0].children[1].children[0].children[0];
      playerNameDiv.innerText =
        playerName + `: Average ${statMapping.name} ` + metricAmount;
    });
  });
}

async function getPlayerStat(playerName, ESPN_STAT_IDENTIFIER, STATS_INDEX) {
  playerName = playerName.split(" ");
  lastName = playerName[1];
  if (playerName.length == 3) {
    lastName += " " + playerName[2];
  }

  // Once scraped player, find ESPN id from name and then stats from ID
  var id = await GetESPNIdFromPlayerName(playerName[0], lastName);
  var statsJson = await fetchFromESPN(
    ESPN_GET_STATS_FROM_ID_URL + `${id}/statistics/`,
  );
  var statSplits = statsJson["splits"]["categories"][STATS_INDEX]["stats"];
  var specificStats = statSplits.filter(
    (stats) => stats["shortDisplayName"] == ESPN_STAT_IDENTIFIER,
  );
  return specificStats[0]["displayValue"];
}

async function GetESPNIdFromPlayerName(playerFirstName, playerLastName) {
  const json = await fetchFromESPN(ESPN_GET_ALL_PLAYERS_URL);
  filtered = json.items.filter(
    (x) => x.firstName === playerFirstName && x.lastName === playerLastName,
  );
  return filtered[0].id;
}

async function getTeamSlugFromTeamID(id) {
  const json = await fetchFromESPN(ESPN_GET_TEAM_INFO_URL + `${id}`);
  return json["slug"];
}

async function getTeamInjuriesFromTeamID(id) {
  const json = await fetchFromESPN(ESPN_GET_TEAM_INFO_URL + `${id}/injuries`);
  console.log(
    json["items"].map(async (item) => {
      injuryObject = await fetchFromESPN(item["$ref"]);
      athleteObject = await fetchFromESPN(injuryObject["athlete"]["$ref"]);
      return athleteObject["fullName"];
    }),
  );
}

/* Cache ESPN Response data for faster speed */
const espnCache = {};

/* HELPER FUNCTIONS */
async function fetchFromESPN(endpoint) {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  // If data is cached and not expired, return cached data
  if (espnCache[endpoint] && now - espnCache[endpoint].timestamp < tenMinutes) {
    return espnCache[endpoint].data;
  }
  const options = {
    method: "GET",
  };
  const resp = await fetch(endpoint, options);
  const json = await resp.json();

  // cache the result
  espnCache[endpoint] = {
    data: json,
    timestamp: now,
  };

  return json;
}

function waitForElements(selector, callback, timeout = 60000) {
  const observer = new MutationObserver((mutations, obs) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      callback(elements);
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), timeout);
}

function createAriaLabel(action, number, metric) {
  return `div[aria-label*="${action}${number}+ ${metric},"]`;
}

function createAriaLabelExpand(action, number, metric) {
  return `div[aria-label*="${action}${number}+ ${metric}"]`;
}
