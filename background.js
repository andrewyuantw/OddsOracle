// Use BallDon'tLie API

const team_to_API_key_mapping = {
  hawks: 1,
  celtics: 2,
  nets: 3,
  hornets: 4,
  bulls: 5,
  cavaliers: 6,
  mavericks: 7,
  nuggets: 8,
  pistons: 9,
  warriors: 10,
  rockets: 11,
  pacers: 12,
  clippers: 13,
  lakers: 14,
  grizzlies: 15,
  heat: 16,
  bucks: 17,
  timberwolves: 18,
  pelicans: 19,
  knicks: 20,
  thunder: 21,
  magic: 22,
  "76ers": 23,
  suns: 24,
  blazers: 25,
  kings: 26,
  spurs: 27,
  raptors: 28,
  jazz: 29,
  wizards: 30,
};

// Extension only supports Fanduel NBA odds for now
const fanduel_nba_prefix_regex = new RegExp(
  "https://.*.sportsbook.fanduel.com/basketball/nba/",
);
const player_points_suffix = "?tab=player-points";
const player_threes_suffix = "?tab=player-threes";
const player_rebounds_suffix = "?tab=player-rebounds";
const player_assists_suffix = "?tab=player-assists";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.endsWith(player_points_suffix)) {
      console.log("Navigated to player points tab");
      chrome.tabs.sendMessage(tabId, "PLAYERPOINTS");
    } else if (tab.url.endsWith(player_threes_suffix)) {
      console.log("Navigated to player threes tab");
      chrome.tabs.sendMessage(tabId, "PLAYERTHREES");
    } else if (tab.url.endsWith(player_rebounds_suffix)) {
      console.log("Navigated to player rebounds tab");
      chrome.tabs.sendMessage(tabId, "PLAYERREBOUNDS");
    } else if (tab.url.endsWith(player_assists_suffix)) {
        console.log("Navigated to player assists tab");
        chrome.tabs.sendMessage(tabId, "PLAYERASSISTS");
    } else if (fanduel_nba_prefix_regex.test(tab.url)) {
      // Regex to grab info
      // Sample URL will look like https://sportsbook.fanduel.com/basketball/nba/indiana-pacers-@-los-angeles-lakers-33130540
      const capturingRegex =
        /nba\/(?<away_loc>.*)-(?<away_team>.*)-@-(?<home_loc>.*)-(?<home_team>.*)-/;
      const found = tab.url.match(capturingRegex);

      const { away_loc, away_team, home_loc, home_team } = found.groups;
      console.log(away_loc);

      chrome.tabs.sendMessage(tabId, "MAIN");
    }
  }
});
