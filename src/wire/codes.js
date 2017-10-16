const CODES = {
    OP_REPLY: 1,
    OP_UPDATE: 2001,
    OP_INSERT: 2002,
    RESERVED: 2003,
    OP_QUERY: 2004,
    OP_GET_MORE: 2005,
    OP_DELETE: 2006,
    OP_KILL_CURSORS: 2007,
    OP_COMMAND: 2010,
    OP_COMMANDREPLY: 2011
}

// Wire command operation ids
module.exports = {
    OP_UPDATE: 2001,
    OP_INSERT: 2002,
    OP_DELETE: 2006,

    // Wire command operation ids
    OP_QUERY: 2004,
    OP_GETMORE: 2005,
    OP_KILL_CURSORS: 2007,

    // Query flags
    OPTS_TAILABLE_CURSOR: 2,
    OPTS_SLAVE: 4,
    OPTS_OPLOG_REPLAY: 8,
    OPTS_NO_CURSOR_TIMEOUT: 16,
    OPTS_AWAIT_DATA: 32,
    OPTS_EXHAUST: 64,
    OPTS_PARTIAL: 128,

    // Response flags
    CURSOR_NOT_FOUND: 0,
    QUERY_FAILURE: 2,
    SHARD_CONFIG_STALE: 4,
    AWAIT_CAPABLE: 8
}
