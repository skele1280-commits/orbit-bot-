const fs = require('fs');
const path = './activity-log.jsonl';

function logToFile(data) {
    const activityEvent = JSON.stringify(data, null, 2);
    fs.appendFile(path, `${activityEvent}\n`, (err) => {
        if (err) throw err;
        console.log('Logged:', data.type);
    });
}

module.exports = { logToFile };