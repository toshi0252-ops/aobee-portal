globalThis.YABOU_DATA = {
  "schemaVersion": "1.2.0",
  "status": "candidate",
  "coordinateSpace": {
    "width": 1000,
    "height": 1000
  },
  "factions": [
    {
      "id": "F01",
      "name": "あおびー家",
      "capitalCastleId": "C01",
      "trait": "civil"
    },
    {
      "id": "F02",
      "name": "わるびー家",
      "capitalCastleId": "C04",
      "trait": "intrigue"
    },
    {
      "id": "F03",
      "name": "あかびー家",
      "capitalCastleId": "C07",
      "trait": "military"
    },
    {
      "id": "F04",
      "name": "しろびー家",
      "capitalCastleId": "C03",
      "trait": "diplomacy"
    },
    {
      "id": "F05",
      "name": "みどりびー家",
      "capitalCastleId": "C11",
      "trait": "agriculture"
    },
    {
      "id": "F06",
      "name": "きびー家",
      "capitalCastleId": "C09",
      "trait": "commerce"
    }
  ],
  "castles": [
    {
      "id": "C01",
      "name": "蒼月城",
      "ownerFactionId": "F01",
      "region": "北方",
      "x": 180,
      "y": 130,
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
      "name": "若葉城",
      "ownerFactionId": "F05",
      "region": "北方",
      "x": 420,
      "y": 130,
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
      "name": "白雪城",
      "ownerFactionId": "F04",
      "region": "北方",
      "x": 700,
      "y": 110,
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
      "name": "黒影城",
      "ownerFactionId": "F02",
      "region": "中央",
      "x": 180,
      "y": 380,
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
      "name": "霧谷城",
      "ownerFactionId": "F02",
      "region": "中央",
      "x": 410,
      "y": 390,
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
      "name": "青葉城",
      "ownerFactionId": "F01",
      "region": "中央",
      "x": 180,
      "y": 620,
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
      "name": "紅蓮城",
      "ownerFactionId": "F03",
      "region": "東方",
      "x": 460,
      "y": 620,
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
      "name": "赤岩城",
      "ownerFactionId": "F03",
      "region": "東方",
      "x": 680,
      "y": 600,
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
      "name": "金穂城",
      "ownerFactionId": "F06",
      "region": "東方",
      "x": 780,
      "y": 390,
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
      "name": "黄昏城",
      "ownerFactionId": "F06",
      "region": "西方",
      "x": 840,
      "y": 780,
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
      "name": "緑森城",
      "ownerFactionId": "F05",
      "region": "西方",
      "x": 540,
      "y": 830,
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
      "name": "銀峰城",
      "ownerFactionId": "F04",
      "region": "西方",
      "x": 740,
      "y": 850,
      "farm": 40,
      "commerce": 40,
      "defense": 40,
      "troops": 1000,
      "food": 500,
      "gold": 300,
      "publicOrder": 70
    }
  ],
  "roads": [
    {
      "id": "R01",
      "fromCastleId": "C01",
      "toCastleId": "C02"
    },
    {
      "id": "R02",
      "fromCastleId": "C01",
      "toCastleId": "C06"
    },
    {
      "id": "R03",
      "fromCastleId": "C02",
      "toCastleId": "C03"
    },
    {
      "id": "R04",
      "fromCastleId": "C02",
      "toCastleId": "C11"
    },
    {
      "id": "R05",
      "fromCastleId": "C03",
      "toCastleId": "C12"
    },
    {
      "id": "R06",
      "fromCastleId": "C04",
      "toCastleId": "C05"
    },
    {
      "id": "R07",
      "fromCastleId": "C04",
      "toCastleId": "C06"
    },
    {
      "id": "R08",
      "fromCastleId": "C04",
      "toCastleId": "C07"
    },
    {
      "id": "R09",
      "fromCastleId": "C05",
      "toCastleId": "C08"
    },
    {
      "id": "R10",
      "fromCastleId": "C05",
      "toCastleId": "C10"
    },
    {
      "id": "R11",
      "fromCastleId": "C06",
      "toCastleId": "C09"
    },
    {
      "id": "R12",
      "fromCastleId": "C07",
      "toCastleId": "C08"
    },
    {
      "id": "R13",
      "fromCastleId": "C08",
      "toCastleId": "C09"
    },
    {
      "id": "R14",
      "fromCastleId": "C09",
      "toCastleId": "C10"
    },
    {
      "id": "R15",
      "fromCastleId": "C10",
      "toCastleId": "C11"
    },
    {
      "id": "R16",
      "fromCastleId": "C11",
      "toCastleId": "C12"
    }
  ],
  "officers": [
    {
      "id": "G001",
      "name": "あおびー",
      "factionId": "F01",
      "role": "大名",
      "stats": {
        "leadership": 65,
        "valor": 48,
        "intellect": 67,
        "politics": 82,
        "charisma": 92
      },
      "isProvisional": false
    },
    {
      "id": "G002",
      "name": "蒼羽",
      "factionId": "F01",
      "role": "軍師",
      "stats": {
        "leadership": 72,
        "valor": 61,
        "intellect": 74,
        "politics": 76,
        "charisma": 70
      },
      "isProvisional": true
    },
    {
      "id": "G003",
      "name": "青嵐",
      "factionId": "F01",
      "role": "武将",
      "stats": {
        "leadership": 83,
        "valor": 78,
        "intellect": 52,
        "politics": 41,
        "charisma": 65
      },
      "isProvisional": true
    },
    {
      "id": "G004",
      "name": "水音",
      "factionId": "F01",
      "role": "奉行",
      "stats": {
        "leadership": 45,
        "valor": 39,
        "intellect": 69,
        "politics": 88,
        "charisma": 77
      },
      "isProvisional": true
    },
    {
      "id": "G005",
      "name": "わるびー",
      "factionId": "F02",
      "role": "大名",
      "stats": {
        "leadership": 75,
        "valor": 70,
        "intellect": 91,
        "politics": 50,
        "charisma": 72
      },
      "isProvisional": false
    },
    {
      "id": "G006",
      "name": "影丸",
      "factionId": "F02",
      "role": "軍師",
      "stats": {
        "leadership": 79,
        "valor": 73,
        "intellect": 84,
        "politics": 38,
        "charisma": 55
      },
      "isProvisional": true
    },
    {
      "id": "G007",
      "name": "黒鉄",
      "factionId": "F02",
      "role": "武将",
      "stats": {
        "leadership": 88,
        "valor": 86,
        "intellect": 48,
        "politics": 35,
        "charisma": 51
      },
      "isProvisional": true
    },
    {
      "id": "G008",
      "name": "夜霧",
      "factionId": "F02",
      "role": "奉行",
      "stats": {
        "leadership": 43,
        "valor": 47,
        "intellect": 87,
        "politics": 67,
        "charisma": 62
      },
      "isProvisional": true
    },
    {
      "id": "G009",
      "name": "あかびー",
      "factionId": "F03",
      "role": "大名",
      "stats": {
        "leadership": 88,
        "valor": 91,
        "intellect": 50,
        "politics": 46,
        "charisma": 76
      },
      "isProvisional": false
    },
    {
      "id": "G010",
      "name": "紅霞",
      "factionId": "F03",
      "role": "軍師",
      "stats": {
        "leadership": 75,
        "valor": 70,
        "intellect": 72,
        "politics": 55,
        "charisma": 65
      },
      "isProvisional": true
    },
    {
      "id": "G011",
      "name": "火群",
      "factionId": "F03",
      "role": "武将",
      "stats": {
        "leadership": 92,
        "valor": 94,
        "intellect": 32,
        "politics": 27,
        "charisma": 57
      },
      "isProvisional": true
    },
    {
      "id": "G012",
      "name": "朱音",
      "factionId": "F03",
      "role": "奉行",
      "stats": {
        "leadership": 51,
        "valor": 49,
        "intellect": 60,
        "politics": 77,
        "charisma": 68
      },
      "isProvisional": true
    },
    {
      "id": "G013",
      "name": "しろびー",
      "factionId": "F04",
      "role": "大名",
      "stats": {
        "leadership": 59,
        "valor": 45,
        "intellect": 89,
        "politics": 84,
        "charisma": 88
      },
      "isProvisional": false
    },
    {
      "id": "G014",
      "name": "白鷺",
      "factionId": "F04",
      "role": "軍師",
      "stats": {
        "leadership": 58,
        "valor": 39,
        "intellect": 93,
        "politics": 82,
        "charisma": 73
      },
      "isProvisional": true
    },
    {
      "id": "G015",
      "name": "雪峰",
      "factionId": "F04",
      "role": "武将",
      "stats": {
        "leadership": 76,
        "valor": 68,
        "intellect": 62,
        "politics": 60,
        "charisma": 66
      },
      "isProvisional": true
    },
    {
      "id": "G016",
      "name": "氷花",
      "factionId": "F04",
      "role": "奉行",
      "stats": {
        "leadership": 40,
        "valor": 32,
        "intellect": 81,
        "politics": 92,
        "charisma": 75
      },
      "isProvisional": true
    },
    {
      "id": "G017",
      "name": "みどりびー",
      "factionId": "F05",
      "role": "大名",
      "stats": {
        "leadership": 65,
        "valor": 52,
        "intellect": 73,
        "politics": 91,
        "charisma": 82
      },
      "isProvisional": false
    },
    {
      "id": "G018",
      "name": "若竹",
      "factionId": "F05",
      "role": "軍師",
      "stats": {
        "leadership": 67,
        "valor": 54,
        "intellect": 78,
        "politics": 85,
        "charisma": 70
      },
      "isProvisional": true
    },
    {
      "id": "G019",
      "name": "森牙",
      "factionId": "F05",
      "role": "武将",
      "stats": {
        "leadership": 81,
        "valor": 76,
        "intellect": 49,
        "politics": 48,
        "charisma": 61
      },
      "isProvisional": true
    },
    {
      "id": "G020",
      "name": "葉月",
      "factionId": "F05",
      "role": "奉行",
      "stats": {
        "leadership": 42,
        "valor": 38,
        "intellect": 66,
        "politics": 95,
        "charisma": 74
      },
      "isProvisional": true
    },
    {
      "id": "G021",
      "name": "きびー",
      "factionId": "F06",
      "role": "大名",
      "stats": {
        "leadership": 68,
        "valor": 59,
        "intellect": 80,
        "politics": 86,
        "charisma": 78
      },
      "isProvisional": false
    },
    {
      "id": "G022",
      "name": "黄金",
      "factionId": "F06",
      "role": "軍師",
      "stats": {
        "leadership": 57,
        "valor": 41,
        "intellect": 89,
        "politics": 91,
        "charisma": 65
      },
      "isProvisional": true
    },
    {
      "id": "G023",
      "name": "麦嵐",
      "factionId": "F06",
      "role": "武将",
      "stats": {
        "leadership": 80,
        "valor": 77,
        "intellect": 53,
        "politics": 48,
        "charisma": 59
      },
      "isProvisional": true
    },
    {
      "id": "G024",
      "name": "稲穂",
      "factionId": "F06",
      "role": "奉行",
      "stats": {
        "leadership": 48,
        "valor": 40,
        "intellect": 75,
        "politics": 94,
        "charisma": 72
      },
      "isProvisional": true
    }
  ],
  "events": [
    {
      "id": "EV01",
      "name": "最初の評定",
      "phase": "turn_start",
      "condition": {
        "all": [
          {
            "op": "eq",
            "path": "state.playerFactionId",
            "value": "F01"
          },
          {
            "op": "eq",
            "path": "state.turn",
            "value": 1
          }
        ]
      },
      "subject": "player",
      "repeatPolicy": "once_per_campaign",
      "choices": [
        {
          "id": "A",
          "label": "開墾の助言",
          "effects": [
            {
              "type": "open_panel",
              "panel": "agriculture"
            }
          ]
        },
        {
          "id": "B",
          "label": "外交の助言",
          "effects": [
            {
              "type": "open_panel",
              "panel": "diplomacy"
            }
          ]
        }
      ]
    },
    {
      "id": "EV02",
      "name": "黒影からの書状",
      "phase": "diplomacy",
      "condition": {
        "all": [
          {
            "op": "faction_alive",
            "id": "F01"
          },
          {
            "op": "faction_alive",
            "id": "F02"
          },
          {
            "op": "not_at_war",
            "a": "F01",
            "b": "F02"
          },
          {
            "any": [
              {
                "op": "bordering",
                "a": "F01",
                "b": "F02"
              },
              {
                "op": "contacted",
                "a": "F01",
                "b": "F02"
              }
            ]
          }
        ]
      },
      "subject": "F01",
      "repeatPolicy": "once_per_campaign",
      "choices": [
        {
          "id": "A",
          "label": "交渉する",
          "effects": [
            {
              "type": "open_panel",
              "panel": "diplomacy",
              "targetFactionId": "F02"
            }
          ]
        },
        {
          "id": "B",
          "label": "保留する",
          "effects": []
        }
      ]
    },
    {
      "id": "EV03",
      "name": "紅蓮の挑戦",
      "phase": "turn_start",
      "condition": {
        "all": [
          {
            "op": "faction_alive",
            "id": "F03"
          },
          {
            "op": "military_superiority_neighbor",
            "factionId": "F03",
            "ratioGte": 1.2
          },
          {
            "op": "can_declare_war",
            "factionId": "F03"
          }
        ]
      },
      "subject": "F03",
      "repeatPolicy": "once_per_campaign",
      "choices": [
        {
          "id": "OK",
          "label": "防備を固める",
          "effects": [
            {
              "type": "set_flag",
              "key": "red_warning_until_turn",
              "valueFrom": "state.turn_plus_1"
            }
          ]
        }
      ]
    },
    {
      "id": "EV04",
      "name": "白雪の仲裁",
      "phase": "diplomacy",
      "condition": {
        "all": [
          {
            "op": "faction_alive",
            "id": "F04"
          },
          {
            "op": "neutral_mediator",
            "factionId": "F04"
          },
          {
            "op": "war_duration_gte",
            "months": 3
          }
        ]
      },
      "subject": "F04",
      "repeatPolicy": "once_per_war",
      "choices": [
        {
          "id": "A",
          "label": "講和交渉へ",
          "effects": [
            {
              "type": "open_panel",
              "panel": "peace"
            }
          ]
        },
        {
          "id": "B",
          "label": "辞退する",
          "effects": []
        }
      ]
    },
    {
      "id": "EV05",
      "name": "収穫の秋",
      "phase": "season",
      "condition": {
        "all": [
          {
            "op": "eq",
            "path": "state.month",
            "value": 9
          }
        ]
      },
      "subject": "all_castles",
      "repeatPolicy": "once_per_year_per_castle",
      "choices": [
        {
          "id": "AUTO",
          "label": "収穫",
          "effects": [
            {
              "type": "harvest",
              "formula": "floor(farm*8*harvestMultiplier)",
              "applyFamineModifier": true
            }
          ]
        }
      ]
    },
    {
      "id": "EV06",
      "name": "二つの旗",
      "phase": "diplomacy",
      "condition": {
        "all": [
          {
            "op": "allied",
            "a": "F01",
            "b": "F02"
          },
          {
            "op": "common_enemy",
            "a": "F01",
            "b": "F02"
          }
        ]
      },
      "subject": "F01_F02",
      "repeatPolicy": "once_per_alliance_episode",
      "choices": [
        {
          "id": "AUTO",
          "label": "共闘",
          "effects": [
            {
              "type": "change_relation",
              "a": "F01",
              "b": "F02",
              "delta": 5
            }
          ]
        }
      ]
    },
    {
      "id": "EV07",
      "name": "落城後の選択",
      "phase": "post_war",
      "condition": {
        "all": [
          {
            "op": "faction_destroyed_this_turn"
          }
        ]
      },
      "subject": "destroyed_faction",
      "repeatPolicy": "once_per_destroyed_faction",
      "choices": [
        {
          "id": "A",
          "label": "登用",
          "effects": [
            {
              "type": "open_panel",
              "panel": "recruit_prisoners"
            }
          ]
        },
        {
          "id": "B",
          "label": "解放",
          "effects": [
            {
              "type": "release_prisoners"
            }
          ]
        },
        {
          "id": "C",
          "label": "捕虜",
          "effects": [
            {
              "type": "detain_prisoners"
            }
          ]
        }
      ]
    },
    {
      "id": "EV08",
      "name": "乱世の終わり",
      "phase": "victory",
      "condition": {
        "any": [
          {
            "op": "owns_all_castles",
            "factionIdFrom": "state.playerFactionId"
          },
          {
            "op": "diplomatic_unification",
            "factionIdFrom": "state.playerFactionId"
          }
        ]
      },
      "subject": "player",
      "repeatPolicy": "once_per_campaign",
      "choices": [
        {
          "id": "AUTO",
          "label": "天下統一",
          "effects": [
            {
              "type": "show_ending",
              "variantBy": [
                "publicOrder",
                "relations"
              ]
            }
          ]
        }
      ]
    }
  ],
  "eventDslVersion": "1.0",
  "turnPhases": [
    "turn_start",
    "validate_commands",
    "player_commands",
    "ai_commands",
    "march_and_battle",
    "post_war",
    "monthly_economy",
    "relations",
    "diplomacy",
    "season",
    "victory",
    "turn_end"
  ]
};
globalThis.YABOU_RULES = {
  "schemaVersion": "1.2.0",
  "designStatus": "candidate",
  "notes": "Rules below are implementable contracts, not an executed game engine. Resolve all events against a single immutable phase snapshot; commit selected effects once.",
  "commands": {
    "cultivate": {
      "cost": {
        "gold": 100
      },
      "delta": {
        "farm": 5
      },
      "cap": 100,
      "limit": "one per castle per month"
    },
    "commerce": {
      "cost": {
        "gold": 100
      },
      "delta": {
        "commerce": 5
      },
      "cap": 100
    },
    "fortify": {
      "cost": {
        "gold": 150
      },
      "delta": {
        "defense": 5
      },
      "cap": 100
    },
    "recruit": {
      "cost": {
        "gold": 100,
        "food": 50
      },
      "delta": {
        "troops": 200,
        "publicOrder": -3
      },
      "floor": {
        "publicOrder": 0
      }
    }
  },
  "economy": {
    "monthlyGold": "floor(commerce*1.5*taxModifier)",
    "monthlyFoodUse": "ceil(troops/100)",
    "septemberHarvest": "floor(farm*8*harvestMultiplier*famineModifier)",
    "order": "pay maintenance, collect taxes, apply seasonal harvest; clamp at zero and log shortages"
  },
  "eventPriority": [
    "EV07",
    "EV04",
    "EV02",
    "EV06",
    "EV05",
    "EV03",
    "EV01",
    "EV08"
  ],
  "rng": "seeded PRNG; persist rngState; no Math.random",
  "battle": "Use existing 8x6 tactical contract; damage coefficients remain provisional",
  "commandValidation": [
    "actor exists and active",
    "target exists and owned where required",
    "adjacency for marches",
    "resources sufficient before mutation",
    "one-use action limits",
    "war/alliance exclusions"
  ],
  "save": {
    "version": "1.2.0",
    "atomicWrite": true,
    "rejectUnknownVersions": true,
    "retainOriginalOnError": true
  },
  "ai": {
    "priority": [
      "survival",
      "defend_capital",
      "avoid_food_deficit",
      "repair_economy",
      "diplomacy",
      "opportunistic_war"
    ],
    "tieBreak": "sort stable IDs then seeded PRNG",
    "difficulty": "weight adjustments only; no unlimited resources"
  }
};

