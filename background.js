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
      chrome.tabs.sendMessage(tabId, "MAIN");
    }
  }
});
