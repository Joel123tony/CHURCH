import { searchSongs } from "./server/services/songService.js";

async function test() {
  const songs = await searchSongs("யேசு");
  console.log("Songs with query:", songs.length);
}

test();
