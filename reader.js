/*
NOTE: This process can run independently
*/
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const Firestore = require('@google-cloud/firestore')

const firestore = new Firestore({
  projectId: 'perez-hilton',
  keyFilename: 'perez-hilton-dee3251643fb.json',
})

const settings = {timestampsInSnapshots: true}
firestore.settings(settings)

const PORT = process.env.PORT || 8081
const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())

app.get('/read', async (request, response) => {
  const document = firestore.doc(request.query.source)
  document.get().then(doc => {
    response.status(200).send(doc)
  })
})

app.get('/search', (request, response) => {
  const url = request.query.url
  const scrapes = firestore.collection('scrapes')
  console.log('looking up ->', url)
  scrapes.where('source', '==', url).orderBy('scrapedOn').limit(1).get()
    .then(qSnapshot => {
      console.log('snap:', qSnapshot.empty)
      if (!qSnapshot.empty) {
        qSnapshot.forEach(doc => {
          console.log(url, ': ', doc.id, '=>', doc.data())
          response.status(200).send({results: doc.data()})
        })
      } else {
        response.status(200).send({results: []})
      }
    })
    .catch(err => {
      console.log('Error getting result', err)
      response.status(200).send({results: []})
    })
})

app.post('/write', async (request, response) => {
  const document = firestore.doc(request.body.source)
  const content = JSON.parse(JSON.stringify(request.body.content))
  document.set(content).then(doc => {
    console.log('document saved!')
    response.status(200).send(doc)
  })
})

app.listen(PORT, function() {
  console.log(`App is listening on port ${PORT}`)
})
