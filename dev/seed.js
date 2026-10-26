require('dotenv').config();

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL)
  .then(() => console.log(' DB connected'))
  .catch(err => console.error(' DB connection error:', err));


  exports.importDB = (m, l) => {
    m.create(l)
      .then(() => { console.log('Data imported successfully'); })
      .catch(err => { console.error('Data import error:', err); })
      .finally(() => {
        process.exit();
      });
  };
  

  exports.deleteDB = (m) => {
    m.deleteMany()
      .then(() => { console.log('Data deleted successfully'); })
      .catch(err => { console.error('Data deletion error:', err); })
      .finally(() => {
        process.exit();
      });
  };

  console.log(process.argv);

