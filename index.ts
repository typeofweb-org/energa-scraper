import { getData } from "./energa.js";
import http from "node:http";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });

const hostname = "0.0.0.0";
const port = 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    if (!cache.has("data")) {
      const data = await getData();
      cache.set("data", data);
    }

    const data = cache.get("data");
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify(err));
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
