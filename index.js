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
  console.log(req.method);
  if (req.method === 'POST') {
    const body = await getJsonBody(req)
    body.ref
    const excludedStr = 'refs/heads/';
    const branchName = body.ref.replace(new RegExp(excludedStr, ''), ''); // 'Hell Wrld!'
    console.log("🚀 ~ file: index.js:21 ~ server ~ branchName:", branchName)
    if  (branchName === setting.targetBranch) {
      await executeFunc(req,res)
    }else{
      console.log("skipped");
    }
  }else{
    await normalFlow(req,res)
  }

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

async function normalFlow(req, res){
  if (req.url === '/execute') {
    await executeFunc(req, res)
  } else if(req.url === '/version') {
    await checkFunc(req, res)
  } else if (req.url === '/reset') {
    await resetFunc(req, res)
  } else{
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 404;
    res.end('404 Not Found');
  }
}

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

// get body from request
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

// get body and parse json
async function getJsonBody(req) {
  const body = await getBody(req);
  return JSON.parse(body);
}

async function executeFunc(req, res){
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
}

async function checkFunc(req, res){
  console.log('version');
  res.setHeader('Content-Type', 'text/plain');
  res.statusCode = 200;
  const cpRes = await executeProcess(setting.healthCheckScript)
  res.end(cpRes.data);
}

async function resetFunc(req, res){
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
}