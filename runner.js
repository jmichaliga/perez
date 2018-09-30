const cron = require('node-cron');
const Firestore = require('@google-cloud/firestore');
const fetch = require('node-fetch');

const firestore = new Firestore({
  projectId: 'starsquad-db',
  keyFilename: 'starsquad-db-a2be5f6314b6.json',
});
firestore.settings({timestampsInSnapshots: true});

const getArtists = async () => {
  console.log('->getArtists');
  firestore.collection('artists').get()
      .then(snapshot => {
        snapshot.forEach(artist => {
          console.log('->', artist.id, artist.data());
          scrapeArtist(artist.data());
        });
      }).catch(err => {
        console.log('++', err);
      });
};

const scrapeArtist = (artist) => {
  console.log('scraping..', artist);

  const sources = ['e', 'billboard', 'people', 'tmz'];
  const artistName = artist.name.toLowerCase().replace(' ', '-');

  for (const src of sources) {
    if (artist['link_'+src] !== null) {
      console.log('->', artist['link_'+src]);
      fetch('http://localhost:8080/scrape?artist='+artistName+'&source='+src)
          .then(res => res.json())
          .then(resp => {
            console.log('<<', resp);
          });
    }
  }
  /*
  link_e: 'https://www.eonline.com/news/justin_bieber/articles',
  link_billboard: 'https://www.billboard.com/music/justin-bieber/news',
  link_people: 'https://people.com/tag/justin-bieber/',
  link_tmz: 'http://www.tmz.com/person/justin-bieber/',
  */
};

const orchestrate = async () => {
  const artists = await getArtists();
  console.log('>', artists);
  artists.forEach(artist => {
    scrapeArtist(artist);
  });
};

// const task = cron.schedule('* * * * *', () => {
//   orchestrate();
// }, {
//   scheduled: false
// });

// task.start();

const repeatAt = async (ms, fn) => {
  const promise = new Promise((resolve, reject) => {
    setInterval(() => {
      resolve(fn());
    }, ms);
  });

  const result = await promise;
  console.log(result);
};

repeatAt(5000, orchestrate);
// getArtists();
