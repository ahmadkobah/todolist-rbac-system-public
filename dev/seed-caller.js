const fs = require('fs');
const { importDB, deleteDB } = require('./seed');

const User = require('../models/userModel');
const Task = require('../models/taskModel');



const obj = {
  User: { m: User, filepath: `${__dirname}/users.json` },
  Task: { m: Task, filepath: `${__dirname}/tasks.json` }
};


const modelName = process.argv[3];
if (!obj[modelName]) {
    console.log(`Model ${modelName} not found.`);
    process.exit(1);
}

const list = JSON.parse(fs.readFileSync(obj[modelName].filepath, 'utf-8'));

if (process.argv[2] === '--import') {
    importDB(obj[modelName].m, list);
} else if (process.argv[2] === '--delete') {
    deleteDB(obj[modelName].m);
} else {
    console.log('Invalid command. Use "--import" or "--delete".');
}

