require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const shortId = require("shortid");
mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
mongoose.connection.on('error', console.error.bind(console, 'connection error: '));
mongoose.connection.once('open', () => { console.log("Successfully connected to the MongoDB database") })

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

const URLSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL_shortener", URLSchema);


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

app.post("/api", async function(req, res) {
  const url = req.body.url;
  const urlCode = shortId.generate();

  if (!validURL(url)) {
    res.json({ error: 'invalid url' })
  }
  else {
    try {
      let obj = await URL.findOne({
        original_url: url
      });
      if (!obj) {
        obj = new URL({ original_url: url, short_url: urlCode });
        await obj.save();
      }
      res.json({
        original_url: obj.original_url,
        short_url: "[project_url]/api/" + obj.short_url
      });
    }
    catch (err) {
      console.error(err);
      res.status(500).json("Server error");
    }
  }
})

app.get("/api/:new_url", async function(req, res) {
  try {
    const obj = await URL.findOne({ short_url: req.params.new_url });
    if (obj) {
      return res.redirect(obj.original_url);
    } else {
      res.status(404).json("No URL found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
