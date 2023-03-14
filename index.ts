import { getData as getEnergaData } from "./energa.js";
import { getData as getPgnigData } from "./pgnig.js";
import http from "node:http";
import pkg from "./package.json";

type EnergaData = Awaited<ReturnType<typeof getEnergaData>>;
type PgnigData = Awaited<ReturnType<typeof getPgnigData>>;

const cacheTimeMs = 60 * 60 * 24 * 1000;
const cache: {
  energaData?: { data: EnergaData; timestamp: number };
  pgnigData?: { data: PgnigData; timestamp: number };
} = {};

const hostname = "0.0.0.0";
const port = 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const now = Date.now();
  try {
    if (!cache.energaData || cache.energaData.timestamp + cacheTimeMs < now) {
      try {
        const data = await getEnergaData();
        cache.energaData = {
          data,
          timestamp: now,
        };
      } catch (err) {
        console.error(`Error on getEnergaData`, err);
      }
    }
    if (!cache.pgnigData || cache.pgnigData.timestamp + cacheTimeMs < now) {
      try {
        const data = await getPgnigData();
        cache.pgnigData = {
          data,
          timestamp: now,
        };
      } catch (err) {
        console.error(`Error on getPgnigData`, err);
      }
    }

    const data = {
      ...cache.energaData?.data,
      ...cache.pgnigData?.data,
    };

    res.statusCode = 200;
    console.log(data);
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(JSON.stringify(err));
  }
});

console.log(`Starting ${pkg.name}`);
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
