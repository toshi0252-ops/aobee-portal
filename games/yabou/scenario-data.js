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
  },
  {
    "id": "S02",
    "name": "最後の一城",
    "description": "青葉城を失い、あおびー家に残されたのは蒼月城だけ。家臣と備蓄を頼りに、一城から天下への道を切り開く上級向けシナリオ。",
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
        "defense": 50,
        "troops": 800,
        "food": 1000,
        "gold": 900,
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
        "ownerFactionId": "F02",
        "farm": 40,
        "commerce": 40,
        "defense": 45,
        "troops": 1200,
        "food": 1500,
        "gold": 600,
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
        "locationCastleId": "C01",
        "loyalty": 72,
        "status": "active"
      },
      {
        "id": "G004",
        "factionId": "F01",
        "locationCastleId": "C01",
        "loyalty": 72,
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
        "locationCastleId": "C06",
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
        "locationCastleId": "C06",
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
    ],
    "allowedFactions": [
      "F01"
    ],
    "initialRelations": [
      {
        "a": "F01",
        "b": "F02",
        "relation": -35
      }
    ]
  },
  {
    "id": "S03",
    "name": "覇王の影",
    "description": "あかびー家が中央の5城を支配する。残る5勢力から旗を選び、外交と備えを重ねて巨大勢力へ挑む上級向けシナリオ。",
    "victory": "全12城を支配する",
    "factions": [
      {
        "id": "F01",
        "capitalCastleId": "C01"
      },
      {
        "id": "F02",
        "capitalCastleId": "C10"
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
        "capitalCastleId": "C02"
      },
      {
        "id": "F06",
        "capitalCastleId": "C11"
      }
    ],
    "castles": [
      {
        "id": "C01",
        "ownerFactionId": "F01",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1200,
        "food": 1200,
        "gold": 700,
        "publicOrder": 70
      },
      {
        "id": "C02",
        "ownerFactionId": "F05",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1500,
        "food": 1800,
        "gold": 1000,
        "publicOrder": 70
      },
      {
        "id": "C03",
        "ownerFactionId": "F04",
        "farm": 40,
        "commerce": 40,
        "defense": 45,
        "troops": 1100,
        "food": 1200,
        "gold": 600,
        "publicOrder": 70
      },
      {
        "id": "C04",
        "ownerFactionId": "F03",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1800,
        "food": 1800,
        "gold": 800,
        "publicOrder": 70
      },
      {
        "id": "C05",
        "ownerFactionId": "F03",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1800,
        "food": 1800,
        "gold": 800,
        "publicOrder": 70
      },
      {
        "id": "C06",
        "ownerFactionId": "F01",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1400,
        "food": 1200,
        "gold": 700,
        "publicOrder": 70
      },
      {
        "id": "C07",
        "ownerFactionId": "F03",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1800,
        "food": 1800,
        "gold": 800,
        "publicOrder": 70
      },
      {
        "id": "C08",
        "ownerFactionId": "F03",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1800,
        "food": 1800,
        "gold": 800,
        "publicOrder": 70
      },
      {
        "id": "C09",
        "ownerFactionId": "F03",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1800,
        "food": 1800,
        "gold": 800,
        "publicOrder": 70
      },
      {
        "id": "C10",
        "ownerFactionId": "F02",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1500,
        "food": 1800,
        "gold": 1000,
        "publicOrder": 70
      },
      {
        "id": "C11",
        "ownerFactionId": "F06",
        "farm": 40,
        "commerce": 40,
        "defense": 50,
        "troops": 1500,
        "food": 1800,
        "gold": 1000,
        "publicOrder": 70
      },
      {
        "id": "C12",
        "ownerFactionId": "F04",
        "farm": 40,
        "commerce": 40,
        "defense": 45,
        "troops": 1100,
        "food": 1200,
        "gold": 600,
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
        "locationCastleId": "C10",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G006",
        "factionId": "F02",
        "locationCastleId": "C10",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G007",
        "factionId": "F02",
        "locationCastleId": "C10",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G008",
        "factionId": "F02",
        "locationCastleId": "C10",
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
        "locationCastleId": "C04",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G011",
        "factionId": "F03",
        "locationCastleId": "C05",
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
        "locationCastleId": "C02",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G018",
        "factionId": "F05",
        "locationCastleId": "C02",
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
        "locationCastleId": "C11",
        "loyalty": 100,
        "status": "active"
      },
      {
        "id": "G022",
        "factionId": "F06",
        "locationCastleId": "C11",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G023",
        "factionId": "F06",
        "locationCastleId": "C11",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "G024",
        "factionId": "F06",
        "locationCastleId": "C11",
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
        "locationCastleId": "C10",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N015",
        "factionId": "F03",
        "locationCastleId": "C09",
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
        "locationCastleId": "C02",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N018",
        "factionId": "F06",
        "locationCastleId": "C11",
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
        "locationCastleId": "C10",
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
        "locationCastleId": "C02",
        "loyalty": 80,
        "status": "active"
      },
      {
        "id": "N024",
        "factionId": "F06",
        "locationCastleId": "C11",
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
    ],
    "allowedFactions": [
      "F01",
      "F02",
      "F04",
      "F05",
      "F06"
    ],
    "initialRelations": [
      {
        "a": "F01",
        "b": "F02",
        "relation": 20
      },
      {
        "a": "F01",
        "b": "F03",
        "relation": -40
      },
      {
        "a": "F01",
        "b": "F04",
        "relation": 20
      },
      {
        "a": "F01",
        "b": "F05",
        "relation": 20
      },
      {
        "a": "F01",
        "b": "F06",
        "relation": 20
      },
      {
        "a": "F02",
        "b": "F03",
        "relation": -40
      },
      {
        "a": "F02",
        "b": "F04",
        "relation": 20
      },
      {
        "a": "F02",
        "b": "F05",
        "relation": 20
      },
      {
        "a": "F02",
        "b": "F06",
        "relation": 20
      },
      {
        "a": "F03",
        "b": "F04",
        "relation": -40
      },
      {
        "a": "F03",
        "b": "F05",
        "relation": -40
      },
      {
        "a": "F03",
        "b": "F06",
        "relation": -40
      },
      {
        "a": "F04",
        "b": "F05",
        "relation": 20
      },
      {
        "a": "F04",
        "b": "F06",
        "relation": 20
      },
      {
        "a": "F05",
        "b": "F06",
        "relation": 20
      }
    ]
  },
  {
    "id": "S04",
    "name": "偽りの盟約",
    "description": "六つの旗を結ぶ同盟は、あと6か月。盟約を疑う書状が届くが、裏切りの事実はまだ確認されていない。外交と謀略を見極めるシナリオ。",
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
    ],
    "initialRelations": [
      {
        "a": "F01",
        "b": "F02",
        "relation": -10,
        "allianceMonths": 6
      },
      {
        "a": "F01",
        "b": "F03",
        "relation": -20
      },
      {
        "a": "F01",
        "b": "F04",
        "relation": 30,
        "allianceMonths": 6
      },
      {
        "a": "F01",
        "b": "F05",
        "relation": -20
      },
      {
        "a": "F01",
        "b": "F06",
        "relation": -20
      },
      {
        "a": "F02",
        "b": "F03",
        "relation": 30,
        "allianceMonths": 6
      },
      {
        "a": "F02",
        "b": "F04",
        "relation": -20
      },
      {
        "a": "F02",
        "b": "F05",
        "relation": -20
      },
      {
        "a": "F02",
        "b": "F06",
        "relation": -20
      },
      {
        "a": "F03",
        "b": "F04",
        "relation": -20
      },
      {
        "a": "F03",
        "b": "F05",
        "relation": -20
      },
      {
        "a": "F03",
        "b": "F06",
        "relation": 30,
        "allianceMonths": 6
      },
      {
        "a": "F04",
        "b": "F05",
        "relation": 30,
        "allianceMonths": 6
      },
      {
        "a": "F04",
        "b": "F06",
        "relation": -20
      },
      {
        "a": "F05",
        "b": "F06",
        "relation": 30,
        "allianceMonths": 6
      }
    ],
    "openingEventId": "SE04"
  }
];
root.YABOU_SCENARIOS=scenarios;if(typeof module!=='undefined')module.exports=scenarios;
})(globalThis);