// v1.2a: separate IDs preserve all original officers.
globalThis.YABOU_NEW_OFFICERS=[{"id":"N001","name":"玄八","species":"タヌキ","stats":{"leadership":83,"valor":91,"intellect":38,"politics":42,"charisma":77},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C01","duty":50,"ambition":30,"affinity":0,"concealment":0},{"id":"N002","name":"コン","species":"キツネ","stats":{"leadership":48,"valor":32,"intellect":96,"politics":83,"charisma":75},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C02","duty":60,"ambition":40,"affinity":13,"concealment":5},{"id":"N003","name":"ガルム","species":"オオカミ","stats":{"leadership":89,"valor":94,"intellect":62,"politics":35,"charisma":71},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C03","duty":70,"ambition":50,"affinity":26,"concealment":10},{"id":"N004","name":"オルド","species":"フクロウ","stats":{"leadership":54,"valor":19,"intellect":94,"politics":91,"charisma":68},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C04","duty":80,"ambition":60,"affinity":39,"concealment":15},{"id":"N005","name":"カゲマル","species":"ネコ","stats":{"leadership":65,"valor":87,"intellect":89,"politics":24,"charisma":43},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C05","duty":50,"ambition":70,"affinity":52,"concealment":20},{"id":"N006","name":"リリィ","species":"ウサギ","stats":{"leadership":79,"valor":64,"intellect":77,"politics":51,"charisma":86},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C06","duty":60,"ambition":80,"affinity":65,"concealment":0},{"id":"N007","name":"クルミ","species":"リス","stats":{"leadership":33,"valor":18,"intellect":81,"politics":97,"charisma":82},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C07","duty":70,"ambition":30,"affinity":78,"concealment":5},{"id":"N008","name":"レオンハルト","species":"人間","stats":{"leadership":92,"valor":86,"intellect":75,"politics":68,"charisma":88},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C08","duty":80,"ambition":40,"affinity":91,"concealment":10},{"id":"N009","name":"セシリア","species":"エルフ","stats":{"leadership":72,"valor":59,"intellect":93,"politics":87,"charisma":84},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C09","duty":50,"ambition":50,"affinity":4,"concealment":15},{"id":"N010","name":"バルド","species":"ドワーフ","stats":{"leadership":81,"valor":88,"intellect":45,"politics":76,"charisma":57},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C10","duty":60,"ambition":60,"affinity":17,"concealment":20},{"id":"N011","name":"シオン","species":"人間","stats":{"leadership":43,"valor":52,"intellect":95,"politics":67,"charisma":62},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C11","duty":70,"ambition":70,"affinity":30,"concealment":0},{"id":"N012","name":"ヴェラ","species":"魔族","stats":{"leadership":86,"valor":82,"intellect":88,"politics":46,"charisma":91},"factionId":null,"role":"武将","isProvisional":true,"placement":"wild","regionCastleId":"C12","duty":80,"ambition":80,"affinity":43,"concealment":5},{"id":"N013","name":"ハク","species":"白虎族","stats":{"leadership":88,"valor":96,"intellect":41,"politics":30,"charisma":72},"factionId":"F01","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C01","duty":50,"ambition":30,"affinity":56,"concealment":10},{"id":"N014","name":"ミスト","species":"精霊","stats":{"leadership":36,"valor":25,"intellect":92,"politics":84,"charisma":78},"factionId":"F02","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C02","duty":60,"ambition":40,"affinity":69,"concealment":15},{"id":"N015","name":"ロッカ","species":"岩人族","stats":{"leadership":90,"valor":85,"intellect":28,"politics":62,"charisma":49},"factionId":"F03","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C03","duty":70,"ambition":50,"affinity":82,"concealment":20},{"id":"N016","name":"ナギ","species":"人間","stats":{"leadership":71,"valor":82,"intellect":80,"politics":55,"charisma":74},"factionId":"F04","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C04","duty":80,"ambition":60,"affinity":95,"concealment":0},{"id":"N017","name":"ジン","species":"カラス族","stats":{"leadership":61,"valor":48,"intellect":91,"politics":72,"charisma":39},"factionId":"F05","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C05","duty":50,"ambition":70,"affinity":8,"concealment":5},{"id":"N018","name":"フローラ","species":"花精族","stats":{"leadership":28,"valor":12,"intellect":75,"politics":95,"charisma":94},"factionId":"F06","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C06","duty":60,"ambition":80,"affinity":21,"concealment":10},{"id":"N019","name":"グレン","species":"竜人族","stats":{"leadership":94,"valor":93,"intellect":54,"politics":36,"charisma":81},"factionId":"F01","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C07","duty":70,"ambition":30,"affinity":34,"concealment":15},{"id":"N020","name":"トト","species":"モグラ族","stats":{"leadership":42,"valor":35,"intellect":74,"politics":89,"charisma":65},"factionId":"F02","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C08","duty":80,"ambition":40,"affinity":47,"concealment":20},{"id":"N021","name":"エリス","species":"人間","stats":{"leadership":68,"valor":47,"intellect":88,"politics":92,"charisma":90},"factionId":"F03","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C09","duty":50,"ambition":50,"affinity":60,"concealment":0},{"id":"N022","name":"ザクロ","species":"鬼族","stats":{"leadership":82,"valor":97,"intellect":29,"politics":17,"charisma":61},"factionId":"F04","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C10","duty":60,"ambition":60,"affinity":73,"concealment":5},{"id":"N023","name":"ノア","species":"人間","stats":{"leadership":52,"valor":36,"intellect":83,"politics":76,"charisma":98},"factionId":"F05","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C11","duty":70,"ambition":70,"affinity":86,"concealment":10},{"id":"N024","name":"ラウル","species":"獅子族","stats":{"leadership":93,"valor":89,"intellect":68,"politics":61,"charisma":85},"factionId":"F06","role":"武将","isProvisional":true,"placement":"retainer","regionCastleId":"C12","duty":80,"ambition":80,"affinity":99,"concealment":15},{"id":"N025","name":"ユズリハ","species":"狐族","stats":{"leadership":57,"valor":44,"intellect":90,"politics":85,"charisma":88},"factionId":null,"role":"武将","isProvisional":true,"placement":"wanderer","regionCastleId":"C01","duty":50,"ambition":30,"affinity":12,"concealment":20},{"id":"N026","name":"ボルグ","species":"オーク族","stats":{"leadership":84,"valor":92,"intellect":34,"politics":41,"charisma":59},"factionId":null,"role":"武将","isProvisional":true,"placement":"wanderer","regionCastleId":"C02","duty":60,"ambition":40,"affinity":25,"concealment":0},{"id":"N027","name":"フィン","species":"水精族","stats":{"leadership":75,"valor":51,"intellect":82,"politics":73,"charisma":79},"factionId":null,"role":"武将","isProvisional":true,"placement":"wanderer","regionCastleId":"C03","duty":70,"ambition":50,"affinity":38,"concealment":5},{"id":"N028","name":"アッシュ","species":"人間","stats":{"leadership":76,"valor":79,"intellect":86,"politics":44,"charisma":55},"factionId":null,"role":"武将","isProvisional":true,"placement":"wanderer","regionCastleId":"C04","duty":80,"ambition":60,"affinity":51,"concealment":10},{"id":"N029","name":"メル","species":"妖精族","stats":{"leadership":29,"valor":16,"intellect":79,"politics":71,"charisma":96},"factionId":null,"role":"武将","isProvisional":true,"placement":"locked","regionCastleId":"C05","duty":50,"ambition":70,"affinity":64,"concealment":15},{"id":"N030","name":"ゼノ","species":"魔族","stats":{"leadership":91,"valor":85,"intellect":92,"politics":72,"charisma":63},"factionId":null,"role":"武将","isProvisional":true,"placement":"locked","regionCastleId":"C06","duty":60,"ambition":80,"affinity":77,"concealment":20}];
YABOU_DATA.officers.push(...YABOU_NEW_OFFICERS);
Object.assign(YABOU_RULES.commands,{search:{cost:{gold:250},delta:{}},hire:{cost:{gold:0},delta:{}}});
