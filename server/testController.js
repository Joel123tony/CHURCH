import { getSongs } from './controllers/songController.js';

const req = { query: { search: 'aaradhanai' } };
const res = {
  status: function(code) {
    this.code = code;
    return this;
  },
  json: function(data) {
    console.log(`Status: ${this.code}`);
    console.log(`Success: ${data.success}`);
    console.log(`Songs count: ${data.data?.length}`);
    if (data.data && data.data.length > 0) {
      console.log(data.data.slice(0, 3));
    } else {
      console.log(data);
    }
  }
};

async function run() {
  await getSongs(req, res);
}

run();
