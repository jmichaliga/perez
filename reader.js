const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Firestore = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: 'perez-hilton',
  keyFilename: 'perez-hilton-dee3251643fb.json',
});

const settings = {timestampsInSnapshots: true};
firestore.settings(settings);

const PORT = process.env.PORT || 8081;
const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/read', async (request, response) => {
  const document = firestore.doc(request.query.source);
  document.get().then(doc => {
    response.status(200).send(doc);
  });
});

app.get('/search', async (request, response) => {
  const url = request.query.url;
  const scrapes = firestore.collection('scrapes');
  scrapes.where('source', '==', url).get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', doc.data());
          response.status(200).send({results: doc.data()});
        });
      })
      .catch(err => {
        console.log('Error getting result', err);
        response.status(200).send({results: []});
      });
});

app.post('/write', async (request, response) => {
  const document = firestore.doc(request.body.source);
  const content = JSON.parse(JSON.stringify(request.body.content));
  document.set(content).then(doc => {
    console.log('document saved!');
    response.status(200).send(doc);
  });
});

app.listen(PORT, function() {
  console.log(`App is listening on port ${PORT}`);
});
