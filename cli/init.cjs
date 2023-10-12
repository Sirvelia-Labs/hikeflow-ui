const fs = require('fs-extra')

const FILE_PATH = './hikeflow.config.js'

module.exports = initialize_package = () => {
    const hikeflow_theme_config = {
        example_component: {
            customizable_example: 'example_class'
        }
    }

    const file_content = `module.exports = ${JSON.stringify(hikeflow_theme_config, null, 4)}`

    fs.writeFileSync(FILE_PATH, file_content, 'utf-8')

    console.log("Package initialized successfully.")
}