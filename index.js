require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.urlencoded({ extended: false })) 
const mongoose= require('mongoose')
const dns = require ('dns')
const urlFunc = require ('url')

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema= new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  uuid:{
    type: Number,
    unique: true,
    required: true
  }
})

const counterSchema = new mongoose.Schema({
  model: { 
    type: String, 
    required: true },
  count: { 
    type: Number, 
    default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

urlSchema.pre('validate', async function (next) {
  const doc = this;

    try {
      const counter = await Counter.findOneAndUpdate(
        { model: 'urlSchema' },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );

      doc.uuid = counter.count;
      next();
    } catch (error) {
      next(error);
    }
});

const Url= mongoose.model("shortUrl",urlSchema)

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl' , async(req, res)=> {
  try{

  const {url}=req.body


  // if(url='ftp:/john-doe.invalidTLD'){
  //   console.log(req)
  // }
  console.log(url)

  const itemDocument= await Url.findOne({url:url}) 
  if(itemDocument){

    return res.status(200).json({ 
      original_url : url, 
      short_url : itemDocument.uuid
     })
  }
  const parsedUrl = new urlFunc.URL(url);


  const hostname = parsedUrl.hostname;

  await dns.lookup(hostname, async (error)=>{

    if(error){

      return res.json({ error: 'invalid url' })
    }

    const newDocument= new Url({
      url: url
    })

    const urlResponse= await newDocument.save()


    return res.status(201).json({ 
      original_url : url, 
      short_url : urlResponse.uuid
     })
    })


    } catch{
      return res.json({ error: 'invalid url' })
}

});

app.get('/api/shorturl/:shortUrl', async (req, res)=> {

  const {shortUrl}= req.params
    try{

      const itemDocument= await Url.findOne({uuid:Number(shortUrl)}) 
      if(!itemDocument.url){
        return res.status(400).json({ error: 'invalid url. shortcode is wrong' })
        }
        return res.redirect(302, itemDocument.url)
    } catch(error){

    console.log(error)
    return  res.status(400).json({ error: 'invalid url', errorMessage:error })
    }

});



// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
})
.catch((error)=>{
    console.log("Connection failed")
    console.log(error.message)
})