window.__APP_PROTOCOL_DATA__={
  "schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:app-ui:protocol-schema:1.0.0",
    "title": "Application UI Configuration Protocol",
    "type": "object",
    "required": [
      "$schema",
      "$id",
      "protocol",
      "protocolVersion",
      "appVersion",
      "encoding",
      "dataRevision",
      "annotations",
      "migrations",
      "config"
    ],
    "properties": {
      "$schema": {
        "const": "urn:app-ui:protocol-schema:1.0.0"
      },
      "$id": {
        "const": "urn:app-ui:protocol:1.0.0"
      },
      "protocol": {
        "const": "app-ui/ui-config"
      },
      "protocolVersion": {
        "type": "string",
        "pattern": "^\\d+\\.\\d+\\.\\d+$"
      },
      "appVersion": {
        "type": "string",
        "pattern": "^\\d+\\.\\d+\\.\\d+$"
      },
      "encoding": {
        "const": "UTF-8"
      },
      "dataRevision": {
        "type": "integer",
        "minimum": 1
      },
      "annotations": {
        "$ref": "#/$defs/annotations"
      },
      "migrations": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/migration"
        }
      },
      "config": {
        "$ref": "#/$defs/config"
      },
      "updateLog": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "unevaluatedProperties": false,
    "$defs": {
      "annotationName": {
        "type": "string",
        "pattern": "^data-[a-z0-9-]+$"
      },
      "annotations": {
        "type": "object",
        "required": [
          "appIdentity",
          "editorIdentity",
          "chatPanelIdentity",
          "chatTabIdentity",
          "pageBackAction",
          "settingsRoute",
          "themeRoute",
          "managedAttributes"
        ],
        "properties": {
          "appIdentity": {
            "$ref": "#/$defs/annotationName"
          },
          "editorIdentity": {
            "$ref": "#/$defs/annotationName"
          },
          "chatPanelIdentity": {
            "$ref": "#/$defs/annotationName"
          },
          "chatTabIdentity": {
            "$ref": "#/$defs/annotationName"
          },
          "pageBackAction": {
            "$ref": "#/$defs/annotationName"
          },
          "settingsRoute": {
            "$ref": "#/$defs/annotationName"
          },
          "themeRoute": {
            "$ref": "#/$defs/annotationName"
          },
          "managedAttributes": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "$ref": "#/$defs/annotationName"
            }
          }
        },
        "additionalProperties": false
      },
      "migration": {
        "type": "object",
        "required": [
          "from",
          "to",
          "dataRevision",
          "strategy"
        ],
        "properties": {
          "from": {
            "type": "string",
            "minLength": 1
          },
          "to": {
            "type": "string",
            "pattern": "^\\d+\\.\\d+\\.\\d+$"
          },
          "dataRevision": {
            "type": "integer",
            "minimum": 1
          },
          "strategy": {
            "const": "normalize-current-prune-stale"
          }
        },
        "additionalProperties": false
      },
      "media": {
        "type": "object",
        "required": [
          "key",
          "label",
          "strategy"
        ],
        "properties": {
          "key": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          },
          "strategy": {
            "type": "string",
            "minLength": 1
          }
        },
        "additionalProperties": false
      },
      "field": {
        "type": "object",
        "required": [
          "key",
          "label",
          "placeholder"
        ],
        "properties": {
          "key": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          },
          "placeholder": {
            "type": "string"
          },
          "maxLength": {
            "type": "integer",
            "minimum": 1
          }
        },
        "additionalProperties": false
      },
      "component": {
        "type": "object",
        "required": [
          "title",
          "subtitle",
          "controls",
          "media",
          "fields",
          "resetLabel",
          "resetText",
          "defaultState"
        ],
        "properties": {
          "title": {
            "type": "string"
          },
          "subtitle": {
            "type": "string"
          },
          "sourceType": {
            "type": "string"
          },
          "controls": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "string"
            }
          },
          "media": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/media"
            }
          },
          "fields": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/field"
            }
          },
          "resetLabel": {
            "type": "string"
          },
          "resetText": {
            "type": "string"
          },
          "defaultState": {
            "type": "object"
          }
        },
        "additionalProperties": false
      },
      "config": {
        "type": "object",
        "required": [
          "database",
          "api",
          "chat",
          "worldbook",
          "product",
          "apps",
          "routes",
          "pages",
          "theme",
          "image",
          "styleControls",
          "components",
          "editorViews",
          "themeImageEditor",
          "themeImages",
          "pager",
          "roster",
          "auth"
        ],
        "properties": {
          "database": {
            "type": "object",
            "required": [
              "name",
              "version",
              "schema",
              "persistentKeys",
              "protocolKey"
            ],
            "properties": {
              "name": {
                "type": "string",
                "minLength": 1
              },
              "version": {
                "type": "integer",
                "minimum": 1
              },
              "schema": {
                "type": "object",
                "minProperties": 1,
                "additionalProperties": {
                  "type": "string"
                }
              },
              "persistentKeys": {
                "type": "array",
                "uniqueItems": true,
                "items": {
                  "type": "string"
                }
              },
              "protocolKey": {
                "type": "string",
                "minLength": 1
              }
            },
            "additionalProperties": false
          },
          "api": {
            "type": "object"
          },
          "chat": {
            "type": "object",
            "required": [
              "allowedTabs"
            ],
            "properties": {
              "allowedTabs": {
                "type": "array",
                "minItems": 1,
                "uniqueItems": true,
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              }
            },
            "additionalProperties": false
          },
          "worldbook": {
            "type": "object",
            "required": [
              "settingKey",
              "scopes",
              "positions",
              "strategies",
              "selectiveLogics",
              "roles",
              "defaults"
            ],
            "properties": {
              "settingKey": {
                "type": "string",
                "minLength": 1
              },
              "scopes": {
                "type": "object",
                "minProperties": 1,
                "additionalProperties": {
                  "type": "string"
                }
              },
              "positions": {
                "type": "object",
                "minProperties": 1,
                "additionalProperties": {
                  "type": "string"
                }
              },
              "strategies": {
                "type": "object",
                "minProperties": 1,
                "additionalProperties": {
                  "type": "string"
                }
              },
              "selectiveLogics": {
                "type": "array",
                "minItems": 1,
                "uniqueItems": true,
                "items": {
                  "type": "string"
                }
              },
              "roles": {
                "type": "array",
                "minItems": 1,
                "uniqueItems": true,
                "items": {
                  "type": "string"
                }
              },
              "defaults": {
                "type": "object",
                "required": [
                  "book",
                  "entry"
                ],
                "properties": {
                  "book": {
                    "type": "object"
                  },
                  "entry": {
                    "type": "object"
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          },
          "product": {
            "type": "object"
          },
          "apps": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "object",
              "required": [
                "id"
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "pattern": "^[a-z0-9-]+$"
                }
              },
              "additionalProperties": false
            }
          },
          "routes": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "required": [
                "pageId"
              ],
              "properties": {
                "pageId": {
                  "type": "string"
                },
                "featureId": {
                  "type": "string",
                  "pattern": "^[a-z0-9-]+$"
                }
              },
              "additionalProperties": false
            }
          },
          "pages": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "required": [
                "selector"
              ],
              "properties": {
                "selector": {
                  "type": "string",
                  "pattern": "^#"
                },
                "backTarget": {
                  "type": "object",
                  "required": [
                    "pageId",
                    "appId"
                  ],
                  "properties": {
                    "pageId": {
                      "type": "string",
                      "minLength": 1
                    },
                    "appId": {
                      "type": "string",
                      "minLength": 1
                    }
                  },
                  "additionalProperties": false
                }
              },
              "additionalProperties": false
            }
          },
          "theme": {
            "type": "object"
          },
          "image": {
            "type": "object"
          },
          "styleControls": {
            "type": "object"
          },
          "components": {
            "type": "object",
            "additionalProperties": {
              "$ref": "#/$defs/component"
            }
          },
          "editorViews": {
            "type": "object",
            "additionalProperties": {
              "$ref": "#/$defs/component"
            }
          },
          "themeImageEditor": {
            "type": "object"
          },
          "themeImages": {
            "type": "object"
          },
          "pager": {
            "type": "object"
          },
          "roster": {
            "type": "object",
            "required": [
              "settingKey",
              "relationSettingKey",
              "idDigits",
              "prefixes",
              "ui"
            ],
            "properties": {
              "settingKey": {
                "type": "string",
                "minLength": 1
              },
              "idDigits": {
                "type": "integer",
                "const": 16
              },
              "prefixes": {
                "type": "object",
                "required": [
                  "char",
                  "npc",
                  "userid"
                ],
                "properties": {
                  "char": {
                    "const": "char"
                  },
                  "npc": {
                    "const": "npc"
                  },
                  "userid": {
                    "const": "userid"
                  }
                },
                "additionalProperties": false
              },
              "ui": {
                "type": "object",
                "required": [
                  "defaultTab",
                  "title",
                  "subtitle",
                  "memoryTitle",
                  "memorySubtitle",
                  "addAriaLabel",
                  "emptyLabel",
                  "decoration",
                  "tabs",
                  "editor",
                  "relations",
                  "backAriaLabel",
                  "ungroupedLabel",
                  "memoryMark",
                  "deleteConfirm",
                  "messages"
                ],
                "properties": {
                  "defaultTab": {
                    "type": "string",
                    "minLength": 1
                  },
                  "title": {
                    "type": "string",
                    "minLength": 1
                  },
                  "memoryTitle": {
                    "type": "string",
                    "minLength": 1
                  },
                  "addAriaLabel": {
                    "type": "string",
                    "minLength": 1
                  },
                  "emptyLabel": {
                    "type": "string",
                    "minLength": 1
                  },
                  "decoration": {
                    "type": "object"
                  },
                  "tabs": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                      "type": "object"
                    }
                  },
                  "editor": {
                    "type": "object"
                  },
                  "backAriaLabel": {
                    "type": "string",
                    "minLength": 1
                  },
                  "ungroupedLabel": {
                    "type": "string",
                    "minLength": 1
                  },
                  "memoryMark": {
                    "type": "string",
                    "minLength": 1
                  },
                  "deleteConfirm": {
                    "type": "object"
                  },
                  "messages": {
                    "type": "object"
                  },
                  "subtitle": {
                    "type": "string",
                    "minLength": 1
                  },
                  "memorySubtitle": {
                    "type": "string",
                    "minLength": 1
                  },
                  "relations": {
                    "type": "object"
                  }
                },
                "additionalProperties": false
              },
              "relationSettingKey": {
                "type": "string",
                "minLength": 1
              }
            },
            "additionalProperties": false
          },
          "auth": {
            "type": "object",
            "required": [
              "protocol",
              "protocolVersion",
              "sessionKey",
              "legacyClaimKey",
              "scopedSettings",
              "legacyPassword",
              "ui",
              "rosterType"
            ],
            "properties": {
              "protocol": {
                "const": "app-ui/roster-identity"
              },
              "protocolVersion": {
                "type": "string"
              },
              "sessionKey": {
                "type": "string"
              },
              "legacyClaimKey": {
                "type": "string"
              },
              "scopedSettings": {
                "type": "object",
                "additionalProperties": {
                  "type": "array",
                  "uniqueItems": true,
                  "items": {
                    "type": "string"
                  }
                }
              },
              "ui": {
                "type": "object",
                "required": [
                  "chat"
                ],
                "properties": {
                  "chat": {
                    "type": "object",
                    "required": [
                      "title",
                      "backAriaLabel",
                      "usernameLabel",
                      "usernamePlaceholder",
                      "passwordLabel",
                      "passwordPlaceholder",
                      "submitLabel",
                      "failureLabel"
                    ],
                    "properties": {
                      "title": {
                        "type": "string",
                        "minLength": 1
                      },
                      "backAriaLabel": {
                        "type": "string",
                        "minLength": 1
                      },
                      "usernameLabel": {
                        "type": "string",
                        "minLength": 1
                      },
                      "usernamePlaceholder": {
                        "type": "string",
                        "minLength": 1
                      },
                      "passwordLabel": {
                        "type": "string",
                        "minLength": 1
                      },
                      "passwordPlaceholder": {
                        "type": "string",
                        "minLength": 1
                      },
                      "submitLabel": {
                        "type": "string",
                        "minLength": 1
                      },
                      "failureLabel": {
                        "type": "string",
                        "minLength": 1
                      }
                    },
                    "additionalProperties": false
                  }
                },
                "additionalProperties": false
              },
              "rosterType": {
                "const": "userid"
              },
              "legacyPassword": {
                "type": "object",
                "required": [
                  "algorithm",
                  "hash",
                  "iterations",
                  "saltBytes",
                  "derivedBytes"
                ],
                "properties": {
                  "algorithm": {
                    "const": "PBKDF2"
                  },
                  "hash": {
                    "const": "SHA-256"
                  },
                  "iterations": {
                    "type": "integer",
                    "minimum": 600000
                  },
                  "saltBytes": {
                    "type": "integer",
                    "minimum": 16
                  },
                  "derivedBytes": {
                    "type": "integer",
                    "minimum": 32
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      },
      "authAccount": {
        "type": "object",
        "required": [
          "id",
          "appId",
          "username",
          "verifier",
          "createdAt"
        ],
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "appId": {
            "type": "string",
            "minLength": 1
          },
          "username": {
            "type": "string",
            "minLength": 1
          },
          "verifier": {
            "type": "object",
            "required": [
              "algorithm",
              "hash",
              "iterations",
              "salt",
              "digest"
            ],
            "properties": {
              "algorithm": {
                "const": "PBKDF2"
              },
              "hash": {
                "const": "SHA-256"
              },
              "iterations": {
                "type": "integer",
                "minimum": 600000
              },
              "salt": {
                "type": "string"
              },
              "digest": {
                "type": "string"
              }
            },
            "additionalProperties": false
          },
          "createdAt": {
            "type": "integer"
          }
        },
        "additionalProperties": false
      }
    }
  },
  "protocol": {
    "$schema": "urn:app-ui:protocol-schema:1.0.0",
    "$id": "urn:app-ui:protocol:1.0.0",
    "protocol": "app-ui/ui-config",
    "protocolVersion": "1.0.0",
    "appVersion": "0.0.41",
    "encoding": "UTF-8",
    "dataRevision": 46,
    "annotations": {
      "appIdentity": "data-app-id",
      "editorIdentity": "data-editor",
      "chatPanelIdentity": "data-chat-panel",
      "chatTabIdentity": "data-chat-tab",
      "pageBackAction": "data-page-back",
      "settingsRoute": "data-settings-entry",
      "themeRoute": "data-theme-entry",
      "managedAttributes": [
        "data-api-context",
        "data-api-fetch-models",
        "data-api-key",
        "data-api-model",
        "data-api-preset",
        "data-api-preset-delete",
        "data-api-preset-save",
        "data-api-provider",
        "data-api-save",
        "data-api-temperature",
        "data-api-temperature-value",
        "data-api-test",
        "data-api-url",
        "data-app-id",
        "data-bind",
        "data-cancel",
        "data-chat-panel",
        "data-chat-player-progress",
        "data-chat-player-toggle",
        "data-chat-tab",
        "data-chat-tail",
        "data-chat-time",
        "data-choice",
        "data-color",
        "data-confirm",
        "data-danger",
        "data-diary-date",
        "data-editor",
        "data-field",
        "data-icon-app",
        "data-icon-color",
        "data-icon-modal-local",
        "data-icon-modal-preview",
        "data-icon-modal-shell",
        "data-icon-modal-url",
        "data-icon-preview",
        "data-icon-radius",
        "data-icon-radius-value",
        "data-icon-shell-color",
        "data-icon-size",
        "data-icon-size-value",
        "data-instagram-panel",
        "data-instagram-tab",
        "data-weibo-panel",
        "data-weibo-tab",
        "data-weibo-home-tab",
        "data-weibo-channel",
        "data-weibo-feed",
        "data-weibo-feed-copy",
        "data-weibo-compose",
        "data-weibo-compose-open",
        "data-weibo-compose-close",
        "data-icons-reset",
        "data-icons-save",
        "data-lore-add",
        "data-lore-book-scope",
        "data-lore-book-title",
        "data-lore-case-sensitive",
        "data-lore-content",
        "data-lore-delete-selected",
        "data-lore-depth",
        "data-lore-depth-fields",
        "data-lore-editor-cancel",
        "data-lore-editor-save",
        "data-lore-editor-title",
        "data-lore-enabled",
        "data-lore-entry-count",
        "data-lore-entry-id",
        "data-lore-entry-list",
        "data-lore-filters",
        "data-lore-form",
        "data-lore-keys",
        "data-lore-keyword-fields",
        "data-lore-logic",
        "data-lore-manage",
        "data-lore-manage-bar",
        "data-lore-manage-done",
        "data-lore-memo",
        "data-lore-order",
        "data-lore-position",
        "data-lore-probability",
        "data-lore-probability-value",
        "data-lore-role",
        "data-lore-scan-depth",
        "data-lore-strategy",
        "data-lore-trigger-note",
        "data-lore-whole-words",
        "data-media",
        "data-media-url",
        "data-media-view",
        "data-modal-cancel",
        "data-modal-confirm",
        "data-modal-field",
        "data-page-back",
        "data-page-id",
        "data-panel-action",
        "data-preview",
        "data-range",
        "data-range-value",
        "data-reset",
        "data-reset-cancel",
        "data-reset-confirm",
        "data-scope",
        "data-seq",
        "data-settings-avatar",
        "data-settings-avatar-editor",
        "data-settings-entry",
        "data-source-mode",
        "data-system-guide-copy",
        "data-theme-entry",
        "data-theme-icon-grid",
        "data-upload",
        "data-wallpaper-change",
        "data-wallpaper-modal-local",
        "data-wallpaper-modal-preview",
        "data-wallpaper-modal-url",
        "data-wallpaper-preview",
        "data-wallpaper-reset",
        "data-wallpaper-save",
        "data-worldbook-create",
        "data-worldbook-filter",
        "data-worldbook-filter-menu",
        "data-worldbook-id",
        "data-worldbook-list",
        "data-worldbook-more",
        "data-worldbook-total",
        "data-lock-setting",
        "data-lock-password-input",
        "data-lock-wallpaper-preview",
        "data-lock-wallpaper-change",
        "data-lock-wallpaper-reset",
        "data-lock-wallpaper-save",
        "data-lock-passcode",
        "data-lock-passcode-dot",
        "data-passcode-digit",
        "data-passcode-cancel",
        "data-passcode-emergency",
        "data-social-avatar",
        "data-social-cover",
        "data-social-avatar-image",
        "data-social-media",
        "data-social-file",
        "data-social-field"
      ]
    },
    "migrations": [
      {
        "from": "0.0.24",
        "to": "0.0.26",
        "dataRevision": 42,
        "strategy": "normalize-current-prune-stale"
      },
      {
        "from": "0.0.26",
        "to": "0.0.27",
        "dataRevision": 44,
        "strategy": "normalize-current-prune-stale"
      },
      {
        "from": "0.0.30",
        "to": "0.0.31",
        "dataRevision": 45,
        "strategy": "register-wallet-route-page-and-account-scoped-data"
      },
      {
        "from": "0.0.31",
        "to": "0.0.32",
        "dataRevision": 45,
        "strategy": "bind-feature-modules-to-versioned-runtime-registry"
      },
      {
        "from": "0.0.32",
        "to": "0.0.33",
        "dataRevision": 45,
        "strategy": "recompose-wallet-on-global-page-primitives"
      },
      {
        "from": "0.0.33",
        "to": "0.0.34",
        "dataRevision": 45,
        "strategy": "refine-wallet-visual-hierarchy-with-global-tokens"
      },
      {
        "from": "0.0.34",
        "to": "0.0.35",
        "dataRevision": 45,
        "strategy": "add-wallet-balance-recharge-withdraw-actions"
      },
      {
        "from": "0.0.37",
        "to": "0.0.38",
        "dataRevision": 46,
        "strategy": "redesign-chat-friend-home-and-account-scoped-friend-controls"
      },
      {
        "from": "0.0.38",
        "to": "0.0.39",
        "dataRevision": 46,
        "strategy": "restore-chat-owned-friend-thread-and-flatten-friend-profile-ui"
      },
      {
        "from": "0.0.39",
        "to": "0.0.40",
        "dataRevision": 46,
        "strategy": "redesign-chat-friend-profile-visual-hierarchy"
      }
      ,{
        "from": "0.0.40",
        "to": "0.0.41",
        "dataRevision": 46,
        "strategy": "reuse-chat-native-profile-and-menu-rhythm-for-friend-home"
      }
    ],
    "config": {
      "database": {
        "name": "MobileHomeUI",
        "version": 3,
        "schema": {
          "settings": "&key",
          "assets": "&id,status,strategy,createdAt",
          "accounts": "&id,&[appId+username]"
        },
        "persistentKeys": [
          "apiConfig",
          "apiPresets",
          "worldbooks",
          "rosterProfiles",
          "rosterRelations",
          "themeLockScreen",
          "chatConversations",
          "__app_auth_session__",
          "__app_legacy_claim__",
          "chatFriendRequests",
          "communicationOwnerId",
          "sharedConversationStore",
          "conversationMemoryStore",
          "memoryQuickOwnerId",
          "walletData"
        ],
        "protocolKey": "__app_protocol__"
      },
      "api": {
        "guideDuration": 5000,
        "defaultState": {
          "provider": "compatible",
          "url": "",
          "apiKey": "",
          "model": "",
          "contextCount": 20,
          "temperature": 0.7
        },
        "providers": {
          "compatible": {
            "label": "OpenAI 兼容",
            "url": "",
            "models": []
          },
          "openai": {
            "label": "OpenAI",
            "url": "https://api.openai.com/v1",
            "models": [
              "gpt-5.6",
              "gpt-5.6-sol",
              "gpt-5.6-terra",
              "gpt-5.6-luna"
            ]
          },
          "anthropic": {
            "label": "Anthropic",
            "url": "https://api.anthropic.com/v1",
            "models": [
              "claude-sonnet-5",
              "claude-opus-5",
              "claude-fable-5",
              "claude-haiku-4-5"
            ]
          },
          "gemini": {
            "label": "Google Gemini",
            "url": "https://generativelanguage.googleapis.com/v1beta",
            "models": [
              "gemini-3.8-flash",
              "gemini-3.7-flash",
              "gemini-3.6-flash",
              "gemini-3.5-flash",
              "gemini-3.5-flash-lite",
              "gemini-2.5-pro",
              "gemini-2.5-flash"
            ]
          },
          "deepseek": {
            "label": "DeepSeek",
            "url": "https://api.deepseek.com",
            "models": [
              "deepseek-flash",
              "deepseek-v4-pro"
            ]
          },
          "xai": {
            "label": "xAI Grok",
            "url": "https://api.x.ai/v1",
            "models": [
              "grok-4.6"
            ]
          },
          "openrouter": {
            "label": "OpenRouter",
            "url": "https://openrouter.ai/api/v1",
            "models": [
              "~openai/gpt-latest",
              "~anthropic/claude-sonnet-latest"
            ]
          },
          "siliconflow": {
            "label": "SiliconFlow",
            "url": "https://api.siliconflow.cn/v1",
            "models": [
              "deepseek-ai/DeepSeek-V4-Flash",
              "Pro/deepseek-ai/DeepSeek-V4-Pro",
              "Pro/moonshotai/Kimi-K2.6",
              "Pro/zai-org/GLM-5.1"
            ]
          }
        },
        "settingKeys": {
          "config": "apiConfig",
          "presets": "apiPresets"
        }
      },
      "product": {
        "name": "𝒰𝓃𝒶 𝓞𝓢",
        "version": "0.0.41",
        "releaseDate": "2026.09.30",
        "copyright": "© 2026 𝒰𝓃𝒶 𝓞𝓢. All rights reserved.",
        "updateLog": [
          "0.0.41：撤回 0.0.40 的额外好友主页视觉语言，好友资料区改为直接复用 Chat 动态页既有的背景图、居中圆形头像、昵称与 IP 构图；六项功能不再使用主按钮/快捷按钮/管理卡片三套层级，而统一为 Chat 我页同源的轻量列表节奏，并严格按“动态、设置、聊天、清空聊天记录、拉黑好友、删除好友”顺序呈现。Chat 内部会话去除头部方形头像与实心发送按钮，改用 Chat 大标题和虚线控件语言。业务路由、共享会话库、chat 通道与账号隔离逻辑均不变。",
          "0.0.40：重做聊天通讯录好友主页与 Chat 内部会话的视觉层级：背景图与白色内容层以单一过渡面衔接，头像采用非圆形软角并与昵称/IP 形成紧凑身份组；聊天提升为唯一主动作，动态/设置降为轻量快捷项，清空/拉黑/删除降为低权重管理列表。Chat 会话同步收紧顶部、气泡与输入区比例，取消短信模板式分隔感。所有新增几何继续仅由 --chat-app-u 派生，不改变 0.0.39 已修正的 Chat 内部路由与共享会话库逻辑。",
          "0.0.39：修正聊天通讯录好友主页的错误跨 App 路由：好友主页“聊天”不再打开信息 App，而是在 Chat 壳层内进入独立会话页；Chat 会话继续读写同一共享原始会话库，但发送与模型回复标记为 chat 通道。好友主页同步重做为背景图、左侧叠放头像、昵称/IP 与扁平操作列表，取消上一版居中头像、圆形功能壳和大块管理卡片，新增尺寸只由 --chat-app-u 派生。",
          "0.0.38：重做聊天通讯录好友主页：视觉主体只保留背景图、头像、昵称与 IP，移除账号、签名、关系和档案字段表；新增动态、设置、聊天、清空聊天记录、拉黑好友、删除好友六项操作。置顶、免打扰与拉黑状态按当前聊天账号独立持久化，置顶会改变好友排序；清空直接作用于共享会话库，删除好友仅解除好友关系并保留名册档案与既有消息。好友主页及两个子页继续只消费 .chat-app-page 下的 --chat-app-u / --chat-friend-* 单一母变量。",
          "0.0.37：修复聊天通讯录好友条目点击无响应：好友列表改为就近事件委托并阻断外层页面事件继续处理；好友主页先完成可见状态切换，再渲染关系、头像与背景等装饰数据，单项资料或媒体异常不再阻止进入好友主页；好友 ID 比较统一字符串化。",
          "0.0.36：完善聊天 App 的通讯录好友主页：好友列表改为聊天私有列表行并接入名册头像；点击好友条目直接进入 Chat 壳层内的好友主页，展示名册背景图、头像、昵称、账号、签名、关系与可用档案信息。好友主页不注册第二套 global-page 页面，新增尺寸全部由 .chat-app-page 内的 --chat-app-u 与 --chat-friend-* 母变量派生，返回后保持通讯录上下文。",
          "0.0.35：钱包资产面板新增充值与提现按钮，直接复用全局 APP.modal 居中面板输入金额；充值增加当前账号余额，提现在余额校验通过后扣减，二者均写入当前账号独立 walletData 账单并即时刷新总资产。新增按钮尺寸继续只派生自 --editor-u 与既有全局 token。",
          "0.0.34：钱包首页重构视觉层级：资产区成为主视觉并拆分余额/理财/情侣资产来源；收付款升级为主动作，亲属卡/银行卡/设置/账单改为双列次级功能块；最近账单重新进入完整软质分组，底部理财/情侣/钱包 Dock 采用内层选中面。未新增钱包尺寸母变量，继续复用全局 --editor-u 与既有 global token，且不使用渐变、描边或阴影堆叠。",
          "0.0.33：钱包 UI 删除私有页面几何体系，统一改由 global-page-scroll / nav / content / group / entry / list / section 控制顶部起点、横向边距、区块节奏、列表高度与圆角；资产面板仅保留业务排版，底部理财/情侣/钱包导航只消费既有全局 token；修正此前 absolute 主内容绕过全局 edge-y 与 safe-area 导致的首屏起点偏差。",
          "0.0.32：修复功能模块半升级导致的钱包打开失败：移除 app.js 对功能对象名称的硬编码查找，features.js 在加载阶段将模块实例注册到统一 featureRuntime，并以构建版本封印；APP 初始化时强校验 features.js 与协议 appVersion 一致，资源不一致直接阻止进入 ready，避免路由已升级而功能模块仍为旧文件。",
          "0.0.31：补全钱包 App：稳定 wallet 身份入口只传 appId，由统一 appRegistry/appManager/pageManager 解析 wallet 页面；新增按名册用户账号隔离的 walletData 作用域，资产、收付款、本地账单、亲属卡、银行卡、理财、情侣资金与设置均按 userid 独立持久化；钱包全部尺寸继续派生自全局 --editor-u 与既有 UI token，不建立第二套尺寸母变量。",
          "0.0.30：信息聊天页导航栏右上角改为当前好友/路人的圆形头像，直接复用名册头像资源与统一占位色；头像继续作为对话信息入口，不新增独立按钮或尺寸变量。",
          "0.0.29：信息页两个悬浮操作面板外壳取消描边与阴影；角色/路人一次返回多条消息时改由前端固定调度，第 1 条立即落库渲染，后续每条间隔 1.8 秒再写入共享上下文，不依赖模型控制节奏；请求及分段投递期间主标题显示“对方正在输入...”，结束后恢复联系人昵称。",
          "0.0.28：修复信息页两个悬浮操作面板的 Font Awesome 子集映射：清空/删除改用包内已有 Classic Solid fa-trash-can，编辑改用 fa-pen-to-square；不引入第二套图标资源或 SVG 兜底。",
          "0.0.27：信息对话“+”改为按需悬浮操作面板，新增重回、总结、清空与请求中暂停；移除常驻取消状态层并固定 message... 占位；长按消息支持复制、编辑、多选、删除，所有变更直接同步共享上下文；新增独立记忆归档库、结构化短信总结提示词、记忆 App 快捷账号登录与显式召回开关，归档不再写回聊天消息。",
          "0.0.26：关系网页签收敛为无滚动条的无限关系画布，支持拖拽、滚轮缩放和双指缩放；移除画布内工具条与关系列表；信息气泡圆角改为全局 --ui-control-radius，输入栏占位统一为 message...。",
          "0.0.24：名册关系网由静态占位升级为结构化双向关系图；关系使用名册稳定 ID，支持双向称谓、关系备注、中心人物切换、关系详情与编辑；信息联系人详情可查看/编辑关系并跳转关系网，信息生成上下文同步注入当前双方及一跳关系；所有新增界面尺寸继续只消费 --editor-u 与既有全局 UI token。",
          "0.0.23：信息对话页头昵称在生成期间替换为“对方正在输入…”，生成结束、失败或取消后恢复昵称；输入栏上方不再重复显示输入状态文字。",
          "0.0.22：信息聊天生成、发送与读取错误统一使用全局提示小横幅，移除局部错误显示与缓存；每轮仍为 1～6 条独立消息。",
          "0.0.21：信息空发送触发联系人续聊；带 type 与明确发送者的 JSON 协议、全局世界书注入、信息与聊天共享持久消息库。",
          "0.0.20：全局页面返回按钮颜色母变量 --global-page-back-color 固定为纯黑；所有 global-page-back 直接继承该单一母变量，聊天登录页返回按钮也取消私有主题灰颜色并统一读取同一母变量。",
          "0.0.19：主屏幕全部内置 App Logo 比例统一为 0.55；删除钱包、聊天、天气、社交、电话、信息、名册、记忆等残留的逐 App --icon-size 旧尺寸层，新增唯一 --app-logo-size 母变量；Font Awesome 与 SVG Logo 共用同一尺寸链，并由 App 外壳以绝对中心规则统一水平/垂直居中，主题图标预览同步复用同一母规则。",
          "0.0.17：信息对话右上角提示改为无外壳的裸感叹号；电话与信息机主/联系人头像统一为圆形裁切容器；电话与信息桌面 Logo 在不改变外壳尺寸的前提下等比例放大。",
          "0.0.16：信息会话气泡直接复用主页拍立得组件的装饰性气泡母型（胶囊轮廓 + 斜切尾巴），聊天场景按约 0.7 倍视觉尺度重算高度、内边距与尾巴尺寸，不使用 transform 假缩放；长文本保持自然换行，收/发消息分别使用浅色与主题灰变体。",
          "0.0.15：电话与信息的功能图标颜色统一接入全局 global-action-icon-color 母变量，并直接绑定主题灰 theme-primary；电话拨号/最近通话呼叫、信息加号/发送等原灰底白图标改为中性浅层表面 + 主题灰字形，页头返回、机主、筛选、搜索、编辑、信息等动作图标同步统一。",
          "0.0.14：电话与信息彻底回归全局 UI 母层：页面标题、返回、列表、头像动作、玻璃材质、筛选浮层与机主选择居中面板均直接复用全局组件；删除通信层私有 topbar/group/search/owner/popup 视觉实现，通信层只保留布局与业务差异。电话功能图标继续使用 Font Awesome Classic Solid。",
          "0.0.13：信息列表改为底部胶囊搜索栏与圆形新建按钮，右上角改为可切换的本机机主头像；电话同步接入机主身份。“用户”档案专用于本机身份选择，不再进入电话/信息联系人、搜索或收件人；消息与通话记录按机主隔离；电话界面图标统一为本地 Font Awesome Free 6 Classic Solid。",
          "0.0.12：修复启动协议资源版本链。所有带 ?v= 的 JS/CSS 资源统一与 appVersion 对齐，保留 0.0.11 电话/信息真实名册数据链，不恢复任何虚构联系人或历史记录。",
          "0.0.11：电话与信息彻底移除硬编码虚构联系人、虚构通话和虚构消息记录，统一直接读取共享名册 rosterProfiles。电话名册联系人/通讯录/搜索使用真实档案与真实头像；最近通话仅由实际呼叫动作生成。信息列表、筛选、收件人解析与会话头像均使用真实名册档案，空会话不再伪造历史消息。",
          "0.0.10：统一六个社交 App 的用户本人头像槽位和真实图片渲染链，修复多页面头像不同步、X 动态详情丢头像、img 旧 src 残留、抖音自定义作品误用作品图作为作者头像等问题。",
          "0.0.9：移除密码页进入与解锁过程中的 opacity 淡入淡出，统一为纯位移动画；6 个社交 App 的头像/背景更换表单收束到唯一 global profile media 组件与全局 token 母层，清理 social-profile 专用样式源。",
          "0.0.8：电话与信息移除私有视觉母层，统一消费全局控件、分组、图标壳与玻璃材质变量；电话拨号键恢复半透明磨砂玻璃。六个社交 App 的资料编辑统一迁移到同一居中母组件，并补齐可编辑背景图与头像。",
          "0.0.7：补齐“信息”App，并将所有 App 入口统一约束为仅传递稳定 appId；App 身份注册、路由解析与页面切换分别由注册表、统一管理器和页面管理器负责，禁止入口直接绑定页面或打开逻辑。",
          "0.0.6：修正锁屏密码键为真实半透明磨砂玻璃；聊天我页功能入口与编辑触发彻底解耦；新增仅参考 iOS 26 信息架构的 iuna 电话页。",
          "0.0.5：社交 App 初始头像与内容媒体统一为全局纯色占位，补齐个人资料编辑并复用全局居中编辑器。",
          "配置、组件、路由、页面与持久化标注已统一迁移为 application protocol 1.0.0。",
          "0.0.1 初始版本。",
          "世界书添加条目默认使用“始终触发”。",
          "条目选择栏与底部操作按钮直接复用全局 UI 母组件。",
          "全局操作按钮统一为透明背景与虚线描边，不使用灰色填充。",
          "全局开关统一为开启实线、关闭虚线的状态表达。",
          "扩充关于本机、免责声明、版权与使用许可说明。"
        ],
        "aboutSections": [
          {
            "title": "产品说明",
            "paragraphs": [
              "𝒰𝓃𝒶 𝓞𝓢 是面向个人使用的移动端界面与角色互动工具。本版本号为 0.0.41，当前仍处于初始版本阶段，功能、界面和数据结构可能在后续版本中继续调整。"
            ]
          },
          {
            "title": "本地数据与隐私",
            "paragraphs": [
              "账号配置、世界书、主题设置及本地导入资源主要保存在当前浏览器的本地存储空间中。除非使用者主动调用外部接口、导出或分享数据，本作品不会自行向作者上传上述内容。",
              "清除浏览器数据、更换设备、使用无痕模式或浏览器存储异常，均可能导致本地数据丢失。使用者应自行保留必要备份。"
            ]
          },
          {
            "title": "第三方服务",
            "paragraphs": [
              "使用者自行填写的 API、模型、图片地址、字体或其他网络资源由对应第三方提供，其可用性、资费、隐私政策、内容规则和服务中断均不由本作品控制。",
              "调用第三方接口可能产生费用、限额或账号风险，使用前应阅读并遵守相应服务条款。"
            ]
          },
          {
            "title": "内容与角色卡责任",
            "paragraphs": [
              "使用者应确保导入、展示或用于生成的角色卡、人物设定、图片、文字及其他素材已获得权利人明确授权，或依法享有相应使用权。",
              "不得使用未经允许的角色卡或其他受保护内容。因内容来源、授权范围、侵权争议或违法使用产生的责任由使用者自行承担。"
            ]
          },
          {
            "title": "免责声明",
            "paragraphs": [
              "本作品按现状提供，不承诺任何外部接口、模型输出或第三方资源始终准确、完整、连续或适用于特定用途。AI 生成内容可能存在事实错误、偏差或不当表达，重要信息应由使用者自行核验。",
              "因误操作、设备故障、浏览器兼容性、第三方服务异常、数据丢失或不当使用造成的直接或间接损失，在法律允许的范围内由使用者自行承担。"
            ]
          }
        ],
        "restriction": "未经作者明确许可，不得复制、修改、拆分、改包、反编译、二次传播、贩卖、出租或以其他方式向第三方提供本作品。",
        "supportPolicy": "发现使用未经允许的角色卡，或存在修改本作品、二次传播、贩卖等违规行为时，将立即停止更新、维护、答疑及其他售后服务，且不予退款。"
      },
      "apps": [
        {
          "id": "wallet"
        },
        {
          "id": "chat"
        },
        {
          "id": "weather"
        },
        {
          "id": "calendar-app"
        },
        {
          "id": "douyin"
        },
        {
          "id": "youtube"
        },
        {
          "id": "x"
        },
        {
          "id": "check"
        },
        {
          "id": "couple"
        },
        {
          "id": "delivery"
        },
        {
          "id": "shopping"
        },
        {
          "id": "weibo"
        },
        {
          "id": "idol"
        },
        {
          "id": "redbook"
        },
        {
          "id": "instagram"
        },
        {
          "id": "music"
        },
        {
          "id": "reading"
        },
        {
          "id": "game"
        },
        {
          "id": "browser"
        },
        {
          "id": "house"
        },
        {
          "id": "pet"
        },
        {
          "id": "online"
        },
        {
          "id": "store"
        },
        {
          "id": "phone"
        },
        {
          "id": "message"
        },
        {
          "id": "theme"
        },
        {
          "id": "settings"
        },
        {
          "id": "api"
        },
        {
          "id": "worldbook-settings"
        },
        {
          "id": "roster"
        },
        {
          "id": "memory"
        }
      ],
      "routes": {
        "chat": {
          "pageId": "chat",
          "featureId": "chat"
        },
        "phone": {
          "pageId": "phone",
          "featureId": "phone"
        },
        "douyin": {
          "pageId": "douyin",
          "featureId": "douyin"
        },
        "redbook": {
          "pageId": "redbook",
          "featureId": "redbook"
        },
        "instagram": {
          "pageId": "instagram",
          "featureId": "instagram"
        },
        "youtube": {
          "pageId": "youtube",
          "featureId": "youtube"
        },
        "weibo": {
          "pageId": "weibo",
          "featureId": "weibo"
        },
        "theme": {
          "pageId": "theme"
        },
        "settings": {
          "pageId": "settings"
        },
        "api": {
          "pageId": "api"
        },
        "worldbook-settings": {
          "pageId": "worldbook"
        },
        "x": {
          "pageId": "x",
          "featureId": "x"
        },
        "weather": {
          "pageId": "weather",
          "featureId": "weather"
        },
        "roster": {
          "pageId": "roster"
        },
        "memory": {
          "pageId": "memory"
        },
        "message": {
          "pageId": "message",
          "featureId": "message"
        },
        "wallet": {
          "pageId": "wallet",
          "featureId": "wallet"
        }
      },
      "pages": {
        "chat": {
          "selector": "#chatApp"
        },
        "phone": {
          "selector": "#phoneApp"
        },
        "message": {
          "selector": "#messageApp"
        },
        "chat-add-friend": {
          "selector": "#chatAddFriendApp",
          "backTarget": {
            "pageId": "chat",
            "appId": "chat"
          }
        },
        "chat-settings": {
          "selector": "#chatSettingsApp",
          "backTarget": {
            "pageId": "chat",
            "appId": "chat"
          }
        },
        "chat-switch-account": {
          "selector": "#chatSwitchAccountApp",
          "backTarget": {
            "pageId": "chat-settings",
            "appId": "chat"
          }
        },
        "douyin": {
          "selector": "#douyinApp"
        },
        "redbook": {
          "selector": "#redbookApp"
        },
        "instagram": {
          "selector": "#instagramApp"
        },
        "youtube": {
          "selector": "#youtubeApp"
        },
        "weibo": {
          "selector": "#weiboApp"
        },
        "theme": {
          "selector": "#themeApp"
        },
        "wallpaper": {
          "selector": "#wallpaperApp",
          "backTarget": {
            "pageId": "theme",
            "appId": "theme"
          }
        },
        "icons": {
          "selector": "#iconsApp",
          "backTarget": {
            "pageId": "theme",
            "appId": "theme"
          }
        },
        "settings": {
          "selector": "#settingsApp"
        },
        "api": {
          "selector": "#apiApp",
          "backTarget": {
            "pageId": "settings",
            "appId": "settings"
          }
        },
        "worldbook": {
          "selector": "#worldbookApp",
          "backTarget": {
            "pageId": "settings",
            "appId": "settings"
          }
        },
        "worldbook-entries": {
          "selector": "#worldbookEntriesApp"
        },
        "worldbook-entry-editor": {
          "selector": "#worldbookEntryEditorApp"
        },
        "x": {
          "selector": "#xApp"
        },
        "weather": {
          "selector": "#weatherApp"
        },
        "roster": {
          "selector": "#rosterApp"
        },
        "roster-editor": {
          "selector": "#rosterEditorApp"
        },
        "memory": {
          "selector": "#memoryApp"
        },
        "lock-settings": {
          "selector": "#lockSettingsApp",
          "backTarget": {
            "pageId": "theme",
            "appId": "theme"
          }
        },
        "wallet": {
          "selector": "#walletApp"
        }
      },
      "theme": {
        "wallpaper": {
          "settingKey": "themeWallpaper",
          "strategy": "freeImage",
          "defaultState": {
            "image": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            }
          }
        },
        "lockWallpaper": {
          "settingKey": "themeLockWallpaper",
          "strategy": "freeImage",
          "defaultState": {
            "image": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            }
          }
        },
        "icons": {
          "settingKey": "themeIcons",
          "defaultSize": 63,
          "defaultRadius": 15,
          "defaultIconColor": {
            "$css": "--theme-primary"
          },
          "defaultShellColor": {
            "$css": "--white"
          },
          "sizeMin": 48,
          "sizeMax": 72,
          "radiusMin": 0,
          "radiusMax": 36,
          "apps": [
            {
              "id": "wallet",
              "label": "钱包"
            },
            {
              "id": "chat",
              "label": "聊天"
            },
            {
              "id": "weather",
              "label": "天气"
            },
            {
              "id": "calendar-app",
              "label": "日历"
            },
            {
              "id": "douyin",
              "label": "抖音"
            },
            {
              "id": "youtube",
              "label": "YouTube"
            },
            {
              "id": "x",
              "label": "X"
            },
            {
              "id": "check",
              "label": "查岗"
            },
            {
              "id": "couple",
              "label": "情侣空间"
            },
            {
              "id": "delivery",
              "label": "外卖"
            },
            {
              "id": "shopping",
              "label": "购物"
            },
            {
              "id": "weibo",
              "label": "微博"
            },
            {
              "id": "idol",
              "label": "idol"
            },
            {
              "id": "redbook",
              "label": "小红书"
            },
            {
              "id": "instagram",
              "label": "Instagram"
            },
            {
              "id": "music",
              "label": "音乐"
            },
            {
              "id": "reading",
              "label": "阅读"
            },
            {
              "id": "game",
              "label": "游戏"
            },
            {
              "id": "browser",
              "label": "Safari"
            },
            {
              "id": "house",
              "label": "小屋"
            },
            {
              "id": "pet",
              "label": "宠物"
            },
            {
              "id": "online",
              "label": "联机"
            },
            {
              "id": "store",
              "label": "App Store"
            },
            {
              "id": "phone",
              "label": "电话/전화"
            },
            {
              "id": "message",
              "label": "信息"
            },
            {
              "id": "theme",
              "label": "主题"
            },
            {
              "id": "settings",
              "label": "设置"
            },
            {
              "id": "roster",
              "label": "名册"
            },
            {
              "id": "memory",
              "label": "记忆"
            }
          ]
        },
        "lockScreen": {
          "settingKey": "themeLockScreen",
          "strategy": "freeImage",
          "defaultState": {
            "enabled": true,
            "passwordEnabled": false,
            "password": ""
          }
        }
      },
      "image": {
        "maxInputBytes": 20971520,
        "maxInputPixels": 40000000,
        "encode": {
          "passes": 8,
          "minQuality": 0.64,
          "qualityStep": 0.08,
          "scaleStep": 0.84
        },
        "strategies": {
          "freeImage": {
            "maxSide": 1600,
            "maxPixels": 2200000,
            "maxBytes": 1350000,
            "type": "image/webp",
            "quality": 0.86,
            "fit": "contain"
          },
          "squareImage": {
            "maxSide": 1200,
            "maxPixels": 1440000,
            "maxBytes": 900000,
            "type": "image/webp",
            "quality": 0.88,
            "fit": "square"
          }
        }
      },
      "styleControls": {
        "backgroundTransparency": {
          "key": "backgroundTransparency",
          "type": "range",
          "label": "背景透明/배경 투명",
          "min": 0,
          "max": 100,
          "step": 1,
          "suffix": "%"
        },
        "selfBubbleColor": {
          "key": "selfBubbleColor",
          "type": "color",
          "label": "我方气泡颜色/내 말풍선 색상",
          "cssVar": "--chat-self-bg"
        },
        "peerBubbleColor": {
          "key": "peerBubbleColor",
          "type": "color",
          "label": "对方气泡颜色/상대 말풍선 색상",
          "cssVar": "--chat-peer-bg"
        },
        "photoIconColor": {
          "key": "photoIconColor",
          "type": "color",
          "label": "图标颜色/아이콘 색상",
          "cssVar": "--photo-icon-color"
        },
        "bubbleTail": {
          "key": "bubbleTail",
          "type": "choice",
          "label": "小尾巴/말풍선 꼬리",
          "attribute": "data-chat-tail",
          "options": [
            {
              "value": "end",
              "label": "尾部/끝"
            },
            {
              "value": "start",
              "label": "头部/시작"
            },
            {
              "value": "none",
              "label": "不显示/숨김"
            }
          ]
        }
      },
      "components": {
        "profile": {
          "title": "个人资料",
          "subtitle": "프로필 편집",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "cover",
              "label": "背景图/배경 이미지",
              "strategy": "freeImage"
            },
            {
              "key": "avatar",
              "label": "头像/프로필 사진",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "nickname",
              "label": "昵称/닉네임",
              "placeholder": "输入昵称/닉네임 입력"
            },
            {
              "key": "account",
              "label": "账号/계정",
              "placeholder": "输入账号/계정 입력"
            },
            {
              "key": "bio",
              "label": "个性签名/소개글",
              "placeholder": "输入个性签名/소개글 입력"
            },
            {
              "key": "location",
              "label": "定位/위치",
              "placeholder": "输入定位/위치 입력"
            }
          ],
          "resetLabel": "重置此组件",
          "resetText": "当前组件内的图片、资料与背景透明度将恢复为默认状态。",
          "defaultState": {
            "cover": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 0,
            "nickname": "昵称",
            "account": "@账号",
            "bio": "个性签名",
            "location": "定位"
          }
        },
        "airdrop": {
          "title": "隔空投送",
          "subtitle": "에어드롭",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "image",
              "label": "共享图片/공유 이미지",
              "strategy": "freeImage"
            }
          ],
          "fields": [
            {
              "key": "title",
              "label": "标题/제목",
              "placeholder": "输入标题/제목 입력"
            },
            {
              "key": "subtitle",
              "label": "共享提示/공유 안내",
              "placeholder": "输入共享提示/공유 안내 입력"
            },
            {
              "key": "leftAction",
              "label": "左侧操作/왼쪽 동작",
              "placeholder": "输入左侧操作/왼쪽 동작 입력"
            },
            {
              "key": "rightAction",
              "label": "右侧操作/오른쪽 동작",
              "placeholder": "输入右侧操作/오른쪽 동작 입력"
            }
          ],
          "resetLabel": "重置此组件",
          "resetText": "隔空投送组件的图片、文案与背景透明度将恢复为默认状态。",
          "defaultState": {
            "image": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 0,
            "title": "隔空投送",
            "subtitle": "Ta想要共享一张照片给你",
            "leftAction": "拒绝",
            "rightAction": "接收"
          }
        },
        "calendar": {
          "title": "个人日历",
          "subtitle": "캘린더",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "avatar",
              "label": "头像/프로필 사진",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "name",
              "label": "昵称/닉네임",
              "placeholder": "输入昵称/닉네임 입력"
            },
            {
              "key": "bio",
              "label": "个性签名/소개글",
              "placeholder": "输入个性签名/소개글 입력"
            }
          ],
          "resetLabel": "重置此组件",
          "resetText": "个人日历组件的头像、资料与背景透明度将恢复为默认状态。",
          "defaultState": {
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 0,
            "name": "昵称",
            "bio": "个性签名"
          }
        },
        "photo": {
          "title": "图片组件",
          "subtitle": "포토 위젯",
          "controls": [
            "photoIconColor",
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "image",
              "label": "图片/이미지",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "notice",
              "label": "提示文案/안내 문구",
              "placeholder": "输入提示文案/안내 문구 입력"
            }
          ],
          "resetLabel": "重置此组件",
          "resetText": "图片组件的图片、提示文案、图标颜色与背景透明度将恢复为默认状态。",
          "defaultState": {
            "image": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 100,
            "photoIconColor": {
              "$css": "--theme-primary"
            },
            "notice": "该图片涉萌已被处理"
          }
        },
        "chat": {
          "title": "对话组件",
          "subtitle": "채팅 위젯",
          "controls": [
            "selfBubbleColor",
            "peerBubbleColor",
            "bubbleTail",
            "backgroundTransparency"
          ],
          "media": [],
          "fields": [
            {
              "key": "message1",
              "label": "文案 1/문구 1",
              "placeholder": "输入文案 1/문구 1 입력"
            },
            {
              "key": "message2",
              "label": "文案 2/문구 2",
              "placeholder": "输入文案 2/문구 2 입력"
            },
            {
              "key": "message3",
              "label": "文案 3/문구 3",
              "placeholder": "输入文案 3/문구 3 입력"
            }
          ],
          "resetLabel": "重置此组件",
          "resetText": "对话组件的文案、气泡颜色、小尾巴与背景透明度将恢复为默认状态。",
          "defaultState": {
            "backgroundTransparency": 0,
            "selfBubbleColor": {
              "$css": "--theme-primary"
            },
            "peerBubbleColor": {
              "$css": "--surface-soft"
            },
            "bubbleTail": "end",
            "message1": "文案1",
            "message2": "文案2",
            "message3": "文案3"
          }
        },
        "polaroid": {
          "title": "拍立得组件",
          "subtitle": "폴라로이드",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "leftPhoto",
              "label": "左侧图片/왼쪽 이미지",
              "strategy": "squareImage"
            },
            {
              "key": "rightPhoto",
              "label": "右侧图片/오른쪽 이미지",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "bubble",
              "label": "气泡文案/말풍선 문구",
              "placeholder": "输入气泡文案/문구 입력"
            },
            {
              "key": "tag",
              "label": "日文注解/일본어 주석",
              "placeholder": "输入日文注解/주석 입력"
            },
            {
              "key": "caption",
              "label": "底部文案/하단 문구",
              "placeholder": "输入底部文案/문구 입력"
            }
          ],
          "resetLabel": "重置拍立得组件",
          "resetText": "拍立得组件的两张图片、气泡文案与背景透明度将恢复为默认状态。",
          "defaultState": {
            "leftPhoto": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "rightPhoto": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 100,
            "bubble": "작은 우…🤍 🖤",
            "tag": "かわゆい♥",
            "caption": "yummy"
          }
        },
        "status": {
          "title": "个人状态",
          "subtitle": "상태 위젯",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "avatar",
              "label": "头像/프로필 사진",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "nickname",
              "label": "昵称/닉네임",
              "placeholder": "输入昵称/닉네임 입력"
            },
            {
              "key": "bubble1",
              "label": "文案 1/문구 1",
              "placeholder": "输入文案 1"
            },
            {
              "key": "bubble2",
              "label": "文案 2/문구 2",
              "placeholder": "输入文案 2"
            },
            {
              "key": "bubble3",
              "label": "文案 3/문구 3",
              "placeholder": "输入文案 3"
            },
            {
              "key": "bubble4",
              "label": "文案 4/문구 4",
              "placeholder": "输入文案 4"
            }
          ],
          "resetLabel": "重置个人状态",
          "resetText": "个人状态组件的头像、昵称、四条文案与背景透明度将恢复为默认状态。",
          "defaultState": {
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 0,
            "nickname": "昵称",
            "bubble1": "文案1",
            "bubble2": "文案2",
            "bubble3": "文案3",
            "bubble4": "文案4"
          }
        },
        "caller": {
          "title": "来电组件",
          "subtitle": "수신 위젯",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "avatar",
              "label": "好友头像/친구 프로필",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "name",
              "label": "好友/친구",
              "placeholder": "输入好友名称/친구 이름 입력"
            }
          ],
          "resetLabel": "重置来电组件",
          "resetText": "来电组件的好友头像、名称与背景透明度将恢复为默认状态。",
          "defaultState": {
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 0,
            "name": "好友"
          }
        },
        "diary": {
          "title": "日记组件",
          "subtitle": "다이어리",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [
            {
              "key": "avatar",
              "label": "头像/프로필 사진",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "title",
              "label": "英文标题/영어 제목",
              "placeholder": "输入英文标题/제목 입력"
            },
            {
              "key": "prompt",
              "label": "输入提示/입력 문구",
              "placeholder": "输入提示文案/문구 입력"
            }
          ],
          "resetLabel": "重置日记组件",
          "resetText": "日记组件的头像、英文标题、提示文案与背景透明度将恢复为默认状态。",
          "defaultState": {
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "backgroundTransparency": 0,
            "title": "Diary",
            "prompt": "写点什么"
          }
        },
        "moments": {
          "title": "动态资料",
          "subtitle": "모먼트 프로필",
          "controls": [],
          "media": [
            {
              "key": "cover",
              "label": "背景图/배경 이미지",
              "strategy": "freeImage"
            },
            {
              "key": "avatar",
              "label": "头像/프로필 사진",
              "strategy": "squareImage"
            }
          ],
          "fields": [
            {
              "key": "nickname",
              "label": "昵称/닉네임",
              "placeholder": "输入昵称/닉네임 입력"
            },
            {
              "key": "ip",
              "label": "IP/IP",
              "placeholder": "输入 IP/IP 입력"
            },
            {
              "key": "signature",
              "label": "个性签名/소개글",
              "placeholder": "输入个性签名/소개글 입력"
            },
            {
              "key": "following",
              "label": "关注/팔로잉",
              "placeholder": "输入关注数/팔로잉 수 입력"
            },
            {
              "key": "followers",
              "label": "粉丝/팔로워",
              "placeholder": "输入粉丝数/팔로워 수 입력"
            },
            {
              "key": "likes",
              "label": "获赞/좋아요",
              "placeholder": "输入获赞数/좋아요 수 입력"
            }
          ],
          "resetLabel": "重置动态资料",
          "resetText": "动态背景图、头像与全部资料数据将恢复为默认状态。",
          "defaultState": {
            "cover": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "nickname": "@昵称",
            "ip": "IP",
            "signature": "个性签名",
            "following": "1",
            "followers": "52w",
            "likes": "1314w"
          }
        },
        "contacts": {
          "title": "通讯录",
          "subtitle": "연락처 편집",
          "controls": [],
          "media": [],
          "fields": [
            {
              "key": "account",
              "label": "账号/계정",
              "placeholder": "输入账号/계정 입력"
            },
            {
              "key": "koreanName",
              "label": "语言1/한국어 이름",
              "placeholder": "输入语言1/한국어 이름 입력"
            },
            {
              "key": "koreanPhrase",
              "label": "韩语文案/한국어 문구",
              "placeholder": "输入韩语文案/한국어 문구 입력"
            },
            {
              "key": "englishName",
              "label": "语言2/영어 이름",
              "placeholder": "输入语言2/영어 이름 입력"
            },
            {
              "key": "englishPhrase",
              "label": "英语文案/영어 문구",
              "placeholder": "输入英语文案/영어 문구 입력"
            }
          ],
          "resetLabel": "重置通讯录",
          "resetText": "通讯录账号与双语文案将恢复为默认状态。",
          "defaultState": {
            "account": "@Ymoi1131",
            "koreanName": "Korean",
            "koreanPhrase": "☆·행복…은 손에 닿을 듯 가깝다.✤☆",
            "englishName": "English (UK)",
            "englishPhrase": "☆+Happiness… is close as if it's within reach. *☆"
          }
        },
        "messages": {
          "title": "消息页图片",
          "subtitle": "메시지 이미지 편집",
          "controls": [],
          "media": [
            {
              "key": "artwork",
              "label": "主图片/메인 이미지",
              "strategy": "squareImage"
            },
            {
              "key": "miniArtwork",
              "label": "小图片/미니 이미지",
              "strategy": "squareImage"
            }
          ],
          "fields": [],
          "resetLabel": "重置消息页图片",
          "resetText": "仅消息页主图片与小图片将恢复为默认状态；右侧歌曲区域、歌词、播放区与简讯记录不会被修改。",
          "defaultState": {
            "artwork": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "miniArtwork": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            }
          }
        },
        "me": {
          "title": "我页",
          "subtitle": "내 페이지 편집",
          "controls": [],
          "media": [
            {
              "key": "avatar",
              "label": "头像/프로필 사진",
              "strategy": "squareImage"
            },
            {
              "key": "homeMedia",
              "label": "Homepage 图片/홈페이지 이미지",
              "strategy": "freeImage"
            }
          ],
          "fields": [
            {
              "key": "nickname",
              "label": "昵称/닉네임",
              "placeholder": "输入昵称/닉네임 입력"
            },
            {
              "key": "signature",
              "label": "个性签名/소개글",
              "placeholder": "输入个性签名/소개글 입력"
            },
            {
              "key": "tag",
              "label": "标签/태그",
              "placeholder": "输入标签/태그 입력"
            },
            {
              "key": "homeTitle",
              "label": "Homepage 标题/홈페이지 제목",
              "placeholder": "输入 Homepage 标题/제목 입력"
            },
            {
              "key": "homeCopy",
              "label": "Homepage 文案/홈페이지 문구",
              "placeholder": "输入 Homepage 文案/문구 입력"
            },
            {
              "key": "menu1",
              "label": "功能入口 1/메뉴 1",
              "placeholder": "输入功能入口 1/메뉴 입력"
            },
            {
              "key": "menu2",
              "label": "功能入口 2/메뉴 2",
              "placeholder": "输入功能入口 2/메뉴 입력"
            },
            {
              "key": "menu3",
              "label": "功能入口 3/메뉴 3",
              "placeholder": "输入功能入口 3/메뉴 입력"
            },
            {
              "key": "menu4",
              "label": "功能入口 4/메뉴 4",
              "placeholder": "输入功能入口 4/메뉴 입력"
            },
            {
              "key": "menu5",
              "label": "功能入口 5/메뉴 5",
              "placeholder": "输入功能入口 5/메뉴 입력"
            },
            {
              "key": "menu6",
              "label": "功能入口 6/메뉴 6",
              "placeholder": "输入功能入口 6/메뉴 입력"
            }
          ],
          "resetLabel": "重置我页内容",
          "resetText": "我页头像、Homepage 图片与全部可编辑文案将恢复为默认状态。",
          "defaultState": {
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "homeMedia": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            },
            "nickname": "昵称",
            "signature": "个性签名",
            "tag": "标签",
            "homeTitle": "Homepage",
            "homeCopy": "冬天会周而复始 该相逢的人会再相逢 所以我们不用总惦记遗憾 而是要学会期待",
            "menu1": "收藏/즐겨찾기",
            "menu2": "名片/명함",
            "menu3": "表情/이모티콘",
            "menu4": "美化/꾸미기",
            "menu5": "分组/그룹",
            "menu6": "设置/설정"
          }
        },
        "dock": {
          "title": "底部 Dock",
          "subtitle": "독",
          "controls": [
            "backgroundTransparency"
          ],
          "media": [],
          "fields": [],
          "resetLabel": "重置此组件",
          "resetText": "Dock 背景透明度将恢复为默认状态。",
          "defaultState": {
            "backgroundTransparency": 60
          }
        }
      },
      "editorViews": {
        "settingsAvatar": {
          "title": "更换头像",
          "subtitle": "프로필 사진",
          "sourceType": "profile",
          "media": [
            {
              "key": "avatar",
              "label": "头像/프로필 사진",
              "strategy": "squareImage"
            }
          ],
          "fields": [],
          "controls": [],
          "resetLabel": "重置头像",
          "resetText": "当前头像将恢复为默认状态。",
          "defaultState": {
            "avatar": {
              "assetId": null,
              "sourceType": "none",
              "sourceValue": "",
              "sourceLabel": ""
            }
          }
        }
      },
      "themeImageEditor": {
        "subtitle": "이미지 변경",
        "mediaKey": "image",
        "label": "图片/이미지",
        "fields": [],
        "controls": [],
        "resetLabel": "移除图片",
        "resetText": "当前图片将恢复为空白状态。",
        "defaultState": {
          "image": {
            "assetId": null,
            "sourceType": "none",
            "sourceValue": "",
            "sourceLabel": ""
          }
        }
      },
      "themeImages": {
        "themeWideImage": {
          "title": "更换横幅图片",
          "strategy": "freeImage"
        },
        "themeSquareImage": {
          "title": "更换方形图片",
          "strategy": "squareImage"
        }
      },
      "pager": {
        "dragThresholdRatio": 0.18,
        "velocityThreshold": 0.55,
        "edgeResistance": 0.28,
        "axisLockDistance": 6
      },
      "chat": {
        "allowedTabs": [
          "messages",
          "contacts",
          "moments",
          "me"
        ]
      },
      "worldbook": {
        "settingKey": "worldbooks",
        "scopes": {
          "global": "全局",
          "extension": "拓展"
        },
        "positions": {
          "before_char": "BEFORE CHAR",
          "after_char": "AFTER CHAR",
          "before_examples": "BEFORE EXAMPLE",
          "after_examples": "AFTER EXAMPLE",
          "top_an": "TOP AN",
          "bottom_an": "BOTTOM AN",
          "depth": "DEPTH"
        },
        "strategies": {
          "constant": "始终触发",
          "keyword": "关键词",
          "vector": "向量"
        },
        "selectiveLogics": [
          "and_any",
          "and_all",
          "not_any",
          "not_all"
        ],
        "roles": [
          "system",
          "user",
          "assistant"
        ],
        "defaults": {
          "book": {
            "name": "未命名世界书",
            "scope": "global"
          },
          "entry": {
            "memo": "",
            "strategy": "constant",
            "keys": [],
            "filters": [],
            "selectiveLogic": "and_any",
            "content": "",
            "order": 100,
            "position": "after_char",
            "depth": 0,
            "role": "system",
            "probability": 100,
            "enabled": true,
            "caseSensitive": false,
            "wholeWords": false,
            "scanDepth": ""
          }
        }
      },
      "roster": {
        "settingKey": "rosterProfiles",
        "idDigits": 16,
        "prefixes": {
          "char": "char",
          "npc": "npc",
          "userid": "userid"
        },
        "ui": {
          "defaultTab": "char",
          "title": "名册",
          "memoryTitle": "记忆",
          "addAriaLabel": "添加档案",
          "emptyLabel": "暂无档案",
          "decoration": {
            "left": "ARCHIVE",
            "editor": "PROFILE",
            "relations": "RELATION MAP"
          },
          "tabs": [
            {
              "id": "char",
              "label": "角色",
              "fileLabel": "CHARACTER FILE",
              "icon": "fa-user-group",
              "editable": true,
              "detached": false,
              "subtitle": "캐릭터"
            },
            {
              "id": "npc",
              "label": "路人",
              "fileLabel": "NPC FILE",
              "icon": "fa-users",
              "editable": true,
              "detached": false,
              "subtitle": "행인"
            },
            {
              "id": "relations",
              "label": "关系网",
              "fileLabel": "RELATION MAP",
              "icon": "fa-share-nodes",
              "editable": false,
              "detached": false,
              "subtitle": "관계망"
            },
            {
              "id": "userid",
              "label": "用户",
              "fileLabel": "USER FILE",
              "icon": "fa-user",
              "editable": true,
              "detached": true,
              "subtitle": "사용자"
            }
          ],
          "editor": {
            "addVerb": "添加",
            "editVerb": "编辑",
            "saveLabel": "保存",
            "deleteLabel": "删除档案",
            "requiredMark": "*",
            "media": [
              {
                "key": "background",
                "label": "背景图/배경 이미지",
                "icon": "fa-image",
                "strategy": "freeImage"
              },
              {
                "key": "avatar",
                "label": "头像/프로필 사진",
                "icon": "fa-user",
                "strategy": "squareImage"
              }
            ],
            "fields": [
              {
                "key": "nickname",
                "label": "昵称/닉네임",
                "kind": "input",
                "maxLength": 48,
                "required": true,
                "placeholder": "",
                "inputMode": ""
              },
              {
                "key": "name",
                "label": "姓名/이름",
                "kind": "input",
                "maxLength": 80,
                "required": false,
                "placeholder": "",
                "inputMode": ""
              },
              {
                "key": "signature",
                "label": "个性签名/소개글",
                "kind": "input",
                "maxLength": 160,
                "required": false,
                "placeholder": "",
                "inputMode": ""
              },
              {
                "key": "phone",
                "label": "电话/전화",
                "kind": "input",
                "maxLength": 64,
                "required": false,
                "placeholder": "",
                "inputMode": "tel"
              },
              {
                "key": "group",
                "label": "分组/그룹",
                "kind": "input",
                "maxLength": 48,
                "required": false,
                "placeholder": "",
                "inputMode": ""
              },
              {
                "key": "account",
                "label": "账号/계정",
                "kind": "input",
                "inputType": "text",
                "layoutGroup": "credentials",
                "maxLength": 64,
                "required": false,
                "placeholder": "输入档案账号",
                "inputMode": ""
              },
              {
                "key": "password",
                "label": "密码/비밀번호",
                "kind": "input",
                "inputType": "password",
                "layoutGroup": "credentials",
                "maxLength": 128,
                "required": false,
                "placeholder": "输入档案密码",
                "inputMode": ""
              },
              {
                "key": "nationality",
                "label": "国籍/국적",
                "kind": "input",
                "maxLength": 80,
                "required": false,
                "placeholder": "",
                "inputMode": "",
                "layoutGroup": "locale"
              },
              {
                "key": "language",
                "label": "语言/언어",
                "kind": "input",
                "maxLength": 120,
                "required": false,
                "placeholder": "",
                "inputMode": "",
                "layoutGroup": "locale"
              },
              {
                "key": "timezone",
                "label": "时区/시간대",
                "kind": "input",
                "maxLength": 80,
                "required": false,
                "placeholder": "例如 Asia/Shanghai",
                "inputMode": ""
              },
              {
                "key": "virtualLocation",
                "label": "虚拟位置/가상 위치",
                "kind": "input",
                "maxLength": 120,
                "required": false,
                "placeholder": "",
                "inputMode": "",
                "layoutGroup": "locations"
              },
              {
                "key": "mappedLocation",
                "label": "映射位置/매핑 위치",
                "kind": "input",
                "maxLength": 120,
                "required": false,
                "placeholder": "",
                "inputMode": "",
                "layoutGroup": "locations"
              },
              {
                "key": "setting",
                "label": "设定内容/설정 내용",
                "kind": "textarea",
                "required": false,
                "placeholder": "",
                "inputMode": ""
              }
            ],
            "addSubtitleVerb": "추가",
            "editSubtitleVerb": "편집",
            "importSource": {
              "title": "确认角色卡来源",
              "subtitle": "选择角色卡来源，确认后才会导入正文",
              "typeLabel": "来源类型",
              "types": [
                {
                  "value": "original",
                  "label": "本人原创"
                },
                {
                  "value": "authorized",
                  "label": "已获授权"
                },
                {
                  "value": "other",
                  "label": "其他合法来源"
                }
              ],
              "sourceRequired": "请选择角色卡来源",
              "confirmLabel": "确认导入",
              "summaryLabel": "来源",
              "selectPlaceholder": "请选择来源"
            }
          },
          "backAriaLabel": "返回",
          "ungroupedLabel": "未分组",
          "memoryMark": "MEMORY",
          "deleteConfirm": {
            "title": "删除这份档案？",
            "text": "删除后将无法恢复。",
            "confirmLabel": "删除"
          },
          "messages": {
            "saved": "档案已保存",
            "saveFailed": "档案保存失败",
            "deleted": "档案已删除",
            "deleteFailed": "档案删除失败",
            "imageFailed": "图片处理失败"
          },
          "subtitle": "명부",
          "memorySubtitle": "기억",
          "relations": {
            "addLabel": "添加关系",
            "editLabel": "编辑关系",
            "deleteLabel": "删除关系",
            "saveLabel": "保存关系",
            "detailTitle": "关系详情",
            "detailSubtitle": "RELATION DETAIL",
            "modalSubtitle": "RELATION EDITOR",
            "sourceLabel": "人物 A",
            "targetLabel": "人物 B",
            "sourceRelationLabel": "A → B：B 是 A 的…",
            "targetRelationLabel": "B → A：A 是 B 的…",
            "relationPlaceholder": "如：姐姐、朋友、上司",
            "noteLabel": "关系备注",
            "notePlaceholder": "共同经历、称呼、边界或当前关系进展",
            "focusLabel": "中心人物",
            "focusSubtitle": "选择关系网中心",
            "centerLabel": "中心",
            "countLabel": "条直接关系",
            "graphAriaLabel": "人物关系图",
            "emptyProfiles": "请先添加至少一份名册档案",
            "emptyTitle": "暂无直接关系",
            "emptyText": "点击右上角 + 为当前中心人物建立关系",
            "summaryFallback": "已建立关系",
            "unknownLabel": "未注明",
            "noRelationLabel": "尚未建立关系",
            "setFocusLabel": "设为中心",
            "messageLabel": "信息",
            "personTitle": "名册档案",
            "personSubtitle": "PROFILE",
            "deleteConfirm": {
              "title": "删除这条关系？",
              "text": "删除后，关系网与信息上下文将同步移除。",
              "confirmLabel": "删除"
            },
            "messages": {
              "saved": "关系已保存",
              "deleted": "关系已删除",
              "needProfiles": "请先在名册中添加至少两份档案",
              "needOwner": "请先添加并选择“用户”档案作为本机机主",
              "sameProfile": "不能与自己建立关系",
              "duplicate": "这两份档案已经建立关系",
              "empty": "请至少填写一个关系称谓或关系备注"
            },
            "emptySingleText": "再添加一份名册档案后即可建立关系",
            "infoTitle": "联系人信息",
            "infoSubtitle": "CONTACT INFO",
            "relationFieldLabel": "关系",
            "closeLabel": "关闭",
            "pairSeparator": "↔",
            "reverseLabel": "反向"
          }
        },
        "relationSettingKey": "rosterRelations"
      },
      "auth": {
        "protocol": "app-ui/roster-identity",
        "protocolVersion": "2.0.0",
        "sessionKey": "__app_auth_session__",
        "legacyClaimKey": "__app_legacy_claim__",
        "scopedSettings": {
          "chat": [
            "messages",
            "contacts",
            "moments",
            "me",
            "chatConversations"
          ],
          "wallet": [
            "walletData"
          ]
        },
        "ui": {
          "chat": {
            "title": "登录聊天",
            "backAriaLabel": "返回桌面",
            "usernameLabel": "账号",
            "usernamePlaceholder": "输入名册用户档案账号",
            "passwordLabel": "密码",
            "passwordPlaceholder": "输入密码",
            "submitLabel": "登录",
            "failureLabel": "登录失败"
          },
          "wallet": {
            "title": "登录钱包",
            "backAriaLabel": "返回桌面",
            "usernameLabel": "账号",
            "passwordLabel": "密码",
            "submitLabel": "登录",
            "failureLabel": "登录失败"
          }
        },
        "rosterType": "userid",
        "legacyPassword": {
          "algorithm": "PBKDF2",
          "hash": "SHA-256",
          "iterations": 600000,
          "saltBytes": 16,
          "derivedBytes": 32
        }
      }
    }
  }
};
