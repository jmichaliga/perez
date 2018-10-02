/*
NOTE: This process needs Server.js running on 8080
*/
const cron = require('node-cron');
const Firestore = require('@google-cloud/firestore');
const fetch = require('node-fetch');

const firestore = new Firestore({
  projectId: 'starsquad-db',
  keyFilename: 'starsquad-db-a2be5f6314b6.json',
});
firestore.settings({timestampsInSnapshots: true});

const getArtists = async () => {
  firestore.collection('artists').get()
      .then(snapshot => {
        snapshot.forEach(artist => {
          // console.log('->', artist.id, artist.data());
          scrapeArtist(artist.data(), artist.id);
        });
      }).catch(err => {
        console.log('++', err);
      });
};

const scrapeArtist = (artist, id) => {
  const sources = ['e', 'billboard', 'people', 'tmz'];
  const artistName = artist.name.toLowerCase().replace(' ', '-');

  for (let src of sources) {
    if (artist['link_'+src]) {
      if (src === 'e') {
        src = 'e-online';
      }
      console.log(artistName, 'scraping ->', 'link_'+src, 'at', artist['link_'+src]);

      fetch('http://localhost:8080/scrape?artist='+artistName+'&source='+src)
          .then(res => res.json())
          .then(resp => {
            console.log('<<', resp);
            firestore.collection('artists').doc(id).update({
              lastScraped: +new Date()
            });
          })
          .catch(err => {
            console.log('err: ', err);
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
  if (artists.length) {
    artists.forEach(artist => {
      scrapeArtist(artist);
      wait(1000);
    });
  }
};

// const task = cron.schedule('* * * * *', () => {
//   orchestrate();
// }, {
//   scheduled: false
// });

// task.start();

const wait = async (ms) => {
  const promise = new Promise((resolve, rej) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
  await promise;
}

// const repeatAt = async (ms, fn) => {
//   const promise = new Promise((resolve, reject) => {
//     setInterval(() => {
//       resolve(fn());
//     }, ms);
//   });

//   const result = await promise;
//   console.log(result);
// };

// repeatAt(1000, orchestrate);
orchestrate();
// getArtists();
