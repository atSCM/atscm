# @atscm/reload

> A proxy used to reload a browser window as changes occur

## Installation

```
npm i @atscm/reload
```

## Usage

Sample usage:

```js
import { startServer } from '@atscm/reload';

async function start() {
  // This starts a proxy to http://localhost:1234 that listens on port 3000
  const { reload } = await startServer({
    target: { host: 'localhost', port: 1234 },
    port: 3000,
  });

  // Then, later, call reload to reload all connected browsers
  setTimeout(() => reload(), 5000);
}

start().catch(console.error);
```

This module also provides a command line interface:

```
npx @atscm/reload 1234
[reload cli] Forwarding all requests from http://localhost:3000 to http://localhost:1234
[reload cli] Type `r` to reload
```

In both examples open [http://localhost:3000](http://localhost:3000) to view it in action.
