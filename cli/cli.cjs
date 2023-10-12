#!/usr/bin/env node
const initialize_package = require('./init.cjs')

const cli_command = process.argv[2]

switch (cli_command) {
    case 'init':
        initialize_package()
        break
}