const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const router = express.Router();
const cors = require('cors');
const creds = require('./config')
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());

const transport  = {
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: creds.USER,
    pass: creds.PASS
  }
}
const transporter = nodemailer.createTransport(transport);
transporter.verify((error, success)=>{
  if(error){
    console.log(error)
  }
  else{
    console.log('Server is ready to take message')
  }
})
app.post('/send', (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const message = req.body.message;
  const content = `name: ${name} \n email: ${email} \n message: ${message} `

  const mail = {
    from: email,
    to: 'tusherd3@gmail.com', 
    subject: 'New Message from Doctors Portal',
    text: content
  }

  transporter.sendMail(mail, (err, data) => {
    if (err) {
      res.json({
        status: 'fail'
      })
    } else {
      res.json({
       status: 'success'
      })
    }
  })
})

const port = 5000

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aqab4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const appointmentCollection = client.db(process.env.DB_NAME).collection("appointments");
  const doctorsCollection = client.db(process.env.DB_NAME).collection("doctors");
  const feedbacksCollection = client.db(process.env.DB_NAME).collection("feedbacks");
  
  app.get('/allPatients', (req, res) => {
    appointmentCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })
  
  app.get('/allAppointments', (req, res) => {
    appointmentCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/doctors', (req, res) => {
    doctorsCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  //not working
  app.get('/feedbacks', (req, res)=>{
    feedbacksCollection.find({})
    .toArray((err, documents)=>{
      res.send(documents);
    })
  })

  app.post('/addADoctor', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    // console.log(name, email, file);
    // const filePath = `${__dirname}/doctors/${file.name}`;
    // file.mv(filePath, err => {
    //   if(err){
    //     console.log(err);
    //     res.status(500).send({msg:'Failed to upload image'});
    //   }
    // return res.send({name: file.name, path:`/${file.name}`})
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer(encImg, 'base64')
    }

    doctorsCollection.insertOne({ name, email, image })
      .then(result => {
        // fs.remove(filePath, error =>{
        //   if(error){
        //     console.log(error);
        //     res.status(500).send({msg:'Failed to upload image'});
        //   }
        res.send(result.acknowledged);
        // })

      })
    // })
  })

  app.post('/addAppointment', (req, res) => {
    const appointment = req.body;
    appointmentCollection.insertOne(appointment)
      .then(result => {
        res.send(result.acknowledged);
      })
  })

  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorsCollection.find({ email: email })
      .toArray((err, doctors) => {
        const filter = { appointmentDate: date.date }
        console.log(doctors);
        if (doctors.length === 0) {
          filter.email = email;
        }
        appointmentCollection.find(filter)
          .toArray((err, documents) => {
            res.send(documents);
          })
      })
  })

  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorsCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0);
      })
  })

  app.post('/addFeedback', (req, res) => {
    feedbacksCollection.insertOne(req.body)
    .then(result =>{
      res.send(result.acknowledged);
    })
  })
  

});


app.listen(process.env.PORT || port);