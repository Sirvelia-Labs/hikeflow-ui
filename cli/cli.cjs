#!/usr/bin/env node
const initialize_package = require('./init.cjs')

const cli_command = process.argv[2]

switch (cli_command) {
    case 'init':
        // TODO ADD hikeflow.config.js to tailwind.config.js
        initialize_package()
        break
    // TODO: CREATE add COMMAND TO DEFINE THE STRUCTURE OF A NEW COMPONENT (npx hikeflow add alert ./components)
}