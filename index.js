const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const settingJson = fs.readFileSync('setting.json')
const setting = JSON.parse(settingJson)

const hostname = setting.host;
const port = setting.port;

// test

let running = false;
const server = http.createServer(async (req, res) => {
  console.log(req.url);
  console.log(req.url);
  console.log(req.method);
  let chunkData = '';
  req.on('data', chunk => {
    console.log(`Data chunk available: ${chunk}`)
    chunkData += chunk;
  })
  req.on('end', () => {
    //end of data
    let req = JSON.parse(chunkData)
    console.log("🚀 ~ file: index.js:25 ~ req.on ~ req:", req)
  })
  if (req.url === '/execute') {
    res.setHeader('Content-Type', 'text/plain');
    if (running) {
      console.log('already running');
      res.statusCode = 503;
      res.end('already running');
      return;
    }
    running = true;
    res.statusCode = 200;
    res.end('execute');
    await executeProcess(setting.executeScript)
    running = false;
  } else if(req.url === '/version') {
    console.log('version');
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    const cpRes = await executeProcess(setting.healthCheckScript)
    res.end(cpRes.data);
  } else if (req.url === '/reset') {
    res.setHeader('Content-Type', 'text/plain');
    if (running) {
      console.log('already resetting');
      res.statusCode = 503;
      res.end('already resetting');
      return;
    }
    running = true;
    res.statusCode = 200;
    res.end('resetting');
    await executeProcess(setting.resetScript)
    running = false;

  } else{
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 404;
    res.end('404 Not Found');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

function executeProcess(executeFile) {
  return new Promise((resolve, reject) => {
    console.log('executeProcess');
    const cp = spawn('bash', [executeFile], { env: process.env});
    let chunk = '';
    cp.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      chunk += data;
    });
    cp.on('error', (err) => {
      reject(err)
    });
    cp.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
      console.log(chunk);
      resolve(
        {
          data:chunk,
          code
        }
        );
    });
  })
}