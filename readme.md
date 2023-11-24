# Express

## Install

```bash
npm i botbye-node-express
```

or

```bash
yarn add botbye-node-express
```

### Usage

#### 1. Import `botbye` module:

```javascript
const botbye = require('botbye-node-express')
```

#### 2. Call `init` with SERVER_KEY:

```javascript
const validateRequest = botbye.init({
    serverKey: 'MY_SERVER_KEY'
});
```

#### 3. Use `validateRequest` on handlers where you need bot protection

```javascript

app.get('/', async (req, res) => {
    const botbyeToken = req.headers['botbye-challenge']   // get token from header or any place you store it

    /**
     * Additional custom fields for linking request
     **/
    const customFileds = [
        'my custom field 1 value',
        'my custom field 2 value',
        'my custom field 3 value'
    ];

    const options = {
        token: botbyeToken,
        request: req,
        customFileds,
    }

    /**
     * @param {Object} options - Options for request validation
     * @return {Promise} - botByeResponse promise
     */
    const botByeResponse = await botbye.validateRequest(options);

    const isBot = botByeResponse.result?.isBot;

    if (isBot) {
    ...
    }
...
})

```

### Examples of botByeResponse:

#### Bot detected:

```json
{
  "reqId": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "result": {
    "isAllowed": false
  },
  "error": null
}
```

#### Bot not detected:

```json
{
  "reqId": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "result": {
    "isAllowed": true
  },
  "error": null
}
```

#### Ban by rule:

```json
{
  "reqId": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "result": {
    "isAllowed": false
  },
  "error": {
    "message": "Banned by rule: ban by country"
  }
}
```

#### Invalid serverKey:

```json
{
  "reqId": "f77b2abd-c5d7-44f0-be4f-174b04876583",
  "result": null,
  "error": {
    "message": "[BotBye] Bad Request: Invalid Server Key"
  }
}
```

#### 4. Full code example

```javascript

const express = require('express')
const botbye = require('botbye-node-express')

const app = express();

botbye.init({
    serverKey: 'MY_SERVER_KEY'
});

app.get('/', async (req, res) => {
    const botbyeToken = req.headers['BotBye-Token']  // get token from header or any place you store it

    const options = {
        token: botbyeToken,
        request: req,
    }

    const botByeResponse = await botbye.validateRequest(options);

    const isAllowed = botByeResponse.result?.isAllowed ?? true;

    res.status(isAllowed ? 200 : 403);
    res.send();
})

const PORT = 3000;

app.listen(PORT, () => {
...
})

```
