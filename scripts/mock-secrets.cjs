const fs = require("fs");
const path = require("path");

const secretsPath = path.join("src", "secrets.json");

if (!fs.existsSync(secretsPath)) {
    fs.writeFileSync(
        secretsPath,
        JSON.stringify({
            api_secret: "mockData",
            measurement_id: "mockData",
        }),
    );
}
