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
const validateRequest = botbye.init('MY_SERVER_KEY');
```

#### 3. Use `validateRequest` on handlers where you need bot protection

```javascript

app.get('/', async (req, res) => {
  const botbyeToken = req.headers['botbye-challenge']   // get token from header or any place you store it

  const customFileds = [
    'my custom field 1 value',
    'my custom field 2 value',
    'my custom field 3 value'
  ];

  /**
   * @param {String} botbyeToken - Token from client side
   * @param {Object} request - express request
   * @param optional {Array} customFields - Additional fields
   * @return {Promise} - botByeResponse promise
   */
  const botByeResponse = await botbye.validateRequest(botbyeToken, req, customFileds);

  const isBot = botByeResponse.result?.isBot;

  if (isBot) {
  ...
  }
...
})

```

### Examples of botByeResponse:

#### Bot detected:

```javascript
{
  reqId: 'f77b2abd-c5d7-44f0-be4f-174b04876583'
  result: {
    isBot: true
  }
,
  error: null
}
```

#### Bot not detected:

```javascript
{
  reqId: 'f77b2abd-c5d7-44f0-be4f-174b04876583'
  result: {
    isBot: false
  }
,
  error: null
}
```

#### Invalid serverKey:

```javascript
{
  reqId: 'f77b2abd-c5d7-44f0-be4f-174b04876583'
  result: null
  error: {
    message: `[BotBye] Bad Request: Invalid Server Key`
  }
}
```

#### 4. Full code example

```javascript

const express = require('express')
const botbye = require('botbye-node-express')

const app = express();

botbye.init('MY_SERVER_KEY');

app.get('/', async (req, res) => {
  const botbyeToken = req.headers['botbye-challenge']  // get token from header or any place you store it

  const botByeResponse = await botbye.validateRequest(botbyeToken, req);

  const isBot = botByeResponse.result?.isBot;

  res.status(isBot ? 403 : 200);
  res.send();
})

const PORT = 3000;

app.listen(PORT, () => {
...
})

```
