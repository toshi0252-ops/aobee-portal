(function(root){
'use strict';
// Initial placements and resources; shared names, stats and map geometry remain in data.js.
const scenarios=[
  {
    "id": "S01",
    "name": "群雄割拠 ― 六つの旗",
    "description": "六つの大名家が、それぞれ二つの城から天下を目指す基本シナリオ。",
    "victory": "全12城を支配する",
    "factions": [
      {
        "id": "F01",
        "capitalCastleId": "C01"
      },
      {
        "id": "F02",
        "capitalCastleId": "C04"
      },
      {
        "id": "F03",
        "capitalCastleId": "C07"
      },
      {
        "id": "F04",
        "capitalCastleId": "C03"
      },
      {
        "id": "F05",
        "capitalCastleId": "C11"
      },
      {
        "id": "F06",
        "capitalCastleId": "C09"
      }
    ],
    "castles": [
      {
        "id": "C01",
        "ownerFactionId": "F01",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 500,
        "publicOrder": 70
      },
      {
        "id": "C02",
        "ownerFactionId": "F05",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 300,
        "publicOrder": 70
      },
      {
        "id": "C03",
        "ownerFactionId": "F04",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 500,
        "publicOrder": 70
      },
      {
        "id": "C04",
        "ownerFactionId": "F02",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 500,
        "publicOrder": 70
      },
      {
        "id": "C05",
        "ownerFactionId": "F02",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 300,
        "publicOrder": 70
      },
      {
        "id": "C06",
        "ownerFactionId": "F01",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 300,
        "publicOrder": 70
      },
      {
        "id": "C07",
        "ownerFactionId": "F03",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 500,
        "publicOrder": 70
      },
      {
        "id": "C08",
        "ownerFactionId": "F03",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 300,
        "publicOrder": 70
      },
      {
        "id": "C09",
        "ownerFactionId": "F06",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 500,
        "publicOrder": 70
      },
      {
        "id": "C10",
        "ownerFactionId": "F06",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 300,
        "publicOrder": 70
      },
      {
        "id": "C11",
        "ownerFactionId": "F05",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 500,
        "publicOrder": 70
      },
      {
        "id": "C12",
        "ownerFactionId": "F04",
        "farm": 40,
        "commerce": 40,
        "defense": 40,
        "troops": 1000,
        "food": 500,
        "gold": 300,
        "publicOrder": 70
      }
    ],
    "officers": [
      {
        "id": "G001",
        "factionId": "F01",
        "locationCastleId": "C01",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G002",
        "factionId": "F01",
        "locationCastleId": "C01",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G003",
        "factionId": "F01",
        "locationCastleId": "C06",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G004",
        "factionId": "F01",
        "locationCastleId": "C06",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G005",
        "factionId": "F02",
        "locationCastleId": "C04",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G006",
        "factionId": "F02",
        "locationCastleId": "C04",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G007",
        "factionId": "F02",
        "locationCastleId": "C05",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G008",
        "factionId": "F02",
        "locationCastleId": "C05",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G009",
        "factionId": "F03",
        "locationCastleId": "C07",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G010",
        "factionId": "F03",
        "locationCastleId": "C07",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G011",
        "factionId": "F03",
        "locationCastleId": "C08",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G012",
        "factionId": "F03",
        "locationCastleId": "C08",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G013",
        "factionId": "F04",
        "locationCastleId": "C03",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G014",
        "factionId": "F04",
        "locationCastleId": "C03",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G015",
        "factionId": "F04",
        "locationCastleId": "C12",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G016",
        "factionId": "F04",
        "locationCastleId": "C12",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G017",
        "factionId": "F05",
        "locationCastleId": "C11",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G018",
        "factionId": "F05",
        "locationCastleId": "C11",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G019",
        "factionId": "F05",
        "locationCastleId": "C02",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G020",
        "factionId": "F05",
        "locationCastleId": "C02",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G021",
        "factionId": "F06",
        "locationCastleId": "C09",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G022",
        "factionId": "F06",
        "locationCastleId": "C09",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G023",
        "factionId": "F06",
        "locationCastleId": "C10",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G024",
        "factionId": "F06",
        "locationCastleId": "C10",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N001",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N002",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N003",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N004",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N005",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N006",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N007",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N008",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N009",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N010",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N011",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N012",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N013",
        "factionId": "F01",
        "locationCastleId": "C01",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N014",
        "factionId": "F02",
        "locationCastleId": "C04",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N015",
        "factionId": "F03",
        "locationCastleId": "C07",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N016",
        "factionId": "F04",
        "locationCastleId": "C03",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N017",
        "factionId": "F05",
        "locationCastleId": "C11",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N018",
        "factionId": "F06",
        "locationCastleId": "C09",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N019",
        "factionId": "F01",
        "locationCastleId": "C01",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N020",
        "factionId": "F02",
        "locationCastleId": "C04",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N021",
        "factionId": "F03",
        "locationCastleId": "C07",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N022",
        "factionId": "F04",
        "locationCastleId": "C03",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N023",
        "factionId": "F05",
        "locationCastleId": "C11",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N024",
        "factionId": "F06",
        "locationCastleId": "C09",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N025",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N026",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N027",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N028",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N029",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      },
      {
        "id": "N030",
        "factionId": null,
        "locationCastleId": null,
        "loyalty": 50,
        "status": "ronin"
      }
    ]
  }
];
root.YABOU_SCENARIOS=scenarios;if(typeof module!=='undefined')module.exports=scenarios;
})(globalThis);
